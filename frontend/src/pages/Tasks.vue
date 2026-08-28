<template>
  <section class="tasks-page">
    <section class="tasks-filter">
      <BaseButton
        type="button"
        variant="outline"
        class="responsive-filter-toggle"
        :aria-expanded="isFilterExpanded"
        aria-controls="tasks-filter-panel"
        @click="isFilterExpanded = !isFilterExpanded"
      >
        <span class="responsive-filter-toggle-label">
          <svg class="responsive-filter-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M3 5h14M5.5 10h9M8 15h4" stroke-linecap="round" />
          </svg>
          <span>Filter</span>
        </span>
        <svg class="responsive-filter-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </BaseButton>

      <div id="tasks-filter-panel" class="responsive-filter-panel" :class="{ 'is-open': isFilterExpanded }">
        <div class="task-filter-grid">
        <label class="task-filter-field search-field">
          <span>Pencarian</span>
          <input
            v-model.trim="draftFilters.search"
            type="search"
            class="form-input"
            placeholder="Cari nama tugas..."
            @keyup.enter="applyFilters"
          />
        </label>

        <label class="task-filter-field">
          <span>Status</span>
          <span class="select-control">
            <select v-model="draftFilters.status" class="form-input">
              <option value="all">Semua Status</option>
              <option v-for="status in taskStatuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

        <label class="task-filter-field">
          <span>Klien</span>
          <span class="select-control">
            <select v-model="draftFilters.client" class="form-input">
              <option value="all">Semua Klien</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.name }}
              </option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

        <label class="task-filter-field">
          <span>Nama Karyawan</span>
          <span class="select-control">
            <select v-model="draftFilters.employee" class="form-input">
              <option value="all">Semua Karyawan</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

        <label class="task-filter-field">
          <span>Jabatan</span>
          <span class="select-control">
            <select v-model="draftFilters.position" class="form-input">
              <option value="all">Semua Jabatan</option>
              <option v-for="position in positions" :key="position" :value="position">
                {{ position }}
              </option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

        <label class="task-filter-field">
          <span>Tanggal</span>
          <span class="select-control">
            <select v-model="draftFilters.dateRange" class="form-input" @change="handleDateRangeSelection">
              <option value="all">Semua Tanggal</option>
              <option value="yesterday">Kemarin</option>
              <option value="last7">7 Hari Terakhir</option>
              <option value="last30">30 Hari Terakhir</option>
              <option value="custom">Kustom</option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

          <div class="task-inline-actions">
            <BaseButton @click="applyFilters">Filter</BaseButton>
            <BaseButton variant="outline" @click="resetFilters">Reset</BaseButton>
          </div>
        </div>
      </div>

      <div class="task-secondary-actions">
        <BaseButton @click="openAddTask">Tambah Tugas</BaseButton>
        <BaseButton variant="outline" @click="exportToExcel">Export to Excel</BaseButton>
      </div>
    </section>

    <section class="tasks-table-card card">
      <div class="tasks-table-heading">
        <div>
          <h2>Data Tugas</h2>
          <p>{{ activeDateRangeLabel }}</p>
        </div>
        <span>{{ filteredTaskRows.length }} catatan</span>
      </div>

      <div class="tasks-table-scroll">
        <table class="tasks-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th class="task-name-column">Nama Tugas</th>
              <th class="client-column">Klien</th>
              <th>Mulai</th>
              <th>Selesai</th>
              <th>Status</th>
              <th class="assignee-column">Dikerjakan</th>
              <th>Deadline</th>
              <th class="note-column">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedTaskRows" :key="`${row.taskId}-${row.sessionId}`">
              <td>{{ formatDate(row.date) }}</td>
              <td class="task-name-cell">
                <button type="button" class="task-name-button" @click="openTaskDetail(row)">
                  {{ row.name }}
                </button>
              </td>
              <td class="client-cell">{{ clientName(row.clientId) }}</td>
              <td>{{ row.start || '-' }}</td>
              <td>{{ row.end || '-' }}</td>
              <td>
                <span class="select-control task-status-control">
                  <select
                    :value="row.status"
                    :class="['task-status-select', statusClass(row.status)]"
                    :aria-label="`Ubah status ${row.name}`"
                    @change="updateTaskStatus(row.taskId, $event.target.value)"
                  >
                    <option v-for="status in taskStatuses" :key="status" :value="status">{{ status }}</option>
                  </select>
                  <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </td>
              <td class="assignee-cell">{{ employeeName(row.employeeId) }}</td>
              <td>{{ formatDate(row.deadline) }}</td>
              <td class="note-cell">{{ row.note || '-' }}</td>
            </tr>
            <tr v-if="filteredTaskRows.length === 0">
              <td colspan="9" class="tasks-empty-state">Tidak ada data tugas sesuai filter.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredTaskRows.length > 0" class="tasks-pagination">
        <p>Menampilkan {{ paginationStart }}–{{ paginationEnd }} dari {{ filteredTaskRows.length }} catatan</p>

        <div class="pagination-controls">
          <button
            type="button"
            class="pagination-button"
            :disabled="currentPage === 1"
            aria-label="Halaman sebelumnya"
            @click="changePage(currentPage - 1)"
          >
            <svg class="pagination-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m12 5-5 5 5 5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            :class="['pagination-button', { active: page === currentPage }]"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="pagination-button"
            :disabled="currentPage === totalPages"
            aria-label="Halaman berikutnya"
            @click="changePage(currentPage + 1)"
          >
            <svg class="pagination-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m8 5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <label class="page-size-control">
            <span>Tampilkan</span>
            <span class="select-control page-size-select-control">
              <select v-model.number="pageSize" class="form-input page-size-select" @change="resetPagination">
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>
        </div>
      </div>
    </section>

    <div v-if="isTaskModalOpen" class="task-modal-backdrop" @click.self="closeTaskModal">
      <section class="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div class="task-modal-heading">
          <div>
            <h3 id="task-modal-title">{{ taskModalTitle }}</h3>
            <p v-if="taskModalMode === 'view' && selectedTask">{{ selectedTask.name }}</p>
            <p v-else>{{ taskModalMode === 'add' ? 'Tambahkan tugas baru.' : 'Perbarui detail tugas.' }}</p>
          </div>
          <button type="button" class="task-modal-close" aria-label="Tutup" @click="closeTaskModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div v-if="taskModalMode === 'view' && selectedTask" class="task-detail-content">
          <div class="task-detail-row">
            <span>Nama Tugas</span>
            <strong>{{ selectedTask.name }}</strong>
          </div>
          <div class="task-detail-row">
            <span>Klien</span>
            <strong>{{ clientName(selectedTask.clientId) }}</strong>
          </div>
          <div class="task-detail-row">
            <span>Status</span>
            <strong>
              <span :class="['task-status-badge', statusClass(selectedTask.status)]">{{ selectedTask.status }}</span>
            </strong>
          </div>
          <div class="task-detail-row">
            <span>Dikerjakan</span>
            <strong>{{ employeeName(selectedTask.employeeId) }}</strong>
          </div>
          <div class="task-detail-row">
            <span>Deadline</span>
            <strong>{{ formatDate(selectedTask.deadline) }}</strong>
          </div>
          <div class="task-detail-row task-detail-note">
            <span>Catatan</span>
            <strong>{{ selectedTask.note || '-' }}</strong>
          </div>

          <section class="task-sessions-section">
            <div class="task-sessions-heading">
              <div>
                <span>Waktu Pengerjaan</span>
                <small>{{ selectedTask.sessions.length }} sesi</small>
              </div>
              <button type="button" class="session-add-button" @click="openAddSession">
                <svg class="button-inline-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" stroke-linecap="round" />
                </svg>
                <span>Tambahkan Jam</span>
              </button>
            </div>

            <div class="task-session-list">
              <div v-for="session in selectedTaskSessionsSorted" :key="session.id" class="task-session-item">
                <div class="task-session-summary">
                  <strong>{{ formatDate(session.date) }}</strong>
                  <span>{{ session.start || '-' }} - {{ session.end || '-' }}</span>
                </div>
                <div class="task-session-actions">
                  <button type="button" @click="startEditSession(session)">Edit</button>
                  <button type="button" class="danger" @click="openDeleteSessionConfirm(session)">Hapus</button>
                </div>
              </div>
            </div>

            <div v-if="sessionEditorMode" class="task-session-editor">
              <div class="task-session-editor-grid">
                <label class="task-form-field">
                  <span>Tanggal</span>
                  <input
                    v-model="sessionForm.date"
                    type="date"
                    :class="['form-input', { 'is-error': sessionFormSubmitted && !sessionForm.date }]"
                  />
                </label>
                <label class="task-form-field">
                  <span>Jam Mulai</span>
                  <input
                    v-model="sessionForm.start"
                    type="time"
                    :class="['form-input', { 'is-error': sessionFormSubmitted && !sessionForm.start }]"
                  />
                </label>
                <label class="task-form-field">
                  <span>Jam Selesai</span>
                  <input
                    v-model="sessionForm.end"
                    type="time"
                    :class="['form-input', { 'is-error': sessionFormSubmitted && (!sessionForm.end || isSessionEndInvalid(sessionForm)) }]"
                  />
                </label>
              </div>
              <div class="task-session-editor-actions">
                <BaseButton variant="outline" @click="cancelSessionEditor">Batal</BaseButton>
                <BaseButton @click="saveSession">{{ sessionEditorMode === 'add' ? 'Tambahkan' : 'Simpan' }}</BaseButton>
              </div>
            </div>

            <p v-if="taskDetailError" class="task-form-error task-detail-error">{{ taskDetailError }}</p>
          </section>
        </div>

        <form v-else class="task-form" @submit.prevent="saveTask">
          <label class="task-form-field task-form-field-wide">
            <span>Nama Tugas</span>
            <input
              v-model.trim="taskForm.name"
              type="text"
              :class="['form-input', { 'is-error': taskFormSubmitted && !taskForm.name }]"
              placeholder="Masukkan nama tugas"
            />
          </label>

          <label class="task-form-field">
            <span>Klien</span>
            <span class="select-control">
              <select v-model="taskForm.clientId" :class="['form-input', { 'is-error': taskFormSubmitted && !taskForm.clientId }]">
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.name }}
                </option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>

          <label class="task-form-field">
            <span>Status</span>
            <span class="select-control">
              <select v-model="taskForm.status" :class="['form-input', { 'is-error': taskFormSubmitted && !taskForm.status }]">
                <option v-for="status in taskStatuses" :key="status" :value="status">{{ status }}</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>

          <label class="task-form-field">
            <span>Dikerjakan</span>
            <span class="select-control">
              <select v-model="taskForm.employeeId" :class="['form-input', { 'is-error': taskFormSubmitted && !taskForm.employeeId }]">
                <option value="" disabled>Pilih karyawan</option>
                <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                  {{ employee.name }}
                </option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>

          <label class="task-form-field">
            <span>Deadline</span>
            <input v-model="taskForm.deadline" type="date" class="form-input" />
          </label>

          <label class="task-form-field task-form-field-wide">
            <span>Catatan</span>
            <textarea v-model.trim="taskForm.note" class="form-input task-note-input" rows="4" placeholder="Tambahkan catatan tugas"></textarea>
          </label>

          <section class="task-form-sessions task-form-field-wide">
            <div class="task-sessions-heading">
              <div>
                <span>Waktu Pengerjaan</span>
                <small>Setiap waktu pengerjaan akan tampil sebagai satu baris di tabel.</small>
              </div>
              <button type="button" class="session-add-button" @click="addTaskFormSession">
                <svg class="button-inline-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" stroke-linecap="round" />
                </svg>
                <span>Tambahkan Jam</span>
              </button>
            </div>

            <div class="task-form-session-list">
              <div v-for="(session, index) in taskForm.sessions" :key="session.id || index" class="task-form-session-row">
                <label class="task-form-field">
                  <span>Tanggal</span>
                  <input
                    v-model="session.date"
                    type="date"
                    :class="['form-input', { 'is-error': taskFormSubmitted && !session.date }]"
                  />
                </label>
                <label class="task-form-field">
                  <span>Jam Mulai</span>
                  <input
                    v-model="session.start"
                    type="time"
                    :class="['form-input', { 'is-error': taskFormSubmitted && !session.start }]"
                  />
                </label>
                <label class="task-form-field">
                  <span>Jam Selesai</span>
                  <input
                    v-model="session.end"
                    type="time"
                    :class="['form-input', { 'is-error': taskFormSubmitted && (!session.end || isSessionEndInvalid(session)) }]"
                  />
                </label>
                <button type="button" class="task-form-session-remove" :disabled="taskForm.sessions.length === 1" @click="removeTaskFormSession(index)">Hapus</button>
              </div>
            </div>
          </section>

        </form>

        <div :class="['task-modal-actions', { 'task-modal-actions-split': taskModalMode === 'view' }]">
          <template v-if="taskModalMode === 'view'">
            <BaseButton class="task-delete-button" variant="outline" @click="openDeleteConfirm">Hapus Tugas</BaseButton>
            <div class="task-modal-actions-right">
              <BaseButton variant="outline" @click="startEditTask">Edit</BaseButton>
              <BaseButton @click="closeTaskModal">Tutup</BaseButton>
            </div>
          </template>
          <template v-else>
            <BaseButton variant="outline" @click="cancelTaskForm">Batal</BaseButton>
            <BaseButton @click="saveTask">Simpan</BaseButton>
          </template>
        </div>
      </section>
    </div>

    <div v-if="isDeleteConfirmOpen" class="task-confirm-backdrop" @click.self="closeDeleteConfirm">
      <section class="task-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-task-title">
        <div class="task-confirm-content">
          <h3 id="delete-task-title">{{ deleteConfirmTitle }}</h3>
          <p>{{ deleteConfirmMessage }}</p>
        </div>
        <div class="task-confirm-actions">
          <BaseButton variant="outline" @click="closeDeleteConfirm">Batal</BaseButton>
          <BaseButton class="task-delete-confirm-button" @click="confirmDeleteTarget">Hapus</BaseButton>
        </div>
      </section>
    </div>

    <div v-if="isDateRangePickerOpen" class="task-modal-backdrop" @click.self="cancelCustomRange">
      <section class="date-range-modal" role="dialog" aria-modal="true" aria-labelledby="custom-range-title">
        <div class="task-modal-heading">
          <div>
            <h3 id="custom-range-title">Pilih Rentang Tanggal</h3>
            <p>Pilih tanggal mulai dan tanggal selesai.</p>
          </div>
          <button type="button" class="task-modal-close" aria-label="Tutup" @click="cancelCustomRange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div class="date-range-content">
          <div class="date-range-toolbar">
            <button type="button" class="calendar-nav-button" aria-label="Bulan sebelumnya" @click="moveCalendar(-1)">
              <svg class="calendar-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m12 5-5 5 5 5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <strong>{{ calendarMonth.label }}</strong>
            <button type="button" class="calendar-nav-button" aria-label="Bulan berikutnya" @click="moveCalendar(1)">
              <svg class="calendar-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m8 5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="date-range-calendars">
            <div class="calendar-panel">
              <div class="calendar-weekdays" aria-hidden="true">
                <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
              </div>
              <div class="calendar-days">
                <button
                  v-for="day in calendarMonth.days"
                  :key="day.iso"
                  type="button"
                  :class="[
                    'calendar-day',
                    {
                      muted: !day.inMonth,
                      today: day.iso === currentDateIso,
                      'in-range': isDateInTempRange(day.iso),
                      'range-edge': isTempRangeEdge(day.iso)
                    }
                  ]"
                  @click="selectCustomDate(day.iso)"
                >
                  {{ day.day }}
                </button>
              </div>
            </div>
          </div>

          <div class="selected-range-summary">
            <div>
              <span>Tanggal Mulai</span>
              <strong>{{ tempCustomRange.start ? formatDate(tempCustomRange.start) : '-' }}</strong>
            </div>
            <span class="range-separator">s.d.</span>
            <div>
              <span>Tanggal Selesai</span>
              <strong>{{ tempCustomRange.end ? formatDate(tempCustomRange.end) : '-' }}</strong>
            </div>
          </div>
          <p v-if="customRangeError" class="task-form-error">{{ customRangeError }}</p>
        </div>

        <div class="task-modal-actions date-range-actions">
          <BaseButton variant="outline" @click="cancelCustomRange">Batal</BaseButton>
          <BaseButton @click="applyCustomRange">Terapkan</BaseButton>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import * as XLSX from 'xlsx'
