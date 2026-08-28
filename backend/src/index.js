import { errorResponse, HttpError, json, readJson, withCors } from './lib/http.js'
import { safeSecretEqual, hashPassword } from './lib/security.js'
import {
  normalizeUsername,
  parsePagination,
  parsePositiveInt,
  validateDate,
  validateEmail,
  validatePassword,
  validateRequiredText,
  validateStatus,
  validateTime,
  validateUsername,
} from './lib/validation.js'
import { dateInTimezone, dayBefore, nowIso } from './lib/dates.js'
import { translateDatabaseError } from './lib/db-errors.js'

function requireBootstrapKey(request, env) {
  const configured = env.BOOTSTRAP_API_KEY
  if (!configured) {
    throw new HttpError(503, 'BOOTSTRAP_API_KEY belum dikonfigurasi pada Worker.')
  }

  const provided = request.headers.get('x-setup-key')
  if (!safeSecretEqual(provided, configured)) {
    throw new HttpError(401, 'Setup key tidak valid.')
  }
}

function parseIdFromPath(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null
  const remainder = pathname.slice(prefix.length)
  if (!/^\d+$/.test(remainder)) return null
  return Number(remainder)
}

async function resolveRoleId(db, body) {
  if (body.role_id != null) {
    const roleId = parsePositiveInt(body.role_id, 'Role')
    const role = await db.prepare('SELECT id, code, name FROM roles WHERE id = ?1 LIMIT 1').bind(roleId).first()
    if (!role) throw new HttpError(422, 'Role tidak ditemukan.')
    return role.id
  }

  const roleCode = String(body.role_code || '').trim().toUpperCase()
  if (!roleCode) throw new HttpError(422, 'Role wajib dipilih.')
  const role = await db.prepare('SELECT id, code, name FROM roles WHERE code = ?1 COLLATE NOCASE LIMIT 1').bind(roleCode).first()
  if (!role) throw new HttpError(422, 'Role tidak ditemukan.')
  return role.id
}

async function ensurePositionExists(db, positionId, { activeOnly = false } = {}) {
  const sql = activeOnly
    ? "SELECT id, name, status FROM positions WHERE id = ?1 AND status = 'ACTIVE' LIMIT 1"
    : 'SELECT id, name, status FROM positions WHERE id = ?1 LIMIT 1'
  const position = await db.prepare(sql).bind(positionId).first()
  if (!position) {
    throw new HttpError(422, activeOnly ? 'Jabatan aktif tidak ditemukan.' : 'Jabatan tidak ditemukan.')
  }
  return position
}

async function listRoles(env) {
  const result = await env.DB.prepare('SELECT id, code, name FROM roles ORDER BY id ASC').all()
  return json({ ok: true, data: result.results || [] })
}

