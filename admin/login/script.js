/* ── Config ── */
const API = 'http://localhost:4000';

const form      = document.getElementById('loginForm');
const btn       = document.getElementById('loginBtn');
const alertBox  = document.getElementById('alertBox');
const alertMsg  = document.getElementById('alertMsg');
const backLink  = document.querySelector('.back-link');

const LOCK_KEY  = 'gs_login_locked_until';
const LOCK_MS   = 15 * 60 * 1000; // 15 minutes

/* ── Check lockout on page load ── */
(function checkLockout() {
  const until = parseInt(localStorage.getItem(LOCK_KEY) || '0', 10);
  if (Date.now() < until) {
    applyLockout(until);
  }
})();

/* ── If already logged in, skip to dashboard ── */
(async () => {
  try {
    const r = await fetch(API + '/api/auth/me', { credentials: 'include' });
    if (r.ok) window.location.replace('/admin/dashboard/');
  } catch (_) { /* not logged in */ }
})();

/* ── Submit ── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const email    = form.email.value.trim();
  const password = form.password.value;

  if (!email || !password) {
    return showAlert('Please enter your email and password.');
  }

  setLoading(true);
  try {
    const res  = await fetch(API + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.status === 429) {
      /* Rate limited — lock the UI for 15 minutes */
      const until = Date.now() + LOCK_MS;
      localStorage.setItem(LOCK_KEY, until);
      applyLockout(until);
      return;
    }

    if (!res.ok) return showAlert(data.error || 'Login failed. Try again.');
    window.location.replace('/admin/dashboard/');
  } catch (_) {
    showAlert('Could not reach the server. Check your connection.');
  } finally {
    setLoading(false);
  }
});

/* ── Lockout: hide form, show countdown ── */
let countdownTimer = null;

function applyLockout(until) {
  form.style.display     = 'none';
  backLink.style.display = 'none';
  alertBox.classList.add('show');
  tick(until);
}

function tick(until) {
  const remaining = Math.max(0, until - Date.now());
  const mins = String(Math.floor(remaining / 60000)).padStart(2, '0');
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');

  alertMsg.textContent =
    remaining > 0
      ? `Too many login attempts. Try again in ${mins}:${secs}.`
      : 'You can try again now.';

  if (remaining <= 0) {
    localStorage.removeItem(LOCK_KEY);
    clearInterval(countdownTimer);
    /* Restore the form */
    form.style.display     = '';
    backLink.style.display = '';
    hideAlert();
    return;
  }

  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => tick(until), 1000);
}

/* ── Helpers ── */
function setLoading(on) {
  btn.disabled = on;
  btn.classList.toggle('loading', on);
}
function showAlert(msg) {
  alertMsg.textContent = msg;
  alertBox.classList.add('show');
}
function hideAlert() {
  alertBox.classList.remove('show');
}