import BaseButton from '../components/BaseButton.vue'
import { useAuthStore } from '../stores/auth'

const JAKARTA_TIME_ZONE = 'Asia/Jakarta'
const jakartaNowParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: JAKARTA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).formatToParts(new Date())

const nowPart = (type) => jakartaNowParts.find((part) => part.type === type)?.value || ''
const currentDateIso = `${nowPart('year')}-${nowPart('month')}-${nowPart('day')}`
const auth = useAuthStore()

const employees = [
  { id: 'emp-001', name: 'Admin MediatrustPR', position: 'Administrator' },
  { id: 'emp-002', name: 'Andi Pratama', position: 'Account Executive' },
  { id: 'emp-003', name: 'Sinta Maharani', position: 'Media Relations' },
  { id: 'emp-004', name: 'Raka Putra', position: 'Monitoring Analyst' },
  { id: 'emp-005', name: 'Nadia Rahma', position: 'Content Specialist' },
  { id: 'emp-006', name: 'Dimas Saputra', position: 'Account Executive' }

]

const accountEmployeeIds = {
  admin: 'emp-001'
}

const loggedInEmployeeId = computed(() => (
  accountEmployeeIds[String(auth.user?.username || '').toLowerCase()] || 'emp-001'
))

const clients = [
  { id: 'client-internal', name: 'Internal / Tanpa Klien' },
  { id: 'client-001', name: 'Nusantara Energi' },
  { id: 'client-002', name: 'Bank Sentra' },
  { id: 'client-003', name: 'Arunika Digital' },
  { id: 'client-004', name: 'Cakrawala Consumer' }
]