async function listPositions(request, env) {
  const url = new URL(request.url)
  const { page, limit, offset } = parsePagination(url)
  const search = (url.searchParams.get('search') || '').trim()
  const status = (url.searchParams.get('status') || '').trim().toUpperCase()

  const conditions = []
  const values = []

  if (search) {
    conditions.push('(p.name LIKE ? COLLATE NOCASE OR r.name LIKE ? COLLATE NOCASE)')
    values.push(`%${search}%`, `%${search}%`)
  }
  if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
    conditions.push('p.status = ?')
    values.push(status)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const countStmt = env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM positions p
    JOIN roles r ON r.id = p.role_id
    ${where}
  `).bind(...values)

  const dataStmt = env.DB.prepare(`
    SELECT
      p.id,
      p.name,
      p.role_id,
      r.code AS role_code,
      r.name AS role_name,
      p.work_start,
      p.work_end,
      p.status,
      p.created_at,
      p.updated_at,
      (
        SELECT COUNT(*)
        FROM employee_position_history eph
        WHERE eph.position_id = p.id AND eph.end_date IS NULL
      ) AS active_employee_count
    FROM positions p
    JOIN roles r ON r.id = p.role_id
    ${where}
    ORDER BY p.name COLLATE NOCASE ASC
    LIMIT ? OFFSET ?
  `).bind(...values, limit, offset)

  const [countResult, dataResult] = await env.DB.batch([countStmt, dataStmt])
  const total = Number(countResult.results?.[0]?.total || 0)

  return json({
    ok: true,
    data: dataResult.results || [],
    pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
  })
}

async function createPosition(request, env) {
  const body = await readJson(request)
  const name = validateRequiredText(body.name, 'Nama jabatan')
  const roleId = await resolveRoleId(env.DB, body)
  const workStart = validateTime(body.work_start, 'Jam masuk')
  const workEnd = validateTime(body.work_end, 'Jam pulang')
  const status = validateStatus(body.status)

  if (workEnd <= workStart) throw new HttpError(422, 'Jam pulang harus lebih besar dari jam masuk.')

  const timestamp = nowIso()
  const result = await env.DB.prepare(`
    INSERT INTO positions (name, role_id, work_start, work_end, status, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
  `).bind(name, roleId, workStart, workEnd, status, timestamp).run()

  const row = await env.DB.prepare(`
    SELECT p.id, p.name, p.role_id, r.code AS role_code, r.name AS role_name,
           p.work_start, p.work_end, p.status, p.created_at, p.updated_at
    FROM positions p JOIN roles r ON r.id = p.role_id
    WHERE p.id = ?1
  `).bind(result.meta.last_row_id).first()

  return json({ ok: true, data: row }, 201)
}

async function updatePosition(request, env, positionId) {
  const existing = await env.DB.prepare('SELECT * FROM positions WHERE id = ?1 LIMIT 1').bind(positionId).first()
  if (!existing) throw new HttpError(404, 'Jabatan tidak ditemukan.')

  const body = await readJson(request)
  const name = body.name == null ? existing.name : validateRequiredText(body.name, 'Nama jabatan')
  const roleId = body.role_id == null && body.role_code == null ? existing.role_id : await resolveRoleId(env.DB, body)
  const workStart = body.work_start == null ? existing.work_start : validateTime(body.work_start, 'Jam masuk')
  const workEnd = body.work_end == null ? existing.work_end : validateTime(body.work_end, 'Jam pulang')
  const status = body.status == null ? existing.status : validateStatus(body.status)

  if (workEnd <= workStart) throw new HttpError(422, 'Jam pulang harus lebih besar dari jam masuk.')

  await env.DB.prepare(`
    UPDATE positions
    SET name = ?1, role_id = ?2, work_start = ?3, work_end = ?4, status = ?5, updated_at = ?6
    WHERE id = ?7
  `).bind(name, roleId, workStart, workEnd, status, nowIso(), positionId).run()

  const row = await env.DB.prepare(`
    SELECT p.id, p.name, p.role_id, r.code AS role_code, r.name AS role_name,
           p.work_start, p.work_end, p.status, p.created_at, p.updated_at
    FROM positions p JOIN roles r ON r.id = p.role_id
    WHERE p.id = ?1
  `).bind(positionId).first()

  return json({ ok: true, data: row })
}

async function deletePosition(env, positionId) {
  const existing = await env.DB.prepare('SELECT id, name FROM positions WHERE id = ?1 LIMIT 1').bind(positionId).first()
  if (!existing) throw new HttpError(404, 'Jabatan tidak ditemukan.')

  const used = await env.DB.prepare('SELECT COUNT(*) AS total FROM employee_position_history WHERE position_id = ?1').bind(positionId).first('total')
  if (Number(used || 0) > 0) {
    throw new HttpError(409, 'Jabatan sudah memiliki histori. Ubah status menjadi Nonaktif, jangan hapus.')
  }

  await env.DB.prepare('DELETE FROM positions WHERE id = ?1').bind(positionId).run()
  return json({ ok: true, data: { id: positionId } })
}

async function listEmployees(request, env) {
  const url = new URL(request.url)
  const { page, limit, offset } = parsePagination(url)
  const search = (url.searchParams.get('search') || '').trim()
  const status = (url.searchParams.get('status') || '').trim().toUpperCase()
  const positionIdParam = url.searchParams.get('position_id')

  const conditions = ["a.account_type = 'EMPLOYEE'"]
  const values = []

  if (search) {
    conditions.push('(e.name LIKE ? COLLATE NOCASE OR a.username LIKE ? COLLATE NOCASE OR e.email LIKE ? COLLATE NOCASE OR p.name LIKE ? COLLATE NOCASE)')
    const term = `%${search}%`
    values.push(term, term, term, term)
  }
  if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
    conditions.push('e.status = ?')
    values.push(status)
  }
  if (positionIdParam) {
    const positionId = parsePositiveInt(positionIdParam, 'Jabatan')
    conditions.push('p.id = ?')
    values.push(positionId)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const joins = `
    JOIN accounts a ON a.employee_id = e.id
    LEFT JOIN employee_position_history eph ON eph.employee_id = e.id AND eph.end_date IS NULL
    LEFT JOIN positions p ON p.id = eph.position_id
    LEFT JOIN roles r ON r.id = p.role_id
  `

  const countStmt = env.DB.prepare(`SELECT COUNT(*) AS total FROM employees e ${joins} ${where}`).bind(...values)
  const dataStmt = env.DB.prepare(`
    SELECT
      e.id,
      e.name,
      a.username,
      e.email,
      e.status,
      p.id AS position_id,
      p.name AS position_name,
      r.code AS role_code,
      r.name AS role_name,
      p.work_start,
      p.work_end,
      eph.start_date AS position_start_date,
      e.created_at,
      e.updated_at
    FROM employees e
    ${joins}
    ${where}
    ORDER BY e.name COLLATE NOCASE ASC
    LIMIT ? OFFSET ?
  `).bind(...values, limit, offset)

  const [countResult, dataResult] = await env.DB.batch([countStmt, dataStmt])
  const total = Number(countResult.results?.[0]?.total || 0)

  return json({
    ok: true,
    data: dataResult.results || [],
    pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
  })
}

async function getEmployee(env, employeeId) {
  const employee = await env.DB.prepare(`
    SELECT
      e.id,
      e.name,
      a.username,
      e.email,
      e.status,
      p.id AS position_id,
      p.name AS position_name,
      r.code AS role_code,
      r.name AS role_name,
      p.work_start,
      p.work_end,
      eph.start_date AS position_start_date,
      e.created_at,
      e.updated_at
    FROM employees e
    JOIN accounts a ON a.employee_id = e.id AND a.account_type = 'EMPLOYEE'
    LEFT JOIN employee_position_history eph ON eph.employee_id = e.id AND eph.end_date IS NULL
    LEFT JOIN positions p ON p.id = eph.position_id
    LEFT JOIN roles r ON r.id = p.role_id
    WHERE e.id = ?1
    LIMIT 1
  `).bind(employeeId).first()

  if (!employee) throw new HttpError(404, 'Karyawan tidak ditemukan.')

  const history = await env.DB.prepare(`
    SELECT eph.id, eph.position_id, p.name AS position_name, r.code AS role_code, r.name AS role_name,
           eph.start_date, eph.end_date
    FROM employee_position_history eph
    JOIN positions p ON p.id = eph.position_id
    JOIN roles r ON r.id = p.role_id
    WHERE eph.employee_id = ?1
    ORDER BY eph.start_date DESC, eph.id DESC
  `).bind(employeeId).all()

  return json({ ok: true, data: { ...employee, position_history: history.results || [] } })
}

async function createEmployee(request, env) {
  const body = await readJson(request)
  const name = validateRequiredText(body.name, 'Nama karyawan')
  const username = validateUsername(body.username)
  const email = validateEmail(body.email)
  const password = validatePassword(body.password)
  const status = validateStatus(body.status)
  const positionId = parsePositiveInt(body.position_id, 'Jabatan')
  await ensurePositionExists(env.DB, positionId, { activeOnly: true })

  const startDate = body.position_start_date
    ? validateDate(body.position_start_date, 'Tanggal mulai jabatan')
    : dateInTimezone(env.APP_TIMEZONE || 'Asia/Jakarta')
  const timestamp = nowIso()
  const passwordHash = await hashPassword(password)

  const insertEmployee = env.DB.prepare(`
    INSERT INTO employees (name, email, status, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?4)
  `).bind(name, email, status, timestamp)

  const employeeResult = await insertEmployee.run()
  const employeeId = Number(employeeResult.meta.last_row_id)

  try {
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO employee_position_history (employee_id, position_id, start_date, end_date, created_at)
        VALUES (?1, ?2, ?3, NULL, ?4)
      `).bind(employeeId, positionId, startDate, timestamp),
      env.DB.prepare(`
        INSERT INTO accounts (account_type, employee_id, username, password_hash, password_changed_at, created_at, updated_at)
        VALUES ('EMPLOYEE', ?1, ?2, ?3, ?4, ?4, ?4)
      `).bind(employeeId, username, passwordHash, timestamp),
    ])
  } catch (error) {
    await env.DB.prepare('DELETE FROM employees WHERE id = ?1').bind(employeeId).run()
    throw error
  }

  return getEmployee(env, employeeId).then(async (response) => {
    const payload = await response.json()
    return json(payload, 201)
  })
}

