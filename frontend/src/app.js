/**
 * CareCloud Voice AI Clinical Portal - Frontend Application Logic
 */

// Application State
const state = {
  patients: [],
  filteredPatients: [],
  selectedPatient: null,
  stats: null,
  callLogs: [],
  searchQuery: '',
  filterGender: '',
  filterInsurance: '',
  inboundPhoneNumber: '+1 (571) 364-0246',
};

// DOM Elements
const elements = {
  // Navigation & Badges
  navPhoneDisplay: document.getElementById('nav-phone-display'),
  heroPhoneNumber: document.getElementById('hero-phone-number'),
  modalPhoneText: document.getElementById('modal-phone-text'),
  btnCopyPhone: document.getElementById('btn-copy-phone'),
  btnCopyDialerNumber: document.getElementById('btn-copy-dialer-number'),
  btnRefreshAll: document.getElementById('btn-refresh-all'),
  btnRefreshCalls: document.getElementById('btn-refresh-calls'),

  // KPI Metrics
  kpiTotalPatients: document.getElementById('kpi-total-patients'),
  kpiTodayReg: document.getElementById('kpi-today-reg'),
  kpiTodayCalls: document.getElementById('kpi-today-calls'),
  kpiTotalAppointments: document.getElementById('kpi-total-appointments'),

  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  patientCountBadge: document.getElementById('patient-count-badge'),

  // Patient Table & Filters
  patientSearchInput: document.getElementById('patient-search-input'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  filterGender: document.getElementById('filter-gender'),
  filterInsurance: document.getElementById('filter-insurance'),
  patientsTableBody: document.getElementById('patients-table-body'),
  patientFooterCount: document.getElementById('patient-footer-count'),

  // Call Logs
  callLogsList: document.getElementById('call-logs-list'),

  // Slide-over Patient Drawer
  patientDrawer: document.getElementById('patient-drawer'),
  patientDrawerBackdrop: document.getElementById('patient-drawer-backdrop'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),
  btnCloseDrawerBottom: document.getElementById('btn-close-drawer-bottom'),
  drawerAvatar: document.getElementById('drawer-avatar'),
  drawerName: document.getElementById('drawer-name'),
  drawerPhone: document.getElementById('drawer-phone'),
  drawerDob: document.getElementById('drawer-dob'),
  btnDeletePatient: document.getElementById('btn-delete-patient'),
  btnOpenBookAppointment: document.getElementById('btn-open-book-appointment'),

  // 17 Demographic Detail Fields
  dfFirstName: document.getElementById('df-first-name'),
  dfLastName: document.getElementById('df-last-name'),
  dfDob: document.getElementById('df-dob'),
  dfGender: document.getElementById('df-gender'),
  dfLanguage: document.getElementById('df-language'),
  dfUuid: document.getElementById('df-uuid'),
  dfPhone: document.getElementById('df-phone'),
  dfEmail: document.getElementById('df-email'),
  dfAddress: document.getElementById('df-address'),
  dfCity: document.getElementById('df-city'),
  dfState: document.getElementById('df-state'),
  dfZip: document.getElementById('df-zip'),
  dfEmerName: document.getElementById('df-emer-name'),
  dfEmerRel: document.getElementById('df-emer-rel'),
  dfEmerPhone: document.getElementById('df-emer-phone'),
  dfInsProvider: document.getElementById('df-ins-provider'),
  dfInsPolicy: document.getElementById('df-ins-policy'),
  dfInsGroup: document.getElementById('df-ins-group'),
  drawerAppointmentsList: document.getElementById('drawer-appointments-list'),
  drawerCallsList: document.getElementById('drawer-calls-list'),

  // Modals
  registerModalBackdrop: document.getElementById('register-modal-backdrop'),
  btnOpenRegisterModal: document.getElementById('btn-open-register-modal'),
  btnCloseRegisterModal: document.getElementById('btn-close-register-modal'),
  btnCancelRegister: document.getElementById('btn-cancel-register'),
  registerPatientForm: document.getElementById('register-patient-form'),

  appointmentModalBackdrop: document.getElementById('appointment-modal-backdrop'),
  btnCloseAppointmentModal: document.getElementById('btn-close-appointment-modal'),
  btnCancelAppointment: document.getElementById('btn-cancel-appointment'),
  scheduleAppointmentForm: document.getElementById('schedule-appointment-form'),
  apptPatientId: document.getElementById('appt-patient-id'),
  apptPatientNameDisplay: document.getElementById('appt-patient-name-display'),
  apptDateInput: document.getElementById('appt-date-input'),

  testInfoModalBackdrop: document.getElementById('test-info-modal-backdrop'),
  btnTestWebhookInfo: document.getElementById('btn-test-webhook-info'),
  btnCloseTestInfo: document.getElementById('btn-close-test-info'),
  btnDismissTestInfo: document.getElementById('btn-dismiss-test-info'),

  toastContainer: document.getElementById('toast-container'),
};

// ==========================================================================
// API CLIENT UTILITIES
// ==========================================================================

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...options,
    });
    const result = await res.json();
    if (!res.ok) {
      const errorMsg = result?.error?.message || result?.message || `HTTP Error ${res.status}`;
      throw new Error(errorMsg);
    }
    return result?.data !== undefined ? result.data : result;
  } catch (err) {
    console.error(`API Fetch Error [${url}]:`, err);
    throw err;
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Format Phone (10-digit to US Standard)
function formatPhone(phone) {
  if (!phone) return '--';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10) {
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  if (clean.length === 11 && clean.startsWith('1')) {
    return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
  }
  return phone;
}

// Format Date
function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ==========================================================================
// DATA FETCHING & RENDERING
// ==========================================================================

async function loadDashboardStats() {
  try {
    const statsData = await fetchJson('/dashboard/stats');
    state.stats = statsData;

    elements.kpiTotalPatients.textContent = statsData?.totalPatients ?? 0;
    elements.kpiTodayReg.textContent = `+${statsData?.todayRegistrations ?? 0} today`;
    elements.kpiTodayCalls.textContent = statsData?.todayCalls ?? 0;
    elements.kpiTotalAppointments.textContent = statsData?.totalPatients ? Math.max(statsData.totalPatients, 3) : '--';

    if (Array.isArray(statsData?.recentCalls)) {
      state.callLogs = statsData.recentCalls;
      renderCallLogs(statsData.recentCalls);
    }
  } catch (err) {
    console.warn('Could not load dashboard stats:', err.message);
  }
}

async function loadPatients() {
  elements.patientsTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-state">
        <div class="spinner"></div>
        <span>Loading patient clinical records...</span>
      </td>
    </tr>
  `;

  try {
    const data = await fetchJson('/api/v1/patients?limit=100');
    state.patients = Array.isArray(data?.patients) ? data.patients : (Array.isArray(data) ? data : []);
    filterAndRenderPatients();
    elements.patientCountBadge.textContent = state.patients.length;
  } catch (err) {
    // Try unprefixed fallback
    try {
      const fallback = await fetchJson('/patients?limit=100');
      state.patients = Array.isArray(fallback?.patients) ? fallback.patients : (Array.isArray(fallback) ? fallback : []);
      filterAndRenderPatients();
      elements.patientCountBadge.textContent = state.patients.length;
    } catch (fallbackErr) {
      elements.patientsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <span>Failed to load patients: ${err.message}</span>
            <button class="btn btn-secondary btn-sm" onclick="window.carecloud.refreshAll()">Retry</button>
          </td>
        </tr>
      `;
    }
  }
}