const mockClientSequence = ['client-internal', 'client-001', 'client-002', 'client-003', 'client-004']

const taskStatuses = ['Selesai', 'Progres', 'Ditunda', 'Dibatalkan']
const positions = [...new Set(employees.map((employee) => employee.position))]
const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const legacyTasks = [
  { id: 'task-001', date: '2026-08-28', name: 'Media monitoring harian', start: '08:45', end: '10:15', status: 'Selesai', employeeId: 'emp-004', deadline: '2026-08-28', note: 'Laporan monitoring sudah dikirim.' },
  { id: 'task-002', date: '2026-08-28', name: 'Update database media', start: '10:30', end: '', status: 'Progres', employeeId: 'emp-003', deadline: '2026-08-29', note: 'Melengkapi kontak media nasional.' },
  { id: 'task-003', date: '2026-08-27', name: 'Draft laporan campaign', start: '13:15', end: '', status: 'Ditunda', employeeId: 'emp-002', deadline: '2026-08-30', note: 'Menunggu data coverage tambahan.' },
  { id: 'task-004', date: '2026-08-27', name: 'Koordinasi kebutuhan klien', start: '09:00', end: '10:00', status: 'Selesai', employeeId: 'emp-002', deadline: '2026-08-27', note: 'Kebutuhan konten sudah dikonfirmasi.' },
  { id: 'task-005', date: '2026-08-26', name: 'Rekap publikasi mingguan', start: '14:00', end: '16:20', status: 'Selesai', employeeId: 'emp-005', deadline: '2026-08-27', note: 'Rekap final sudah masuk folder tim.' },
  { id: 'task-006', date: '2026-08-25', name: 'Penyusunan media list campaign', start: '09:30', end: '', status: 'Progres', employeeId: 'emp-003', deadline: '2026-08-31', note: 'Fokus pada media bisnis dan ekonomi.' },
  { id: 'task-007', date: '2026-08-24', name: 'Follow up konfirmasi narasumber', start: '11:00', end: '', status: 'Dibatalkan', employeeId: 'emp-006', deadline: '2026-08-24', note: 'Agenda dibatalkan oleh klien.' },
  { id: 'task-008', date: '2026-08-21', name: 'Monitoring isu kompetitor', start: '08:30', end: '11:10', status: 'Selesai', employeeId: 'emp-004', deadline: '2026-08-21', note: 'Temuan utama sudah dirangkum.' },
  { id: 'task-009', date: '2026-07-31', name: 'Rekap media coverage Juli', start: '13:00', end: '16:30', status: 'Selesai', employeeId: 'emp-001', deadline: '2026-07-31', note: 'Rekap bulanan selesai.' },
  { id: 'task-010', date: '2026-08-28', name: 'Review materi presentasi klien', start: '16:10', end: '', status: 'Progres', employeeId: 'emp-002', deadline: '2026-08-29', note: 'Finalisasi poin utama presentasi.' },
  { id: 'task-011', date: '2026-08-28', name: 'Distribusi press release', start: '14:20', end: '15:05', status: 'Selesai', employeeId: 'emp-003', deadline: '2026-08-28', note: 'Distribusi ke media prioritas selesai.' },
  { id: 'task-012', date: '2026-08-28', name: 'Verifikasi coverage campaign', start: '11:40', end: '13:10', status: 'Selesai', employeeId: 'emp-004', deadline: '2026-08-28', note: 'Coverage utama telah diverifikasi.' },
  { id: 'task-013', date: '2026-08-27', name: 'Persiapan konten media sosial', start: '15:20', end: '', status: 'Ditunda', employeeId: 'emp-005', deadline: '2026-08-29', note: 'Menunggu persetujuan materi visual.' },
  { id: 'task-014', date: '2026-08-26', name: 'Follow up media partner', start: '10:10', end: '11:00', status: 'Selesai', employeeId: 'emp-006', deadline: '2026-08-26', note: 'Konfirmasi publikasi telah diterima.' },
  { id: 'task-015', date: '2026-08-23', name: 'Analisis sentimen pemberitaan', start: '09:15', end: '12:00', status: 'Selesai', employeeId: 'emp-004', deadline: '2026-08-24', note: 'Ringkasan sentimen selesai.' },
  { id: 'task-016', date: '2026-08-20', name: 'Riset media untuk pitching', start: '13:45', end: '', status: 'Progres', employeeId: 'emp-003', deadline: '2026-08-30', note: 'Daftar media sedang diperluas.' },
  { id: 'task-017', date: '2026-08-18', name: 'Revisi proposal komunikasi', start: '10:30', end: '12:10', status: 'Selesai', employeeId: 'emp-002', deadline: '2026-08-18', note: 'Proposal revisi sudah dikirim.' },
  { id: 'task-018', date: '2026-08-12', name: 'Koordinasi agenda media visit', start: '09:20', end: '', status: 'Dibatalkan', employeeId: 'emp-006', deadline: '2026-08-13', note: 'Agenda dibatalkan dan akan dijadwalkan ulang.' }
]

