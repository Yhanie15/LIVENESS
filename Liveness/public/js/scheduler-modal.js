/**
 * Scheduler Modal JavaScript
 * Handles the functionality of the scheduler modal and API integration
 */
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const schedModalContainer  = document.getElementById('sched-modal-container');
    const schedModalCloseBtn   = document.getElementById('sched-modal-close-btn');
    const schedModalSaveBtn    = document.getElementById('sched-modal-save-btn');
    const schedModalDateInput  = document.getElementById('sched-modal-date-input');
    const schedModalHourInput  = document.getElementById('sched-modal-hour-input');
    const schedModalMinuteInput= document.getElementById('sched-modal-minute-input');
    const schedModalAmPmBtn    = document.getElementById('sched-modal-ampm-btn');
    const schedModalAmPmText   = document.getElementById('sched-modal-ampm-text');
    const schedModalAmPmOptions= document.getElementById('sched-modal-ampm-options');
    const schedModalAmPmOptionElements = document.querySelectorAll('.sched-modal-ampm-option');

    const API_BASE_URL = 'http://192.168.100.152:5001';

    // State
    let schedulerActive = false;

    /* ---------- flatpickr init ---------- */
    if (schedModalDateInput) {
        flatpickr(schedModalDateInput, {
            dateFormat: "Y-m-d",
            minDate: "today",
            disableMobile: "true",
            clickOpens: true,
            closeOnSelect: true,
            allowInput: false,
            static: false
        });
    }

    /* ---------- API wrappers ---------- */
    async function checkSchedulerStatus() {
        try {
            const res = await fetch(`${API_BASE_URL}/status`, {
                method: 'GET',
                mode: 'cors',                         // ★
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                schedulerActive = data.scheduler_running;
                updateSchedulerUI();
            } else {
                console.error('Failed to fetch scheduler status:', res.status);
            }
        } catch (err) {
            console.error('Error checking scheduler status:', err);
        }
    }

    async function startScheduler(hour, minute, date) {
        try {
            const res = await fetch(`${API_BASE_URL}/start_scheduler`, {
                method: 'POST',
                mode: 'cors',                         // ★
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hour, minute, date })
            });
            if (res.ok) {
                const data = await res.json();
                schedulerActive = true;
                updateSchedulerUI();
                showNotification(data.message, 'success');
                return true;
            } else {
                const data = await res.json();
                showNotification(data.message || 'Failed to start scheduler', 'error');
                return false;
            }
        } catch (err) {
            console.error('Error starting scheduler:', err);
            showNotification('Error connecting to server: ' + err.message, 'error');
            return false;
        }
    }

    async function stopScheduler() {
        try {
            const res = await fetch(`${API_BASE_URL}/stop_scheduler`, {
                method: 'POST',
                mode: 'cors',                         // ★
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                schedulerActive = false;
                updateSchedulerUI();
                showNotification(data.message, 'success');
                return true;
            } else {
                const data = await res.json();
                showNotification(data.message || 'Failed to stop scheduler', 'error');
                return false;
            }
        } catch (err) {
            console.error('Error stopping scheduler:', err);
            showNotification('Error connecting to server: ' + err.message, 'error');
            return false;
        }
    }

    async function manualRetrain() {
        try {
            const res = await fetch(`${API_BASE_URL}/retrain`, {
                method: 'POST',
                mode: 'cors',                         // ★
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                showNotification(data.message, 'success');
            } else {
                const data = await res.json();
                showNotification(data.message || 'Failed to start manual retraining', 'error');
            }
        } catch (err) {
            console.error('Error starting manual retraining:', err);
            showNotification('Error connecting to server: ' + err.message, 'error');
        }
    }

    /* ---------- UI helpers (unchanged) ---------- */
    function updateSchedulerUI() {
        if (!schedModalSaveBtn) return;
        if (schedulerActive) {
            schedModalSaveBtn.textContent = 'Stop Scheduler';
            schedModalSaveBtn.classList.add('scheduler-active');
        } else {
            schedModalSaveBtn.textContent = 'Save';
            schedModalSaveBtn.classList.remove('scheduler-active');
        }
    }

    function showNotification(message, type = 'info') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.position = 'fixed';
            container.style.top = '50px';
            container.style.right = '20px';
            container.style.zIndex = '1000';
            document.body.appendChild(container);
        }

        const note = document.createElement('div');
        note.className = `notification ${type}`;
        note.style.cssText = `
            padding:10px 20px;margin:5px 0;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.2);
            min-width:200px;transition:opacity .5s ease;
        `;
        if (type === 'error') {
            note.style.background = '#f8d7da';
            note.style.color = '#721c24';
            note.style.borderLeft = '4px solid #dc3545';
        } else if (type === 'success') {
            note.style.background = '#d4edda';
            note.style.color = '#155724';
            note.style.borderLeft = '4px solid #28a745';
        } else {
            note.style.background = '#d1ecf1';
            note.style.color = '#0c5460';
            note.style.borderLeft = '4px solid #17a2b8';
        }
        note.textContent = message;
        container.appendChild(note);

        setTimeout(() => {
            note.style.opacity = '0';
            setTimeout(() => {
                note.remove();
                if (!container.children.length) container.remove();
            }, 500);
        }, 5000);
    }

    /* ---------- modal open/close & validation (unchanged) ---------- */
    window.openSchedulerModal = function () {
        const threshModal = document.getElementById('thresh-modal-container');
        if (threshModal && !threshModal.classList.contains('thresh-modal-hidden'))
            threshModal.classList.add('thresh-modal-hidden');

        checkSchedulerStatus();
        schedModalContainer.classList.remove('sched-modal-hidden');
        document.body.style.overflow = 'hidden';
    };

    function closeSchedulerModal() {
        schedModalContainer.classList.add('sched-modal-hidden');
        document.body.style.overflow = '';
    }

    function toggleAmPmDropdown() {
        schedModalAmPmOptions.classList.toggle('sched-modal-hidden');
    }

    function selectAmPmOption(v) {
        schedModalAmPmText.textContent = v;
        schedModalAmPmOptions.classList.add('sched-modal-hidden');
    }

    document.addEventListener('click', (e) => {
        if (!schedModalAmPmOptions.classList.contains('sched-modal-hidden')) {
            if (!schedModalAmPmBtn.contains(e.target) && !schedModalAmPmOptions.contains(e.target))
                schedModalAmPmOptions.classList.add('sched-modal-hidden');
        }
    });

    function validateHourInput() {
        if (!schedModalHourInput) return;
        let v = schedModalHourInput.value.replace(/[^0-9]/g, '');
        let h = parseInt(v, 10);
        if (isNaN(h)) schedModalHourInput.value = '';
        else if (h < 1) schedModalHourInput.value = '1';
        else if (h > 12) schedModalHourInput.value = '12';
        else schedModalHourInput.value = h.toString();
    }

    function validateMinuteInput() {
        if (!schedModalMinuteInput) return;
        let v = schedModalMinuteInput.value.replace(/[^0-9]/g, '');
        let m = parseInt(v, 10);
        if (isNaN(m) || m < 0) m = 0;
        else if (m > 59) m = 59;
        schedModalMinuteInput.value = m.toString().padStart(2, '0');
    }

    function convertTo24Hour(h, m, amPm) {
        h = parseInt(h, 10);
        m = parseInt(m, 10);
        if (amPm === 'PM' && h < 12) h += 12;
        else if (amPm === 'AM' && h === 12) h = 0;
        return { hour: h, minute: m };
    }

    async function saveSchedule() {
        if (schedulerActive) {
            if (await stopScheduler()) closeSchedulerModal();
            return;
        }
        if (!schedModalDateInput.value) { showNotification('Please select a date', 'error'); return; }
        if (!schedModalHourInput.value) { showNotification('Please enter an hour', 'error'); return; }
        if (!schedModalMinuteInput.value) { showNotification('Please enter minutes', 'error'); return; }

        const date     = schedModalDateInput.value;
        const hour12   = schedModalHourInput.value;
        const minute12 = schedModalMinuteInput.value;
        const ampm     = schedModalAmPmText.textContent;
        const { hour, minute } = convertTo24Hour(hour12, minute12, ampm);

        if (await startScheduler(hour, minute, date)) {
            document.dispatchEvent(new CustomEvent('scheduleSet', {
                detail: { date, time: `${hour12}:${minute12} ${ampm}` }
            }));
            closeSchedulerModal();
        }
    }

    /* ---------- listeners ---------- */
    checkSchedulerStatus();
    schedModalCloseBtn?.addEventListener('click', closeSchedulerModal);
    schedModalSaveBtn ?.addEventListener('click', saveSchedule);
    schedModalAmPmBtn ?.addEventListener('click', toggleAmPmDropdown);
    schedModalAmPmOptionElements.forEach(o => o.addEventListener('click', () => selectAmPmOption(o.dataset.value)));
    schedModalHourInput  ?.addEventListener('blur', validateHourInput);
    schedModalMinuteInput?.addEventListener('blur', validateMinuteInput);
    document.getElementById('manual-retrain-btn')?.addEventListener('click', manualRetrain);

    schedModalContainer?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); saveSchedule(); }
    });
});
