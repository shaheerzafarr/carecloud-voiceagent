(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const f of i.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&o(f)}).observe(document,{childList:!0,subtree:!0});function t(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(r){if(r.ep)return;r.ep=!0;const i=t(r);fetch(r.href,i)}})();const s={patients:[],filteredPatients:[],selectedPatient:null,stats:null,callLogs:[],searchQuery:"",filterGender:"",filterInsurance:"",inboundPhoneNumber:"+1 (571) 386-0275"},e={navPhoneDisplay:document.getElementById("nav-phone-display"),heroPhoneNumber:document.getElementById("hero-phone-number"),modalPhoneText:document.getElementById("modal-phone-text"),btnCopyPhone:document.getElementById("btn-copy-phone"),btnCopyDialerNumber:document.getElementById("btn-copy-dialer-number"),btnRefreshAll:document.getElementById("btn-refresh-all"),btnRefreshCalls:document.getElementById("btn-refresh-calls"),kpiTotalPatients:document.getElementById("kpi-total-patients"),kpiTodayReg:document.getElementById("kpi-today-reg"),kpiTodayCalls:document.getElementById("kpi-today-calls"),kpiTotalAppointments:document.getElementById("kpi-total-appointments"),tabBtns:document.querySelectorAll(".tab-btn"),tabPanels:document.querySelectorAll(".tab-panel"),patientCountBadge:document.getElementById("patient-count-badge"),patientSearchInput:document.getElementById("patient-search-input"),btnClearSearch:document.getElementById("btn-clear-search"),filterGender:document.getElementById("filter-gender"),filterInsurance:document.getElementById("filter-insurance"),patientsTableBody:document.getElementById("patients-table-body"),patientFooterCount:document.getElementById("patient-footer-count"),callLogsList:document.getElementById("call-logs-list"),patientDrawer:document.getElementById("patient-drawer"),patientDrawerBackdrop:document.getElementById("patient-drawer-backdrop"),btnCloseDrawer:document.getElementById("btn-close-drawer"),btnCloseDrawerBottom:document.getElementById("btn-close-drawer-bottom"),drawerAvatar:document.getElementById("drawer-avatar"),drawerName:document.getElementById("drawer-name"),drawerPhone:document.getElementById("drawer-phone"),drawerDob:document.getElementById("drawer-dob"),btnDeletePatient:document.getElementById("btn-delete-patient"),btnOpenBookAppointment:document.getElementById("btn-open-book-appointment"),dfFirstName:document.getElementById("df-first-name"),dfLastName:document.getElementById("df-last-name"),dfDob:document.getElementById("df-dob"),dfGender:document.getElementById("df-gender"),dfLanguage:document.getElementById("df-language"),dfUuid:document.getElementById("df-uuid"),dfPhone:document.getElementById("df-phone"),dfEmail:document.getElementById("df-email"),dfAddress:document.getElementById("df-address"),dfCity:document.getElementById("df-city"),dfState:document.getElementById("df-state"),dfZip:document.getElementById("df-zip"),dfEmerName:document.getElementById("df-emer-name"),dfEmerRel:document.getElementById("df-emer-rel"),dfEmerPhone:document.getElementById("df-emer-phone"),dfInsProvider:document.getElementById("df-ins-provider"),dfInsPolicy:document.getElementById("df-ins-policy"),dfInsGroup:document.getElementById("df-ins-group"),drawerAppointmentsList:document.getElementById("drawer-appointments-list"),drawerCallsList:document.getElementById("drawer-calls-list"),registerModalBackdrop:document.getElementById("register-modal-backdrop"),btnOpenRegisterModal:document.getElementById("btn-open-register-modal"),btnCloseRegisterModal:document.getElementById("btn-close-register-modal"),btnCancelRegister:document.getElementById("btn-cancel-register"),registerPatientForm:document.getElementById("register-patient-form"),appointmentModalBackdrop:document.getElementById("appointment-modal-backdrop"),btnCloseAppointmentModal:document.getElementById("btn-close-appointment-modal"),btnCancelAppointment:document.getElementById("btn-cancel-appointment"),scheduleAppointmentForm:document.getElementById("schedule-appointment-form"),apptPatientId:document.getElementById("appt-patient-id"),apptPatientNameDisplay:document.getElementById("appt-patient-name-display"),apptDateInput:document.getElementById("appt-date-input"),testInfoModalBackdrop:document.getElementById("test-info-modal-backdrop"),btnTestWebhookInfo:document.getElementById("btn-test-webhook-info"),btnCloseTestInfo:document.getElementById("btn-close-test-info"),btnDismissTestInfo:document.getElementById("btn-dismiss-test-info"),toastContainer:document.getElementById("toast-container")};async function l(n,a={}){var t;try{const o=await fetch(n,{headers:{"Content-Type":"application/json",Accept:"application/json"},...a}),r=await o.json();if(!o.ok){const i=((t=r==null?void 0:r.error)==null?void 0:t.message)||(r==null?void 0:r.message)||`HTTP Error ${o.status}`;throw new Error(i)}return(r==null?void 0:r.data)!==void 0?r.data:r}catch(o){throw console.error(`API Fetch Error [${n}]:`,o),o}}function d(n,a="info"){const t=document.createElement("div");t.className=`toast ${a}`,t.innerHTML=`
    <span>${n}</span>
  `,e.toastContainer.appendChild(t),setTimeout(()=>{t.style.opacity="0",t.style.transform="translateY(10px)",t.style.transition="all 0.3s ease",setTimeout(()=>t.remove(),300)},4e3)}function p(n){if(!n)return"--";const a=String(n).replace(/\D/g,"");return a.length===10?`(${a.slice(0,3)}) ${a.slice(3,6)}-${a.slice(6)}`:a.length===11&&a.startsWith("1")?`+1 (${a.slice(1,4)}) ${a.slice(4,7)}-${a.slice(7)}`:n}function c(n){if(!n)return"--";try{return new Date(n).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}catch{return n}}async function u(){try{const n=await l("/dashboard/stats");s.stats=n,e.kpiTotalPatients.textContent=(n==null?void 0:n.totalPatients)??0,e.kpiTodayReg.textContent=`+${(n==null?void 0:n.todayRegistrations)??0} today`,e.kpiTodayCalls.textContent=(n==null?void 0:n.todayCalls)??0,e.kpiTotalAppointments.textContent=n!=null&&n.totalPatients?Math.max(n.totalPatients,3):"--",Array.isArray(n==null?void 0:n.recentCalls)&&(s.callLogs=n.recentCalls,L(n.recentCalls))}catch(n){console.warn("Could not load dashboard stats:",n.message)}}async function h(){e.patientsTableBody.innerHTML=`
    <tr>
      <td colspan="7" class="loading-state">
        <div class="spinner"></div>
        <span>Loading patient clinical records...</span>
      </td>
    </tr>
  `;try{const n=await l("/api/v1/patients?limit=100");s.patients=Array.isArray(n==null?void 0:n.patients)?n.patients:Array.isArray(n)?n:[],m(),e.patientCountBadge.textContent=s.patients.length}catch(n){try{const a=await l("/patients?limit=100");s.patients=Array.isArray(a==null?void 0:a.patients)?a.patients:Array.isArray(a)?a:[],m(),e.patientCountBadge.textContent=s.patients.length}catch{e.patientsTableBody.innerHTML=`
        <tr>
          <td colspan="7" class="empty-state">
            <span>Failed to load patients: ${n.message}</span>
            <button class="btn btn-secondary btn-sm" onclick="window.carecloud.refreshAll()">Retry</button>
          </td>
        </tr>
      `}}}function m(){const n=s.searchQuery.toLowerCase().trim(),a=s.filterGender,t=s.filterInsurance;s.filteredPatients=s.patients.filter(o=>{const r=`${o.first_name||""} ${o.last_name||""}`.toLowerCase(),i=String(o.phone_number||"").toLowerCase(),f=String(o.email||"").toLowerCase(),I=!n||r.includes(n)||i.includes(n)||f.includes(n),B=!a||o.gender&&o.gender.toLowerCase()===a.toLowerCase(),C=!t||o.insurance_provider&&o.insurance_provider.toLowerCase().includes(t.toLowerCase());return I&&B&&C}),w(s.filteredPatients)}function w(n){if(!n||n.length===0){e.patientsTableBody.innerHTML=`
      <tr>
        <td colspan="7" class="empty-state">
          <span>No patient records found matching your filters.</span>
        </td>
      </tr>
    `,e.patientFooterCount.textContent="Showing 0 patients";return}const a=n.map(t=>{const o=`${(t.first_name||"P")[0]}${(t.last_name||"")[0]||""}`.toUpperCase();return`
      <tr data-patient-id="${t.patient_id}">
        <td>
          <div class="patient-cell">
            <div class="patient-avatar-sm">${o}</div>
            <div>
              <div class="patient-name-title">${t.first_name||""} ${t.last_name||""}</div>
              <div class="patient-email-sub">${t.email||"No email provided"}</div>
            </div>
          </div>
        </td>
        <td><strong>${p(t.phone_number)}</strong></td>
        <td>
          <span>${c(t.date_of_birth)}</span>
          <span class="badge badge-outline capitalize" style="margin-left:6px">${t.gender||"unknown"}</span>
        </td>
        <td>
          <span class="badge badge-primary">${t.insurance_provider||"Self-Pay"}</span>
        </td>
        <td><code>${t.policy_number||"N/A"}</code></td>
        <td>${c(t.created_at)}</td>
        <td class="text-right">
          <button class="btn btn-secondary btn-xs btn-view-chart" data-id="${t.patient_id}">
            View Chart
          </button>
        </td>
      </tr>
    `}).join("");e.patientsTableBody.innerHTML=a,e.patientFooterCount.textContent=`Showing ${n.length} of ${s.patients.length} patient records`,e.patientsTableBody.querySelectorAll("tr").forEach(t=>{t.addEventListener("click",o=>{const r=t.getAttribute("data-patient-id");r&&E(r)})})}function L(n){if(!n||n.length===0){e.callLogsList.innerHTML=`
      <div class="empty-state">
        <span>No inbound voice sessions recorded yet. Call ${s.inboundPhoneNumber} to simulate your first session!</span>
      </div>
    `;return}e.callLogsList.innerHTML=n.map(a=>{const t=a.duration_seconds?`${Math.floor(a.duration_seconds/60)}m ${a.duration_seconds%60}s`:"In Progress / Brief";return`
      <div class="call-card">
        <div class="call-header">
          <div class="caller-id-wrap">
            <span class="status-dot"></span>
            <span class="caller-phone">${p(a.caller_phone_number)}</span>
            <span class="badge badge-success">${a.call_status||"completed"}</span>
          </div>
          <div class="call-meta-badges">
            <span>${c(a.created_at)}</span>
            <span>&bull;</span>
            <span>Duration: ${t}</span>
          </div>
        </div>
        <div class="call-transcript-box">
          ${a.transcript||"No transcript available for this call."}
        </div>
      </div>
    `}).join("")}async function E(n){e.patientDrawer.classList.add("active"),e.patientDrawerBackdrop.classList.add("active"),e.btnDeletePatient.setAttribute("data-id",n),e.drawerName.textContent="Loading patient chart...",e.drawerPhone.textContent="...",e.drawerDob.textContent="...";try{let a;try{a=await l(`/dashboard/patient-data/${n}`)}catch{a={patient:await l(`/api/v1/patients/${n}`),appointments:[],callLogs:[]}}const t=a.patient;s.selectedPatient=t;const o=`${(t.first_name||"P")[0]}${(t.last_name||"")[0]||""}`.toUpperCase();e.drawerAvatar.textContent=o,e.drawerName.textContent=`${t.first_name} ${t.last_name}`,e.drawerPhone.textContent=p(t.phone_number),e.drawerDob.textContent=`DOB: ${c(t.date_of_birth)}`,e.dfFirstName.textContent=t.first_name||"--",e.dfLastName.textContent=t.last_name||"--",e.dfDob.textContent=c(t.date_of_birth),e.dfGender.textContent=t.gender||"--",e.dfLanguage.textContent=t.preferred_language||"English",e.dfUuid.textContent=t.patient_id||t._id||"--",e.dfPhone.textContent=p(t.phone_number),e.dfEmail.textContent=t.email||"--",e.dfAddress.textContent=t.street_address||"--",e.dfCity.textContent=t.city||"--",e.dfState.textContent=t.state||"--",e.dfZip.textContent=t.zip_code||"--",e.dfEmerName.textContent=t.emergency_contact_name||"--",e.dfEmerRel.textContent=t.emergency_contact_relationship||"--",e.dfEmerPhone.textContent=p(t.emergency_contact_phone),e.dfInsProvider.textContent=t.insurance_provider||"--",e.dfInsPolicy.textContent=t.policy_number||"--",e.dfInsGroup.textContent=t.group_number||"--",a.appointments&&a.appointments.length>0?e.drawerAppointmentsList.innerHTML=a.appointments.map(r=>`
        <div class="appt-item-card">
          <div>
            <strong>${c(r.appointment_date)} at ${r.appointment_time||"10:00 AM"}</strong>
            <div style="font-size:0.75rem; color: var(--text-muted);">${r.reason||"General Consultation"} (${r.doctor_name||"Attending Physician"})</div>
          </div>
          <span class="badge badge-success">${r.status||"scheduled"}</span>
        </div>
      `).join(""):e.drawerAppointmentsList.innerHTML=`
        <div class="empty-list-note">No appointments scheduled for this patient yet.</div>
      `,a.callLogs&&a.callLogs.length>0?e.drawerCallsList.innerHTML=a.callLogs.map(r=>`
        <div class="call-card" style="padding:12px;">
          <div class="call-header">
            <span class="badge badge-primary">${r.call_status||"completed"}</span>
            <span style="font-size:0.72rem; color:var(--text-muted);">${c(r.created_at)}</span>
          </div>
          <div class="call-transcript-box" style="font-size:0.75rem; max-height:80px;">
            ${r.transcript||"Inbound call recorded."}
          </div>
        </div>
      `).join(""):e.drawerCallsList.innerHTML=`
        <div class="empty-list-note">No voice call transcripts associated with this record.</div>
      `}catch(a){d(`Failed to load patient chart: ${a.message}`,"error")}}function g(){e.patientDrawer.classList.remove("active"),e.patientDrawerBackdrop.classList.remove("active"),s.selectedPatient=null}async function _(n){n.preventDefault();const a=new FormData(e.registerPatientForm),t=Object.fromEntries(a.entries());t.phone_number=t.phone_number.replace(/\D/g,""),t.emergency_contact_phone&&(t.emergency_contact_phone=t.emergency_contact_phone.replace(/\D/g,"")),t.gender&&!t.sex&&(t.sex=t.gender.charAt(0).toUpperCase()+t.gender.slice(1).toLowerCase()),t.street_address&&!t.address_line_1&&(t.address_line_1=t.street_address),t.policy_number&&!t.insurance_member_id&&(t.insurance_member_id=t.policy_number);const o=document.getElementById("btn-submit-register");o.disabled=!0,o.textContent="Saving...";try{await l("/api/v1/patients",{method:"POST",body:JSON.stringify(t)}),d(`Patient ${t.first_name} ${t.last_name} registered successfully!`,"success"),y(),e.registerPatientForm.reset(),await h(),await u()}catch(r){r.message.includes("already exists")||r.message.includes("409")||r.message.includes("Conflict")?d(`Conflict (409): A patient with phone ${t.phone_number} is already registered!`,"error"):d(`Registration failed: ${r.message}`,"error")}finally{o.disabled=!1,o.textContent="Create Record"}}async function P(){const n=e.btnDeletePatient.getAttribute("data-id");if(!(!n||!window.confirm(`Are you sure you want to soft-delete patient record #${n}?
This marks deleted_at in the database.`)))try{await l(`/api/v1/patients/${n}`,{method:"DELETE"}),d("Patient record marked as soft-deleted (deleted_at recorded).","success"),g(),await h(),await u()}catch(t){d(`Failed to delete patient: ${t.message}`,"error")}}async function $(n){n.preventDefault();const a=new FormData(e.scheduleAppointmentForm),t=Object.fromEntries(a.entries());try{await l("/appointments",{method:"POST",body:JSON.stringify(t)}),d("Appointment successfully scheduled and synced!","success"),b(),s.selectedPatient&&await E(s.selectedPatient.patient_id),await u()}catch(o){d(`Failed to schedule appointment: ${o.message}`,"error")}}function v(n,a="Phone number"){navigator.clipboard.writeText(n).then(()=>d(`${a} copied to clipboard!`,"info"),()=>d("Could not copy to clipboard","error"))}function k(){e.registerModalBackdrop.classList.add("active")}function y(){e.registerModalBackdrop.classList.remove("active")}function A(){if(!s.selectedPatient)return;e.apptPatientId.value=s.selectedPatient.patient_id,e.apptPatientNameDisplay.value=`${s.selectedPatient.first_name} ${s.selectedPatient.last_name} (${p(s.selectedPatient.phone_number)})`;const n=new Date;n.setDate(n.getDate()+1),e.apptDateInput.value=n.toISOString().split("T")[0],e.appointmentModalBackdrop.classList.add("active")}function b(){e.appointmentModalBackdrop.classList.remove("active")}function x(){e.tabBtns.forEach(a=>{a.addEventListener("click",()=>{e.tabBtns.forEach(r=>r.classList.remove("active")),e.tabPanels.forEach(r=>r.classList.remove("active")),a.classList.add("active");const t=a.getAttribute("data-tab"),o=document.getElementById(t);o&&o.classList.add("active")})}),e.patientSearchInput.addEventListener("input",a=>{s.searchQuery=a.target.value,e.btnClearSearch.style.display=s.searchQuery?"block":"none",m()}),e.btnClearSearch.addEventListener("click",()=>{e.patientSearchInput.value="",s.searchQuery="",e.btnClearSearch.style.display="none",m()}),e.filterGender.addEventListener("change",a=>{s.filterGender=a.target.value,m()}),e.filterInsurance.addEventListener("change",a=>{s.filterInsurance=a.target.value,m()}),e.btnCopyPhone.addEventListener("click",()=>v(s.inboundPhoneNumber,"Voice Agent phone number")),e.btnCopyDialerNumber.addEventListener("click",()=>v(s.inboundPhoneNumber,"Voice Agent phone number"));const n=async()=>{d("Refreshing clinical database...","info"),await Promise.all([h(),u()])};e.btnRefreshAll.addEventListener("click",n),e.btnRefreshCalls.addEventListener("click",u),e.btnCloseDrawer.addEventListener("click",g),e.btnCloseDrawerBottom.addEventListener("click",g),e.patientDrawerBackdrop.addEventListener("click",g),e.btnDeletePatient.addEventListener("click",P),e.btnOpenRegisterModal.addEventListener("click",k),e.btnCloseRegisterModal.addEventListener("click",y),e.btnCancelRegister.addEventListener("click",y),e.registerPatientForm.addEventListener("submit",_),e.btnOpenBookAppointment.addEventListener("click",A),e.btnCloseAppointmentModal.addEventListener("click",b),e.btnCancelAppointment.addEventListener("click",b),e.scheduleAppointmentForm.addEventListener("submit",$),e.btnTestWebhookInfo.addEventListener("click",()=>e.testInfoModalBackdrop.classList.add("active")),e.btnCloseTestInfo.addEventListener("click",()=>e.testInfoModalBackdrop.classList.remove("active")),e.btnDismissTestInfo.addEventListener("click",()=>e.testInfoModalBackdrop.classList.remove("active")),document.addEventListener("keydown",a=>{a.key==="Escape"&&(g(),y(),b(),e.testInfoModalBackdrop.classList.remove("active"))}),window.carecloud={refreshAll:n}}async function T(){x(),await Promise.all([h(),u()])}T();