async function updateEmployee(request, env, employeeId) {
  const current = await env.DB.prepare(`
    SELECT e.id, e.name, e.email, e.status, a.username,
           eph.id AS history_id, eph.position_id, eph.start_date AS position_start_date
    FROM employees e
    JOIN accounts a ON a.employee_id = e.id AND a.account_type = 'EMPLOYEE'
    LEFT JOIN employee_position_history eph ON eph.employee_id = e.id AND eph.end_date IS NULL
    WHERE e.id = ?1
    LIMIT 1
  `).bind(employeeId).first()
  if (!current) throw new HttpError(404, 'Karyawan tidak ditemukan.')

  const body = await readJson(request)
  const name = body.name == null ? current.name : validateRequiredText(body.name, 'Nama karyawan')
  const email = body.email == null ? current.email : validateEmail(body.email)
  const username = body.username == null ? current.username : validateUsername(body.username)
  const status = body.status == null ? current.status : validateStatus(body.status)
  const timestamp = nowIso()

  let newPositionId = current.position_id
  if (body.position_id != null) {
    newPositionId = parsePositiveInt(body.position_id, 'Jabatan')
    await ensurePositionExists(env.DB, newPositionId, { activeOnly: true })
  }

  const statements = [
    env.DB.prepare(`
      UPDATE employees SET name = ?1, email = ?2, status = ?3, updated_at = ?4 WHERE id = ?5
    `).bind(name, email, status, timestamp, employeeId),
    env.DB.prepare(`
      UPDATE accounts SET username = ?1, updated_at = ?2 WHERE employee_id = ?3 AND account_type = 'EMPLOYEE'
    `).bind(username, timestamp, employeeId),
  ]

  if (newPositionId && Number(newPositionId) !== Number(current.position_id)) {
    const effectiveDate = body.position_effective_date
      ? validateDate(body.position_effective_date, 'Tanggal efektif jabatan')
      : dateInTimezone(env.APP_TIMEZONE || 'Asia/Jakarta')

    if (current.position_start_date && effectiveDate < current.position_start_date) {
      throw new HttpError(422, 'Tanggal efektif jabatan tidak boleh lebih awal dari jabatan aktif saat ini.')
    }

    if (current.history_id && effectiveDate === current.position_start_date) {
      statements.push(
        env.DB.prepare('UPDATE employee_position_history SET position_id = ?1 WHERE id = ?2').bind(newPositionId, current.history_id),
      )
    } else {
      if (current.history_id) {
        statements.push(
          env.DB.prepare('UPDATE employee_position_history SET end_date = ?1 WHERE id = ?2')
            .bind(dayBefore(effectiveDate), current.history_id),
        )
      }
      statements.push(
        env.DB.prepare(`
          INSERT INTO employee_position_history (employee_id, position_id, start_date, end_date, created_at)
          VALUES (?1, ?2, ?3, NULL, ?4)
        `).bind(employeeId, newPositionId, effectiveDate, timestamp),
      )
    }
  }

  await env.DB.batch(statements)
  return getEmployee(env, employeeId)
}