const tasks = ref(legacyTasks.map((task, index) => ({
  id: task.id,
  name: task.name,
  clientId: mockClientSequence[index % mockClientSequence.length],
  status: task.status,
  employeeId: task.employeeId,
  deadline: task.deadline,
  note: task.note,
  sessions: [{ id: `${task.id}-session-1`, date: task.date, start: task.start, end: task.end }]
})))

const multiDayTask = tasks.value.find((task) => task.id === 'task-002')
if (multiDayTask) {
  multiDayTask.sessions.unshift({ id: 'task-002-session-0', date: '2026-08-27', start: '15:00', end: '16:30' })
}

const draftFilters = reactive({
  search: '',
  status: 'all',
  client: 'all',
  employee: 'all',
  position: 'all',
  dateRange: 'all',
  customStart: '',
  customEnd: ''
})
const activeFilters = reactive({ ...draftFilters })
const isFilterExpanded = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

const isTaskModalOpen = ref(false)
const taskModalMode = ref('view')
const selectedTaskId = ref(null)
const taskFormSubmitted = ref(false)
const taskDetailError = ref('')
const taskForm = reactive({
  name: '',
  clientId: 'client-internal',
  status: 'Progres',
  employeeId: loggedInEmployeeId.value,
  deadline: '',
  note: '',
  sessions: []
})

