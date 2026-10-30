/**
 * EventHub Frontend Client Application
 * Practical No. 05 - Web Application Framework: ExpressJS
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const eventsLoading = document.getElementById('eventsLoading');
  const eventsError = document.getElementById('eventsError');
  const eventsErrorMessage = document.getElementById('eventsErrorMessage');
  const eventsGrid = document.getElementById('eventsGrid');
  const eventSelect = document.getElementById('eventId');
  const registrationForm = document.getElementById('registrationForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const formAlert = document.getElementById('formAlert');
  const formAlertContent = document.getElementById('formAlertContent');
  const notesTextarea = document.getElementById('notes');
  const charCounter = document.getElementById('charCounter');
  const confirmationModal = document.getElementById('confirmationModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  // Modal Detail Elements
  const modalRegId = document.getElementById('modalRegId');
  const modalName = document.getElementById('modalName');
  const modalEvent = document.getElementById('modalEvent');
  const modalTicket = document.getElementById('modalTicket');
  const modalTimestamp = document.getElementById('modalTimestamp');

  let isSubmitting = false;
  let cachedEvents = [];

  // ==========================================
  // Mobile Navigation Toggle
  // ==========================================
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('nav-open');
    });

    // Close mobile nav when clicking any nav link
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================
  // Character Counter for Notes Field
  // ==========================================
  if (notesTextarea && charCounter) {
    notesTextarea.addEventListener('input', () => {
      const count = notesTextarea.value.length;
      charCounter.textContent = `${count} / 300`;
      if (count > 300) {
        charCounter.style.color = 'var(--danger)';
      } else {
        charCounter.style.color = 'var(--text-muted)';
      }
    });
  }

  // ==========================================
  // Fetch & Render Events
  // ==========================================
  async function loadEvents() {
    try {
      eventsLoading.classList.remove('hidden');
      eventsError.classList.add('hidden');
      eventsGrid.innerHTML = '';

      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(result.message || 'Invalid data received from server');
      }

      cachedEvents = result.data;
      renderEvents(cachedEvents);
      populateEventDropdown(cachedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      eventsError.classList.remove('hidden');
      eventsErrorMessage.textContent = `Unable to load events: ${error.message}. Please check your connection.`;
    } finally {
      eventsLoading.classList.add('hidden');
    }
  }

  function renderEvents(events) {
    if (events.length === 0) {
      eventsGrid.innerHTML = '<p class="loading-state">No events currently scheduled.</p>';
      return;
    }

    eventsGrid.innerHTML = events
      .map((event) => {
        const remaining = typeof event.remainingSeats === 'number' ? event.remainingSeats : event.capacity - event.registrationCount;
        const isFull = event.isFull || remaining <= 0;
        const percentageFilled = Math.min(100, Math.round((event.registrationCount / event.capacity) * 100));

        return `
          <article class="event-card" id="card-${escapeHtml(event.id)}">
            <div class="event-card-header">
              <h3 class="event-title">${escapeHtml(event.name)}</h3>
              <span class="badge ${isFull ? 'badge-full' : 'badge-available'}">
                ${isFull ? 'Event Full' : `${remaining} Seats Left`}
              </span>
            </div>

            <p class="event-desc">${escapeHtml(event.description)}</p>

            <div class="event-meta">
              <div class="event-meta-item">
                <span>&#128197; Date:</span>
                <strong>${escapeHtml(event.date)}</strong>
              </div>
              <div class="event-meta-item">
                <span>&#128205; Venue:</span>
                <strong>${escapeHtml(event.venue)}</strong>
              </div>
              <div class="event-meta-item">
                <span>&#128101; Capacity:</span>
                <strong>${event.registrationCount} / ${event.capacity} registered</strong>
              </div>
              <div class="event-capacity-bar" title="${percentageFilled}% filled">
                <div class="event-capacity-fill ${isFull ? 'fill-full' : ''}" style="width: ${percentageFilled}%"></div>
              </div>
            </div>

            <button
              type="button"
              class="btn ${isFull ? 'btn-outline' : 'btn-primary'}"
              ${isFull ? 'disabled' : ''}
              onclick="window.selectEventForRegistration('${escapeHtml(event.id)}')"
            >
              ${isFull ? 'Capacity Reached' : 'Register For This Event'}
            </button>
          </article>
        `;
      })
      .join('');
  }

  function populateEventDropdown(events) {
    const currentVal = eventSelect.value;
    eventSelect.innerHTML = '<option value="">-- Choose an Event --</option>';

    events.forEach((event) => {
      const remaining = typeof event.remainingSeats === 'number' ? event.remainingSeats : event.capacity - event.registrationCount;
      const isFull = event.isFull || remaining <= 0;

      const option = document.createElement('option');
      option.value = event.id;
      option.textContent = `${event.name} (${isFull ? 'FULL' : `${remaining} seats remaining`})`;
      if (isFull) {
        option.disabled = true;
      }
      eventSelect.appendChild(option);
    });

    if (currentVal && events.some((e) => e.id === currentVal && !e.isFull)) {
      eventSelect.value = currentVal;
    }
  }

  // Global helper for Event Card button click
  window.selectEventForRegistration = function (eventId) {
    if (eventSelect) {
      eventSelect.value = eventId;
      clearFieldError('eventId');

      const registerSection = document.getElementById('register');
      if (registerSection) {
        registerSection.scrollIntoView({ behavior: 'smooth' });
      }

      // Briefly focus the full name field
      const nameInput = document.getElementById('fullName');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 400);
      }
    }
  };

  // ==========================================
  // Form Validation & Submission
  // ==========================================
  function clearAllErrors() {
    formAlert.classList.add('hidden');
    formAlert.className = 'alert hidden';
    formAlertContent.innerHTML = '';

    document.querySelectorAll('.field-error').forEach((el) => {
      el.textContent = '';
    });
    document.querySelectorAll('.form-control, .form-select').forEach((el) => {
      el.classList.remove('input-invalid');
    });
  }

  function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
      errorEl.textContent = message;
    }
    if (inputEl) {
      inputEl.classList.add('input-invalid');
    }
  }

  function clearFieldError(fieldId) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
      errorEl.textContent = '';
    }
    if (inputEl) {
      inputEl.classList.remove('input-invalid');
    }
  }

  // Add blur/input listeners to clear field-level errors dynamically
  ['fullName', 'email', 'phone', 'college', 'eventId', 'ticketType'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => clearFieldError(id));
      el.addEventListener('change', () => clearFieldError(id));
    }
  });

  function validateClientForm(formData) {
    const errors = {};

    // 1. Full Name
    const name = formData.fullName ? formData.fullName.trim() : '';
    if (!name) {
      errors.fullName = 'Full name is required';
    } else if (name.length < 2 || name.length > 60) {
      errors.fullName = 'Full name must be between 2 and 60 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // 2. Email
    const email = formData.email ? formData.email.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email) || email.length > 254) {
      errors.email = 'A valid email address is required';
    }

    // 3. Phone (10 digits, starts with 6-9)
    const phone = formData.phone ? formData.phone.trim() : '';
    const cleanedPhone = phone.replace(/[\s\-()]/g, '').replace(/^(\+91|91)/, '');
    if (!phone) {
      errors.phone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      errors.phone = 'Valid 10-digit Indian mobile number required (starting with 6, 7, 8, or 9)';
    }

    // 4. College
    const college = formData.college ? formData.college.trim() : '';
    if (!college) {
      errors.college = 'College name is required';
    } else if (college.length < 2 || college.length > 100) {
      errors.college = 'College name must be between 2 and 100 characters';
    }

    // 5. Event selection
    if (!formData.eventId) {
      errors.eventId = 'Please select an event';
    }

    // 6. Ticket Type
    if (!formData.ticketType || !['Standard', 'Student'].includes(formData.ticketType)) {
      errors.ticketType = 'Ticket type must be Standard or Student';
    }

    // 7. Notes
    if (formData.notes && formData.notes.trim().length > 300) {
      errors.notes = 'Notes cannot exceed 300 characters';
    }

    return errors;
  }

  function showAlert(type, title, messages = []) {
    formAlert.className = `alert alert-${type}`;
    formAlert.classList.remove('hidden');

    let html = `<strong>${escapeHtml(title)}</strong>`;
    if (messages.length > 0) {
      html += `<ul class="alert-list">${messages.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>`;
    }
    formAlertContent.innerHTML = html;
    formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearAllErrors();

    // Extract form data
    const formData = {
      fullName: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      college: document.getElementById('college').value,
      eventId: document.getElementById('eventId').value,
      ticketType: document.getElementById('ticketType').value,
      notes: document.getElementById('notes').value
    };

    // Client-side convenience validation
    const clientErrors = validateClientForm(formData);
    const errorKeys = Object.keys(clientErrors);

    if (errorKeys.length > 0) {
      errorKeys.forEach((key) => {
        showFieldError(key, clientErrors[key]);
      });
      showAlert('error', 'Please correct the highlighted errors before submitting.', Object.values(clientErrors));
      return;
    }

    // Start submission state
    isSubmitting = true;
    submitBtn.disabled = true;
    btnText.textContent = 'Submitting Registration...';
    btnSpinner.classList.remove('hidden');

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.status === 201) {
        // HTTP 201 Created: Show Confirmation Modal
        showConfirmationModal(result.data);
        registrationForm.reset();
        if (charCounter) {
          charCounter.textContent = '0 / 300';
        }

        // Refresh event availability
        await loadEvents();
      } else if (response.status === 400) {
        // HTTP 400 Validation Error
        const errors = Array.isArray(result.errors) ? result.errors : [result.message || 'Validation failed'];
        showAlert('error', 'Validation Failed', errors);
      } else if (response.status === 409) {
        // HTTP 409 Conflict: Capacity Full
        showAlert('error', 'Registration Closed', [result.message || 'This event has reached full capacity.']);
        await loadEvents();
      } else {
        // Other unexpected errors
        showAlert('error', 'Submission Failed', [result.message || 'An error occurred while submitting. Please try again.']);
      }
    } catch (networkError) {
      console.error('Network error during registration:', networkError);
      showAlert('error', 'Network Connection Error', [
        'Could not reach the server. Please ensure the Express server is running and try again.'
      ]);
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      btnText.textContent = 'Confirm Registration';
      btnSpinner.classList.add('hidden');
    }
  });

  // Reset button listener
  document.getElementById('resetBtn').addEventListener('click', () => {
    clearAllErrors();
    if (charCounter) {
      charCounter.textContent = '0 / 300';
    }
  });

  // ==========================================
  // Confirmation Modal
  // ==========================================
  function showConfirmationModal(registration) {
    modalRegId.textContent = registration.id || '-';
    modalName.textContent = registration.fullName || '-';
    modalEvent.textContent = registration.eventName || '-';
    modalTicket.textContent = registration.ticketType || 'Standard';

    if (registration.registeredAt) {
      const date = new Date(registration.registeredAt);
      modalTimestamp.textContent = date.toLocaleString();
    } else {
      modalTimestamp.textContent = 'Just now';
    }

    confirmationModal.classList.remove('hidden');
  }

  function hideConfirmationModal() {
    confirmationModal.classList.add('hidden');
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', hideConfirmationModal);
  }

  if (confirmationModal) {
    confirmationModal.addEventListener('click', (e) => {
      if (e.target === confirmationModal) {
        hideConfirmationModal();
      }
    });
  }

  // Helper function to escape HTML strings safely
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial load
  loadEvents();
});