async function changeEmployeePassword(request, env, employeeId) {
  const exists = await env.DB.prepare(`
    SELECT a.id
    FROM accounts a
    JOIN employees e ON e.id = a.employee_id
    WHERE e.id = ?1 AND a.account_type = 'EMPLOYEE'
    LIMIT 1
  `).bind(employeeId).first()
  if (!exists) throw new HttpError(404, 'Akun karyawan tidak ditemukan.')

  const body = await readJson(request)
  const password = validatePassword(body.password)
  const hash = await hashPassword(password)
  const timestamp = nowIso()

  await env.DB.prepare(`
    UPDATE accounts
    SET password_hash = ?1, password_changed_at = ?2, updated_at = ?2
    WHERE employee_id = ?3 AND account_type = 'EMPLOYEE'
  `).bind(hash, timestamp, employeeId).run()

  return json({ ok: true, data: { employee_id: employeeId, password_changed_at: timestamp } })
}

async function deleteEmployee(env, employeeId) {
  const employee = await env.DB.prepare('SELECT id, name FROM employees WHERE id = ?1 LIMIT 1').bind(employeeId).first()
  if (!employee) throw new HttpError(404, 'Karyawan tidak ditemukan.')

  const [taskCount, attendanceCount] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS total FROM tasks WHERE employee_id = ?1').bind(employeeId),
    env.DB.prepare('SELECT COUNT(*) AS total FROM attendance WHERE employee_id = ?1').bind(employeeId),
  ])

  const tasks = Number(taskCount.results?.[0]?.total || 0)
  const attendance = Number(attendanceCount.results?.[0]?.total || 0)
  if (tasks > 0 || attendance > 0) {
    throw new HttpError(409, 'Karyawan sudah memiliki histori tugas/absensi. Ubah status menjadi Nonaktif, jangan hapus.')
  }

  await env.DB.prepare('DELETE FROM employees WHERE id = ?1').bind(employeeId).run()
  return json({ ok: true, data: { id: employeeId } })
}