function filterAndRenderPatients() {
  const query = state.searchQuery.toLowerCase().trim();
  const gender = state.filterGender;
  const insurance = state.filterInsurance;

  state.filteredPatients = state.patients.filter((p) => {
    // Search query matches name, phone, email
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const phone = String(p.phone_number || '').toLowerCase();
    const email = String(p.email || '').toLowerCase();
    const matchesSearch = !query || fullName.includes(query) || phone.includes(query) || email.includes(query);

    // Filter gender
    const matchesGender = !gender || (p.gender && p.gender.toLowerCase() === gender.toLowerCase());

    // Filter insurance
    const matchesInsurance = !insurance || (p.insurance_provider && p.insurance_provider.toLowerCase().includes(insurance.toLowerCase()));

    return matchesSearch && matchesGender && matchesInsurance;
  });

  renderPatientTable(state.filteredPatients);
}

function renderPatientTable(patients) {
  if (!patients || patients.length === 0) {
    elements.patientsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <span>No patient records found matching your filters.</span>
        </td>
      </tr>
    `;
    elements.patientFooterCount.textContent = 'Showing 0 patients';
    return;
  }

  const rowsHtml = patients.map((p) => {
    const initials = `${(p.first_name || 'P')[0]}${(p.last_name || '')[0] || ''}`.toUpperCase();
    return `
      <tr data-patient-id="${p.patient_id}">
        <td>
          <div class="patient-cell">
            <div class="patient-avatar-sm">${initials}</div>
            <div>
              <div class="patient-name-title">${p.first_name || ''} ${p.last_name || ''}</div>
              <div class="patient-email-sub">${p.email || 'No email provided'}</div>
            </div>
          </div>
        </td>
        <td><strong>${formatPhone(p.phone_number)}</strong></td>
        <td>
          <span>${formatDate(p.date_of_birth)}</span>
          <span class="badge badge-outline capitalize" style="margin-left:6px">${p.gender || 'unknown'}</span>
        </td>
        <td>
          <span class="badge badge-primary">${p.insurance_provider || 'Self-Pay'}</span>
        </td>
        <td><code>${p.policy_number || 'N/A'}</code></td>
        <td>${formatDate(p.created_at)}</td>
        <td class="text-right">
          <button class="btn btn-secondary btn-xs btn-view-chart" data-id="${p.patient_id}">
            View Chart
          </button>
        </td>
      </tr>
    `;
  }).join('');

  elements.patientsTableBody.innerHTML = rowsHtml;
  elements.patientFooterCount.textContent = `Showing ${patients.length} of ${state.patients.length} patient records`;

  // Attach click listeners
  elements.patientsTableBody.querySelectorAll('tr').forEach((row) => {
    row.addEventListener('click', (e) => {
      const patientId = row.getAttribute('data-patient-id');
      if (patientId) {
        openPatientDrawer(patientId);
      }
    });
  });
}

function renderCallLogs(calls) {
  if (!calls || calls.length === 0) {
    elements.callLogsList.innerHTML = `
      <div class="empty-state">
        <span>No inbound voice sessions recorded yet. Call ${state.inboundPhoneNumber} to simulate your first session!</span>
      </div>
    `;
    return;
  }

  elements.callLogsList.innerHTML = calls.map((c) => {
    const durationMin = c.duration_seconds ? `${Math.floor(c.duration_seconds / 60)}m ${c.duration_seconds % 60}s` : 'In Progress / Brief';
    return `
      <div class="call-card">
        <div class="call-header">
          <div class="caller-id-wrap">
            <span class="status-dot"></span>
            <span class="caller-phone">${formatPhone(c.caller_phone_number)}</span>
            <span class="badge badge-success">${c.call_status || 'completed'}</span>
          </div>
          <div class="call-meta-badges">
            <span>${formatDate(c.created_at)}</span>
            <span>&bull;</span>
            <span>Duration: ${durationMin}</span>
          </div>
        </div>
        <div class="call-transcript-box">
          ${c.transcript || 'No transcript available for this call.'}
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// SLIDE-OVER PATIENT CHART DRAWER
// ==========================================================================

async function openPatientDrawer(patientId) {
  elements.patientDrawer.classList.add('active');
  elements.patientDrawerBackdrop.classList.add('active');
  elements.btnDeletePatient.setAttribute('data-id', patientId);

  // Set loading placeholder
  elements.drawerName.textContent = 'Loading patient chart...';
  elements.drawerPhone.textContent = '...';
  elements.drawerDob.textContent = '...';

  try {
    // Fetch aggregated patient + appointments + call logs
    let data;
    try {
      data = await fetchJson(`/dashboard/patient-data/${patientId}`);
    } catch {
      // Fallback directly to GET /api/v1/patients/:id
      const patient = await fetchJson(`/api/v1/patients/${patientId}`);
      data = { patient, appointments: [], callLogs: [] };
    }

    const patient = data.patient;
    state.selectedPatient = patient;

    // Header & Avatar
    const initials = `${(patient.first_name || 'P')[0]}${(patient.last_name || '')[0] || ''}`.toUpperCase();
    elements.drawerAvatar.textContent = initials;
    elements.drawerName.textContent = `${patient.first_name} ${patient.last_name}`;
    elements.drawerPhone.textContent = formatPhone(patient.phone_number);
    elements.drawerDob.textContent = `DOB: ${formatDate(patient.date_of_birth)}`;

    // Populate all 17 clinical intake fields
    // Personal
    elements.dfFirstName.textContent = patient.first_name || '--';
    elements.dfLastName.textContent = patient.last_name || '--';
    elements.dfDob.textContent = formatDate(patient.date_of_birth);
    elements.dfGender.textContent = patient.gender || '--';
    elements.dfLanguage.textContent = patient.preferred_language || 'English';
    elements.dfUuid.textContent = patient.patient_id || patient._id || '--';

    // Contact & Address
    elements.dfPhone.textContent = formatPhone(patient.phone_number);
    elements.dfEmail.textContent = patient.email || '--';
    elements.dfAddress.textContent = patient.street_address || '--';
    elements.dfCity.textContent = patient.city || '--';
    elements.dfState.textContent = patient.state || '--';
    elements.dfZip.textContent = patient.zip_code || '--';

    // Emergency Contact
    elements.dfEmerName.textContent = patient.emergency_contact_name || '--';
    elements.dfEmerRel.textContent = patient.emergency_contact_relationship || '--';
    elements.dfEmerPhone.textContent = formatPhone(patient.emergency_contact_phone);

    // Insurance
    elements.dfInsProvider.textContent = patient.insurance_provider || '--';
    elements.dfInsPolicy.textContent = patient.policy_number || '--';
    elements.dfInsGroup.textContent = patient.group_number || '--';

    // Render Associated Appointments
    if (data.appointments && data.appointments.length > 0) {
      elements.drawerAppointmentsList.innerHTML = data.appointments.map((a) => `
        <div class="appt-item-card">
          <div>
            <strong>${formatDate(a.appointment_date)} at ${a.appointment_time || '10:00 AM'}</strong>
            <div style="font-size:0.75rem; color: var(--text-muted);">${a.reason || 'General Consultation'} (${a.doctor_name || 'Attending Physician'})</div>
          </div>
          <span class="badge badge-success">${a.status || 'scheduled'}</span>
        </div>
      `).join('');
    } else {
      elements.drawerAppointmentsList.innerHTML = `
        <div class="empty-list-note">No appointments scheduled for this patient yet.</div>
      `;
    }

    // Render Associated Call Logs
    if (data.callLogs && data.callLogs.length > 0) {
      elements.drawerCallsList.innerHTML = data.callLogs.map((c) => `
        <div class="call-card" style="padding:12px;">
          <div class="call-header">
            <span class="badge badge-primary">${c.call_status || 'completed'}</span>
            <span style="font-size:0.72rem; color:var(--text-muted);">${formatDate(c.created_at)}</span>
          </div>
          <div class="call-transcript-box" style="font-size:0.75rem; max-height:80px;">
            ${c.transcript || 'Inbound call recorded.'}
          </div>
        </div>
      `).join('');
    } else {
      elements.drawerCallsList.innerHTML = `
        <div class="empty-list-note">No voice call transcripts associated with this record.</div>
      `;
    }

  } catch (err) {
    showToast(`Failed to load patient chart: ${err.message}`, 'error');
  }
}

function closePatientDrawer() {
  elements.patientDrawer.classList.remove('active');
  elements.patientDrawerBackdrop.classList.remove('active');
  state.selectedPatient = null;
}

// ==========================================================================
// ACTIONS (CREATE, DELETE, APPOINTMENT, CLIPBOARD)
// ==========================================================================

async function handleRegisterPatient(e) {
  e.preventDefault();
  const formData = new FormData(elements.registerPatientForm);
  const payload = Object.fromEntries(formData.entries());

  // Clean phone numbers to pure digits
  payload.phone_number = payload.phone_number.replace(/\D/g, '');
  if (payload.emergency_contact_phone) {
    payload.emergency_contact_phone = payload.emergency_contact_phone.replace(/\D/g, '');
  }

  // Normalize field names to match CreatePatientDto
  if (payload.gender && !payload.sex) {
    payload.sex = payload.gender.charAt(0).toUpperCase() + payload.gender.slice(1).toLowerCase();
  }
  if (payload.street_address && !payload.address_line_1) {
    payload.address_line_1 = payload.street_address;
  }
  if (payload.policy_number && !payload.insurance_member_id) {
    payload.insurance_member_id = payload.policy_number;
  }

  const submitBtn = document.getElementById('btn-submit-register');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    await fetchJson('/api/v1/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    showToast(`Patient ${payload.first_name} ${payload.last_name} registered successfully!`, 'success');
    closeRegisterModal();
    elements.registerPatientForm.reset();
    await loadPatients();
    await loadDashboardStats();
  } catch (err) {
    // Check if 409 duplicate
    if (err.message.includes('already exists') || err.message.includes('409') || err.message.includes('Conflict')) {
      showToast(`Conflict (409): A patient with phone ${payload.phone_number} is already registered!`, 'error');
    } else {
      showToast(`Registration failed: ${err.message}`, 'error');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Record';
  }
}

async function handleDeletePatient() {
  const patientId = elements.btnDeletePatient.getAttribute('data-id');
  if (!patientId) return;

  const confirmed = window.confirm(
    `Are you sure you want to soft-delete patient record #${patientId}?\nThis marks deleted_at in the database.`
  );
  if (!confirmed) return;

  try {
    await fetchJson(`/api/v1/patients/${patientId}`, {
      method: 'DELETE',
    });

    showToast('Patient record marked as soft-deleted (deleted_at recorded).', 'success');
    closePatientDrawer();
    await loadPatients();
    await loadDashboardStats();
  } catch (err) {
    showToast(`Failed to delete patient: ${err.message}`, 'error');
  }
}

async function handleScheduleAppointment(e) {
  e.preventDefault();
  const formData = new FormData(elements.scheduleAppointmentForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    await fetchJson('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    showToast('Appointment successfully scheduled and synced!', 'success');
    closeAppointmentModal();
    if (state.selectedPatient) {
      await openPatientDrawer(state.selectedPatient.patient_id);
    }
    await loadDashboardStats();
  } catch (err) {
    showToast(`Failed to schedule appointment: ${err.message}`, 'error');
  }
}

// Clipboard Helper
function copyToClipboard(text, label = 'Phone number') {
  navigator.clipboard.writeText(text).then(
    () => showToast(`${label} copied to clipboard!`, 'info'),
    () => showToast('Could not copy to clipboard', 'error')
  );
}

// Modal Helpers
function openRegisterModal() {
  elements.registerModalBackdrop.classList.add('active');
}
function closeRegisterModal() {
  elements.registerModalBackdrop.classList.remove('active');
}

function openAppointmentModal() {
  if (!state.selectedPatient) return;
  elements.apptPatientId.value = state.selectedPatient.patient_id;
  elements.apptPatientNameDisplay.value = `${state.selectedPatient.first_name} ${state.selectedPatient.last_name} (${formatPhone(state.selectedPatient.phone_number)})`;
  
  // Default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  elements.apptDateInput.value = tomorrow.toISOString().split('T')[0];

  elements.appointmentModalBackdrop.classList.add('active');
}
function closeAppointmentModal() {
  elements.appointmentModalBackdrop.classList.remove('active');
}

// ==========================================================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================================================

function attachEventListeners() {
  // Navigation tabs
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      elements.tabBtns.forEach((b) => b.classList.remove('active'));
      elements.tabPanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanelId = btn.getAttribute('data-tab');
      const panel = document.getElementById(targetPanelId);
      if (panel) panel.classList.add('active');
    });
  });

  // Search input
  elements.patientSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    elements.btnClearSearch.style.display = state.searchQuery ? 'block' : 'none';
    filterAndRenderPatients();
  });
  elements.btnClearSearch.addEventListener('click', () => {
    elements.patientSearchInput.value = '';
    state.searchQuery = '';
    elements.btnClearSearch.style.display = 'none';
    filterAndRenderPatients();
  });

  // Filters
  elements.filterGender.addEventListener('change', (e) => {
    state.filterGender = e.target.value;
    filterAndRenderPatients();
  });
  elements.filterInsurance.addEventListener('change', (e) => {
    state.filterInsurance = e.target.value;
    filterAndRenderPatients();
  });

  // Copy Buttons
  elements.btnCopyPhone.addEventListener('click', () => copyToClipboard(state.inboundPhoneNumber, 'Voice Agent phone number'));
  elements.btnCopyDialerNumber.addEventListener('click', () => copyToClipboard(state.inboundPhoneNumber, 'Voice Agent phone number'));

  // Refresh Buttons
  const refreshAll = async () => {
    showToast('Refreshing clinical database...', 'info');
    await Promise.all([loadPatients(), loadDashboardStats()]);
  };
  elements.btnRefreshAll.addEventListener('click', refreshAll);
  elements.btnRefreshCalls.addEventListener('click', loadDashboardStats);

  // Drawer Close
  elements.btnCloseDrawer.addEventListener('click', closePatientDrawer);
  elements.btnCloseDrawerBottom.addEventListener('click', closePatientDrawer);
  elements.patientDrawerBackdrop.addEventListener('click', closePatientDrawer);
  elements.btnDeletePatient.addEventListener('click', handleDeletePatient);

  // Register Modal
  elements.btnOpenRegisterModal.addEventListener('click', openRegisterModal);
  elements.btnCloseRegisterModal.addEventListener('click', closeRegisterModal);
  elements.btnCancelRegister.addEventListener('click', closeRegisterModal);
  elements.registerPatientForm.addEventListener('submit', handleRegisterPatient);

  // Appointment Modal
  elements.btnOpenBookAppointment.addEventListener('click', openAppointmentModal);
  elements.btnCloseAppointmentModal.addEventListener('click', closeAppointmentModal);
  elements.btnCancelAppointment.addEventListener('click', closeAppointmentModal);
  elements.scheduleAppointmentForm.addEventListener('submit', handleScheduleAppointment);

  // Test Info Modal
  elements.btnTestWebhookInfo.addEventListener('click', () => elements.testInfoModalBackdrop.classList.add('active'));
  elements.btnCloseTestInfo.addEventListener('click', () => elements.testInfoModalBackdrop.classList.remove('active'));
  elements.btnDismissTestInfo.addEventListener('click', () => elements.testInfoModalBackdrop.classList.remove('active'));

  // Escape key closes modals/drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePatientDrawer();
      closeRegisterModal();
      closeAppointmentModal();
      elements.testInfoModalBackdrop.classList.remove('active');
    }
  });

  // Global window hook for retry buttons
  window.carecloud = {
    refreshAll,
  };
}

// Initial Boot
async function init() {
  attachEventListeners();
  await Promise.all([loadPatients(), loadDashboardStats()]);
}

init();
