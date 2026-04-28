document.addEventListener('DOMContentLoaded', function () {

  /* ---------------- Supabase Config ---------------- */
  const SUPABASE_URL     = 'https://vtlikxnjfbnuccgjcqkq.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bGlreG5qZmJudWNjZ2pjcWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjg1NjIsImV4cCI6MjA5Mjk0NDU2Mn0.nm4TI9-8UucSSK-p0-ondINQnTy_g5RsFUJ2GCzk-AI';

  /* ---------------- Slider ---------------- */
  const slides       = document.querySelectorAll('.slide');
  const dotsContainer = document.querySelector('.slider-dots');
  const prevBtn      = document.querySelector('.slider-prev');
  const nextBtn      = document.querySelector('.slider-next');

  let currentSlide = 0;
  let slideInterval;

  slides.forEach((slide, index) => {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.dot');

  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot   => dot.classList.remove('active'));
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    currentSlide = index;
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
    resetInterval();
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
    resetInterval();
  }

  function goToSlide(index) {
    showSlide(index);
    resetInterval();
  }

  function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
  }

  if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
  }

  if (slides.length > 0) {
    slideInterval = setInterval(nextSlide, 5000);
  }

  /* ---------------- Tabs ---------------- */
  const tabBtns    = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');

      tabBtns.forEach(b     => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(tabId);
      if (target) target.classList.add('active');
    });
  });

  /* ---------------- Mobile Menu ---------------- */
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.classList.add('mobile-menu-btn');
  mobileMenuBtn.innerHTML = '☰';

  const headerContainer = document.querySelector('header .container');
  if (headerContainer) headerContainer.appendChild(mobileMenuBtn);

  mobileMenuBtn.addEventListener('click', function () {
    const nav = document.querySelector('nav');
    if (nav) nav.classList.toggle('show');
  });

  /* ---------------- Scroll Animations ---------------- */
  const animatedElements = document.querySelectorAll('.animate__animated');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity    = '1';
        entry.target.style.transform  = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animatedElements.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 0.8s ease';
    observer.observe(el);
  });

  /* ---------------- Form Submission → Supabase ---------------- */
  const form = document.querySelector('.booking-form');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');

      // ── Basic validation ──────────────────────────────────────
      const dateInput = document.getElementById('booking-date').value;
      if (!dateInput) {
        alert('Please select a booking date.');
        return;
      }

      // ── Gather values ─────────────────────────────────────────
      const payload = {
        full_name:    document.querySelector("[name='entry.803152659']").value.trim(),
        email:        document.querySelector("[name='entry.1228454543']").value.trim(),
        phone:        document.querySelector("[name='entry.724340331']").value.trim(),
        service:      document.querySelector("[name='entry.35476537']").value,
        booking_date: dateInput,          // "YYYY-MM-DD" — matches Supabase date column
        message:      document.querySelector("[name='entry.1773366872']").value.trim(),
      };

      // ── Loading state ─────────────────────────────────────────
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Submitting…';

      // ── POST to Supabase ──────────────────────────────────────
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'apikey':         SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer':         'return=minimal'   // don't return the row, just a 201
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          // ── Success ───────────────────────────────────────────
          showMessage(form, 'success', '✅ Booking submitted! We\'ll be in touch shortly.');
          form.reset();
        } else {
          // ── Supabase returned an error ────────────────────────
          const errData = await response.json().catch(() => ({}));
          console.error('Supabase error:', errData);
          const hint = errData.message || errData.hint || 'Unknown error';
          showMessage(form, 'error', `❌ Submission failed: ${hint}`);
        }

      } catch (err) {
        // ── Network / fetch error ─────────────────────────────
        console.error('Network error:', err);
        showMessage(form, 'error', '❌ Network error. Please check your connection and try again.');
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Submit';
      }
    });
  }

  /* ── Helper: show inline success/error message ──────────────── */
  function showMessage(form, type, text) {
    // Remove any existing message
    const existing = form.querySelector('.form-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className   = 'form-message';
    msg.textContent = text;
    msg.style.cssText = `
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      margin-top: 4px;
      background: ${type === 'success' ? '#e6f4f0' : '#fdecea'};
      color:      ${type === 'success' ? '#1f6f64' : '#c0392b'};
      border-left: 4px solid ${type === 'success' ? '#1f6f64' : '#e74c3c'};
    `;
    form.appendChild(msg);

    // Auto-remove after 6 seconds
    setTimeout(() => msg.remove(), 6000);
  }

});