const sessionEditorMode = ref('')
const selectedSessionId = ref(null)
const sessionFormSubmitted = ref(false)
const sessionForm = reactive({ date: currentDateIso, start: '', end: '' })

const isDeleteConfirmOpen = ref(false)
const deleteTargetType = ref('task')
const deleteSessionId = ref(null)

const isDateRangePickerOpen = ref(false)
const customRangeError = ref('')
const tempCustomRange = reactive({ start: '', end: '' })
const calendarAnchor = ref(createUtcDate(Number(nowPart('year')), Number(nowPart('month')) - 1, 1))

const dateRangeLabels = {
  all: 'Semua Tanggal',
  yesterday: 'Kemarin',
  last7: '7 Hari Terakhir',
  last30: '30 Hari Terakhir'
}

const employeeMap = computed(() => new Map(employees.map((employee) => [employee.id, employee])))
const clientMap = computed(() => new Map(clients.map((client) => [client.id, client])))
const selectedTask = computed(() => tasks.value.find((task) => task.id === selectedTaskId.value) || null)
const selectedTaskSessionsSorted = computed(() => {
  if (!selectedTask.value) return []
  return [...selectedTask.value.sessions].sort((a, b) => sessionTimestamp(a) - sessionTimestamp(b))
})
const taskModalTitle = computed(() => {
  if (taskModalMode.value === 'add') return 'Tambah Tugas'
  if (taskModalMode.value === 'edit') return 'Edit Tugas'
  return 'Detail Tugas'
})
const deleteConfirmTitle = computed(() => deleteTargetType.value === 'session' ? 'Hapus Jam Pengerjaan?' : 'Hapus Tugas?')
const deleteConfirmMessage = computed(() => {
  if (deleteTargetType.value === 'session') {
    const session = selectedTask.value?.sessions.find((item) => item.id === deleteSessionId.value)
    return session
      ? `Hanya sesi ${formatDate(session.date)} ${session.start || '-'} - ${session.end || '-'} yang akan dihapus.`
      : 'Hanya sesi waktu pengerjaan yang dipilih yang akan dihapus.'
  }
  return 'Tugas beserta seluruh sesi waktu pengerjaannya akan dihapus dari tabel mock saat ini.'
})

const taskRows = computed(() => tasks.value.flatMap((task) => task.sessions.map((session) => ({
  taskId: task.id,
  sessionId: session.id,
  date: session.date,
  start: session.start,
  end: session.end,
  name: task.name,
  clientId: task.clientId,
  status: task.status,
  employeeId: task.employeeId,
  deadline: task.deadline,
  note: task.note
}))))