async function listAccounts(request, env) {
  const url = new URL(request.url)
  const { page, limit, offset } = parsePagination(url)
  const search = (url.searchParams.get('search') || '').trim()

  const values = []
  let where = ''
  if (search) {
    where = 'WHERE a.username LIKE ? COLLATE NOCASE OR e.name LIKE ? COLLATE NOCASE'
    values.push(`%${search}%`, `%${search}%`)
  }

  const [countResult, dataResult] = await env.DB.batch([
    env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM accounts a LEFT JOIN employees e ON e.id = a.employee_id
      ${where}
    `).bind(...values),
    env.DB.prepare(`
      SELECT a.id, a.account_type, a.employee_id, a.username,
             e.name AS employee_name, e.status AS employee_status,
             a.password_changed_at, a.created_at, a.updated_at
      FROM accounts a
      LEFT JOIN employees e ON e.id = a.employee_id
      ${where}
      ORDER BY CASE WHEN a.account_type = 'SYSTEM_ADMIN' THEN 0 ELSE 1 END,
               a.username COLLATE NOCASE ASC
      LIMIT ? OFFSET ?
    `).bind(...values, limit, offset),
  ])

  const total = Number(countResult.results?.[0]?.total || 0)
  return json({
    ok: true,
    data: dataResult.results || [],
    pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
  })
}

async function usernameAvailability(request, env) {
  const url = new URL(request.url)
  const username = normalizeUsername(url.searchParams.get('username'))
  const excludeEmployeeId = url.searchParams.get('exclude_employee_id')

  if (!username) throw new HttpError(422, 'Username wajib diisi.')
  if (username === 'admin') return json({ ok: true, data: { username, available: false } })

  let sql = 'SELECT id FROM accounts WHERE username = ?1 COLLATE NOCASE'
  const binds = [username]
  if (excludeEmployeeId) {
    const employeeId = parsePositiveInt(excludeEmployeeId, 'Karyawan')
    sql += ' AND (employee_id IS NULL OR employee_id <> ?2)'
    binds.push(employeeId)
  }
  sql += ' LIMIT 1'

  const exists = await env.DB.prepare(sql).bind(...binds).first()
  return json({ ok: true, data: { username, available: !exists } })
}

async function bootstrapSystemAdmin(request, env) {
  const existing = await env.DB.prepare("SELECT id FROM accounts WHERE account_type = 'SYSTEM_ADMIN' LIMIT 1").first()
  if (existing) throw new HttpError(409, 'System Admin sudah dibuat.')

  const body = await readJson(request)
  const password = validatePassword(body.password)
  const username = validateUsername('admin', { allowAdmin: true })
  const passwordHash = await hashPassword(password)
  const timestamp = nowIso()

  const result = await env.DB.prepare(`
    INSERT INTO accounts (account_type, employee_id, username, password_hash, password_changed_at, created_at, updated_at)
    VALUES ('SYSTEM_ADMIN', NULL, ?1, ?2, ?3, ?3, ?3)
  `).bind(username, passwordHash, timestamp).run()

  return json({
    ok: true,
    data: {
      id: result.meta.last_row_id,
      account_type: 'SYSTEM_ADMIN',
      username: 'admin',
      created_at: timestamp,
    },
  }, 201)
}

async function handleRequest(request, env) {
  const url = new URL(request.url)
  const { pathname } = url

  if (request.method === 'OPTIONS') return new Response(null, { status: 204 })

  if (pathname === '/api/health' && request.method === 'GET') {
    const dbCheck = await env.DB.prepare('SELECT 1 AS ok').first()
    return json({
      ok: true,
      service: 'logbook-mediatrustpr-api',
      database: dbCheck?.ok === 1 ? 'connected' : 'unknown',
      timestamp: nowIso(),
    })
  }

  if (!pathname.startsWith('/api/')) throw new HttpError(404, 'Endpoint tidak ditemukan.')

  // Temporary protection for backend-foundation endpoints. Real session auth replaces this in the next auth phase.
  requireBootstrapKey(request, env)

  if (pathname === '/api/setup/system-admin' && request.method === 'POST') return bootstrapSystemAdmin(request, env)
  if (pathname === '/api/roles' && request.method === 'GET') return listRoles(env)

  if (pathname === '/api/positions' && request.method === 'GET') return listPositions(request, env)
  if (pathname === '/api/positions' && request.method === 'POST') return createPosition(request, env)
  const positionId = parseIdFromPath(pathname, '/api/positions/')
  if (positionId && request.method === 'PATCH') return updatePosition(request, env, positionId)
  if (positionId && request.method === 'DELETE') return deletePosition(env, positionId)

  if (pathname === '/api/employees' && request.method === 'GET') return listEmployees(request, env)
  if (pathname === '/api/employees' && request.method === 'POST') return createEmployee(request, env)
  const passwordMatch = pathname.match(/^\/api\/employees\/(\d+)\/password$/)
  if (passwordMatch && request.method === 'PATCH') return changeEmployeePassword(request, env, Number(passwordMatch[1]))
  const employeeId = parseIdFromPath(pathname, '/api/employees/')
  if (employeeId && request.method === 'GET') return getEmployee(env, employeeId)
  if (employeeId && request.method === 'PATCH') return updateEmployee(request, env, employeeId)
  if (employeeId && request.method === 'DELETE') return deleteEmployee(env, employeeId)

  if (pathname === '/api/accounts' && request.method === 'GET') return listAccounts(request, env)
  if (pathname === '/api/accounts/username-available' && request.method === 'GET') return usernameAvailability(request, env)

  throw new HttpError(404, 'Endpoint tidak ditemukan.')
}

export default {
  async fetch(request, env) {
    let response
    try {
      response = await handleRequest(request, env)
    } catch (error) {
      const translated = translateDatabaseError(error)
      if (translated instanceof HttpError) {
        response = errorResponse(translated.message, translated.status, translated.details)
      } else {
        console.error('Unhandled error:', translated)
        response = errorResponse('Terjadi kesalahan pada server.', 500)
      }
    }

    return withCors(response, request, env)
  },
}