const activeDateRangeLabel = computed(() => {
  if (activeFilters.dateRange === 'custom' && activeFilters.customStart && activeFilters.customEnd) {
    return `${formatDate(activeFilters.customStart)} s.d. ${formatDate(activeFilters.customEnd)}`
  }
  return dateRangeLabels[activeFilters.dateRange] || 'Semua Tanggal'
})

const filteredTaskRows = computed(() => {
  const searchTerm = activeFilters.search.trim().toLowerCase()

  return taskRows.value
    .filter((row) => {
      const employee = employeeMap.value.get(row.employeeId)
      const client = clientMap.value.get(row.clientId)
      const searchableText = [row.name, row.note, employee?.name, client?.name].filter(Boolean).join(' ').toLowerCase()
      const matchesSearch = !searchTerm || searchableText.includes(searchTerm)
      const matchesStatus = activeFilters.status === 'all' || row.status === activeFilters.status
      const matchesClient = activeFilters.client === 'all' || row.clientId === activeFilters.client
      const matchesEmployee = activeFilters.employee === 'all' || row.employeeId === activeFilters.employee
      const matchesPosition = activeFilters.position === 'all' || employee?.position === activeFilters.position
      const matchesDate = matchesDateRange(row.date, activeFilters)
      return matchesSearch && matchesStatus && matchesClient && matchesEmployee && matchesPosition && matchesDate
    })
    .sort((a, b) => taskRowTimestamp(b) - taskRowTimestamp(a))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTaskRows.value.length / pageSize.value)))
const paginatedTaskRows = computed(() => {
  const safePage = Math.min(currentPage.value, totalPages.value)
  const start = (safePage - 1) * pageSize.value
  return filteredTaskRows.value.slice(start, start + pageSize.value)
})
const paginationStart = computed(() => filteredTaskRows.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredTaskRows.value.length))
const visiblePages = computed(() => {
  const total = totalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(total, start + 4)
  start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const calendarMonth = computed(() => buildCalendar(calendarAnchor.value))

function createUtcDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day, 12))
}

function addMonths(date, amount) {
  return createUtcDate(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)
}

function isoFromDate(date) {
  return [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCDate()).padStart(2, '0')].join('-')
}

function buildCalendar(anchor) {
  const year = anchor.getUTCFullYear()
  const monthIndex = anchor.getUTCMonth()
  const firstDay = createUtcDate(year, monthIndex, 1)
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7
  const gridStart = createUtcDate(year, monthIndex, 1 - mondayOffset)
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = createUtcDate(gridStart.getUTCFullYear(), gridStart.getUTCMonth(), gridStart.getUTCDate() + index)
    return {
      iso: isoFromDate(date),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthIndex
    }
  })

  return {
    key: `${year}-${monthIndex}`,
    label: new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(anchor),
    days
  }
}

function parseIsoDate(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return { year, month, day }
}

function dateTimestamp(value) {
  const { year, month, day } = parseIsoDate(value)
  return Date.UTC(year, month - 1, day)
}

function taskRowTimestamp(row) {
  const { year, month, day } = parseIsoDate(row.date)
  const [hour, minute] = String(row.start || '00:00').split(':').map(Number)
  return Date.UTC(year, month - 1, day, hour || 0, minute || 0)
}

function sessionTimestamp(session) {
  return taskRowTimestamp(session)
}

function matchesDateRange(value, filters) {
  const range = filters.dateRange
  if (range === 'all') return true

  const valueTime = dateTimestamp(value)
  const differenceDays = Math.floor((dateTimestamp(currentDateIso) - valueTime) / 86400000)

  if (range === 'yesterday') return differenceDays === 1
  if (range === 'last7') return differenceDays >= 0 && differenceDays < 7
  if (range === 'last30') return differenceDays >= 0 && differenceDays < 30
  if (range === 'custom' && filters.customStart && filters.customEnd) {
    return valueTime >= dateTimestamp(filters.customStart) && valueTime <= dateTimestamp(filters.customEnd)
  }
  return range !== 'custom'
}

function formatDate(value) {
  if (!value) return '-'
  const { year, month, day } = parseIsoDate(value)
  return [String(day).padStart(2, '0'), String(month).padStart(2, '0'), year].join('/')
}

function employeeName(employeeId) {
  return employeeMap.value.get(employeeId)?.name || '-'
}

function clientName(clientId) {
  return clientMap.value.get(clientId)?.name || 'Internal / Tanpa Klien'
}

function statusClass(status) {
  return {
    Selesai: 'done',
    Progres: 'progress',
    Ditunda: 'hold',
    Dibatalkan: 'cancelled'
  }[status] || ''
}

function newSession(date = currentDateIso) {
  return { id: '', date, start: '', end: '' }
}

function cloneSessions(sessions) {
  return sessions.map((session) => ({ ...session }))
}

function handleDateRangeSelection() {
  if (draftFilters.dateRange !== 'custom') return
  openCustomRangePicker()
}

function applyFilters() {
  if (draftFilters.dateRange === 'custom' && (!draftFilters.customStart || !draftFilters.customEnd)) {
    openCustomRangePicker()
    customRangeError.value = 'Pilih tanggal mulai dan tanggal selesai.'
    return
  }
  Object.assign(activeFilters, draftFilters)
  resetPagination()
}

function resetFilters() {
  Object.assign(draftFilters, {
    search: '',
    status: 'all',
    client: 'all',
    employee: 'all',
    position: 'all',
    dateRange: 'all',
    customStart: '',
    customEnd: ''
  })
  Object.assign(activeFilters, draftFilters)
  resetPagination()
}

function resetPagination() {
  currentPage.value = 1
}

function changePage(page) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

function updateTaskStatus(taskId, status) {
  const task = tasks.value.find((item) => item.id === taskId)
  if (!task || !taskStatuses.includes(status)) return
  task.status = status
  currentPage.value = Math.min(currentPage.value, totalPages.value)
}

function openTaskDetail(row) {
  selectedTaskId.value = row.taskId || row.id
  taskModalMode.value = 'view'
  taskFormSubmitted.value = false
  taskDetailError.value = ''
  cancelSessionEditor()
  isTaskModalOpen.value = true
}

function openAddTask() {
  selectedTaskId.value = null
  taskModalMode.value = 'add'
  Object.assign(taskForm, {
    name: '',
    clientId: 'client-internal',
    status: 'Progres',
    employeeId: loggedInEmployeeId.value,
    deadline: '',
    note: '',
    sessions: [newSession(currentDateIso)]
  })
  taskFormSubmitted.value = false
  taskDetailError.value = ''
  isTaskModalOpen.value = true
}

function startEditTask() {
  if (!selectedTask.value) return
  Object.assign(taskForm, {
    name: selectedTask.value.name,
    clientId: selectedTask.value.clientId,
    status: selectedTask.value.status,
    employeeId: selectedTask.value.employeeId,
    deadline: selectedTask.value.deadline,
    note: selectedTask.value.note,
    sessions: cloneSessions(selectedTask.value.sessions)
  })
  taskFormSubmitted.value = false
  taskDetailError.value = ''
  cancelSessionEditor()
  taskModalMode.value = 'edit'
}

function addTaskFormSession() {
  const lastDate = taskForm.sessions.at(-1)?.date || currentDateIso
  taskForm.sessions.push(newSession(lastDate))
}

function removeTaskFormSession(index) {
  if (taskForm.sessions.length <= 1) return
  taskForm.sessions.splice(index, 1)
}

function cancelTaskForm() {
  taskFormSubmitted.value = false
  if (taskModalMode.value === 'add') {
    closeTaskModal()
    return
  }
  taskModalMode.value = 'view'
}

function isSessionEndInvalid(session) {
  return Boolean(session.end && session.start && session.end <= session.start)
}

function validateSessions(sessions) {
  return Boolean(
    sessions.length &&
    sessions.every((session) => session.date && session.start && session.end && !isSessionEndInvalid(session))
  )
}

function validateTaskForm() {
  return Boolean(
    taskForm.name &&
    taskForm.clientId &&
    taskForm.status &&
    taskForm.employeeId &&
    validateSessions(taskForm.sessions)
  )
}

function normalizeSessions(sessions, taskId) {
  return sessions.map((session, index) => ({
    id: session.id || `${taskId}-session-${Date.now()}-${index}`,
    date: session.date,
    start: session.start,
    end: session.end
  }))
}

function saveTask() {
  taskFormSubmitted.value = true
  if (!validateTaskForm()) return

  if (taskModalMode.value === 'add') {
    const taskId = `task-${Date.now()}`
    tasks.value.push({
      id: taskId,
      name: taskForm.name,
      clientId: taskForm.clientId,
      status: taskForm.status,
      employeeId: taskForm.employeeId,
      deadline: taskForm.deadline,
      note: taskForm.note,
      sessions: normalizeSessions(taskForm.sessions, taskId)
    })
    resetPagination()
    closeTaskModal()
    return
  }

  const index = tasks.value.findIndex((task) => task.id === selectedTaskId.value)
  if (index >= 0) {
    const taskId = tasks.value[index].id
    tasks.value[index] = {
      ...tasks.value[index],
      name: taskForm.name,
      clientId: taskForm.clientId,
      status: taskForm.status,
      employeeId: taskForm.employeeId,
      deadline: taskForm.deadline,
      note: taskForm.note,
      sessions: normalizeSessions(taskForm.sessions, taskId)
    }
  }
  taskFormSubmitted.value = false
  taskModalMode.value = 'view'
  currentPage.value = Math.min(currentPage.value, totalPages.value)
}

function openAddSession() {
  if (!selectedTask.value) return
  sessionEditorMode.value = 'add'
  selectedSessionId.value = null
  Object.assign(sessionForm, newSession(selectedTask.value.sessions.at(-1)?.date || currentDateIso))
  sessionFormSubmitted.value = false
  taskDetailError.value = ''
}

function startEditSession(session) {
  sessionEditorMode.value = 'edit'
  selectedSessionId.value = session.id
  Object.assign(sessionForm, { date: session.date, start: session.start, end: session.end })
  sessionFormSubmitted.value = false
  taskDetailError.value = ''
}

function cancelSessionEditor() {
  sessionEditorMode.value = ''
  selectedSessionId.value = null
  sessionFormSubmitted.value = false
}

function validateSessionForm() {
  return Boolean(sessionForm.date && sessionForm.start && sessionForm.end && !isSessionEndInvalid(sessionForm))
}

function saveSession() {
  if (!selectedTask.value) return
  sessionFormSubmitted.value = true
  if (!validateSessionForm()) return

  if (sessionEditorMode.value === 'add') {
    selectedTask.value.sessions.push({
      id: `${selectedTask.value.id}-session-${Date.now()}`,
      date: sessionForm.date,
      start: sessionForm.start,
      end: sessionForm.end
    })
  } else if (sessionEditorMode.value === 'edit') {
    const sessionIndex = selectedTask.value.sessions.findIndex((session) => session.id === selectedSessionId.value)
    if (sessionIndex >= 0) {
      selectedTask.value.sessions[sessionIndex] = {
        ...selectedTask.value.sessions[sessionIndex],
        date: sessionForm.date,
        start: sessionForm.start,
        end: sessionForm.end
      }
    }
  }

  cancelSessionEditor()
  currentPage.value = Math.min(currentPage.value, totalPages.value)
}

function closeTaskModal() {
  isTaskModalOpen.value = false
  taskModalMode.value = 'view'
  selectedTaskId.value = null
  taskFormSubmitted.value = false
  taskDetailError.value = ''
  cancelSessionEditor()
}

function openDeleteConfirm() {
  if (!selectedTask.value) return
  deleteTargetType.value = 'task'
  deleteSessionId.value = null
  isDeleteConfirmOpen.value = true
}

function openDeleteSessionConfirm(session) {
  if (!selectedTask.value) return
  if (selectedTask.value.sessions.length <= 1) {
    taskDetailError.value = 'Tugas harus memiliki minimal satu waktu pengerjaan. Gunakan Hapus Tugas jika ingin menghapus seluruh tugas.'
    return
  }
  deleteTargetType.value = 'session'
  deleteSessionId.value = session.id
  taskDetailError.value = ''
  isDeleteConfirmOpen.value = true
}

function closeDeleteConfirm() {
  isDeleteConfirmOpen.value = false
  deleteTargetType.value = 'task'
  deleteSessionId.value = null
}

function confirmDeleteTarget() {
  if (!selectedTask.value) return

  if (deleteTargetType.value === 'session') {
    selectedTask.value.sessions = selectedTask.value.sessions.filter((session) => session.id !== deleteSessionId.value)
    if (selectedSessionId.value === deleteSessionId.value) cancelSessionEditor()
    closeDeleteConfirm()
    currentPage.value = Math.min(currentPage.value, totalPages.value)
    return
  }

  tasks.value = tasks.value.filter((task) => task.id !== selectedTaskId.value)
  closeDeleteConfirm()
  closeTaskModal()
  currentPage.value = Math.min(currentPage.value, totalPages.value)
}

function openCustomRangePicker() {
  tempCustomRange.start = draftFilters.customStart || ''
  tempCustomRange.end = draftFilters.customEnd || ''
  customRangeError.value = ''

  const anchorIso = tempCustomRange.start || currentDateIso
  const { year, month } = parseIsoDate(anchorIso)
  calendarAnchor.value = createUtcDate(year, month - 1, 1)
  isDateRangePickerOpen.value = true
}

function cancelCustomRange() {
  isDateRangePickerOpen.value = false
  customRangeError.value = ''
  if (!draftFilters.customStart || !draftFilters.customEnd) {
    draftFilters.dateRange = activeFilters.dateRange
  }
}

function moveCalendar(amount) {
  calendarAnchor.value = addMonths(calendarAnchor.value, amount)
}

function selectCustomDate(iso) {
  customRangeError.value = ''
  if (!tempCustomRange.start || tempCustomRange.end) {
    tempCustomRange.start = iso
    tempCustomRange.end = ''
    return
  }
  if (dateTimestamp(iso) < dateTimestamp(tempCustomRange.start)) {
    tempCustomRange.start = iso
    tempCustomRange.end = ''
    return
  }
  tempCustomRange.end = iso
}

function isDateInTempRange(iso) {
  if (!tempCustomRange.start) return false
  const value = dateTimestamp(iso)
  const start = dateTimestamp(tempCustomRange.start)
  const end = tempCustomRange.end ? dateTimestamp(tempCustomRange.end) : start
  return value >= start && value <= end
}

function isTempRangeEdge(iso) {
  return iso === tempCustomRange.start || iso === tempCustomRange.end
}

function applyCustomRange() {
  if (!tempCustomRange.start || !tempCustomRange.end) {
    customRangeError.value = 'Pilih tanggal mulai dan tanggal selesai.'
    return
  }

  draftFilters.dateRange = 'custom'
  draftFilters.customStart = tempCustomRange.start
  draftFilters.customEnd = tempCustomRange.end
  Object.assign(activeFilters, draftFilters)
  resetPagination()
  isDateRangePickerOpen.value = false
  customRangeError.value = ''
}

function exportToExcel() {
  const rows = filteredTaskRows.value.map((row) => ({
    Tanggal: formatDate(row.date),
    'Nama Tugas': row.name,
    Klien: clientName(row.clientId),
    Mulai: row.start || '-',
    Selesai: row.end || '-',
    Status: row.status,
    Dikerjakan: employeeName(row.employeeId),
    Deadline: formatDate(row.deadline),
    Catatan: row.note || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['Tanggal', 'Nama Tugas', 'Klien', 'Mulai', 'Selesai', 'Status', 'Dikerjakan', 'Deadline', 'Catatan']
  })

  worksheet['!cols'] = [
    { wch: 13 }, { wch: 34 }, { wch: 24 }, { wch: 10 }, { wch: 10 },
    { wch: 14 }, { wch: 24 }, { wch: 13 }, { wch: 42 }
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tugas')
  const safeRange = activeDateRangeLabel.value.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  XLSX.writeFile(workbook, `tugas-${safeRange || 'semua-tanggal'}.xlsx`)
}
</script>

<style scoped>
@import '../assets/styles/tasks.css';
</style>
