const CATEGORY_COLORS = {
  'Jedzenie': '#f59e0b',
  'Rachunki': '#3b82f6',
  'Transport': '#06b6d4',
  'Rozrywka': '#8b5cf6',
  'Zdrowie': '#ef4444',
  'Zakupy': '#ec4899',
  'Inne': '#6b7280'
};
const CATEGORY_ICONS = {
  'Jedzenie': '🍔',
  'Rachunki': '🧾',
  'Transport': '🚗',
  'Rozrywka': '🎮',
  'Zdrowie': '💊',
  'Zakupy': '🛍️',
  'Inne': '📦'
};
const DEFAULT_CATEGORIES = Object.keys(CATEGORY_ICONS);
// dopasowanie ikony po słowie kluczowym w nazwie kategorii (dla kategorii wpisanych ręcznie)
const KEYWORD_ICONS = [
  ['zwierz', '🐾'], ['pies', '🐶'], ['kot', '🐱'],
  ['dom', '🏠'], ['mieszkan', '🏠'], ['czynsz', '🏠'],
  ['prezent', '🎁'], ['podróż', '✈️'], ['wakacj', '✈️'], ['wycieczk', '✈️'],
  ['sport', '🏋️'], ['siłowni', '🏋️'], ['fitness', '🏋️'],
  ['edukacj', '📚'], ['kurs', '📚'], ['szkoł', '📚'], ['studi', '📚'], ['książ', '📚'],
  ['urod', '💄'], ['kosmetyk', '💄'], ['fryzjer', '💄'],
  ['dzieck', '🍼'], ['zabawk', '🍼'],
  ['subskryp', '🔁'], ['netflix', '🔁'], ['spotify', '🔁'],
  ['alkohol', '🍻'], ['impreza', '🍻'],
  ['paliwo', '⛽'], ['benzyn', '⛽'],
  ['telefon', '📱'], ['internet', '📱'],
  ['ubezpiecz', '🛡️'],
  ['hobby', '🎨'],
  ['ogród', '🌱'], ['ogrod', '🌱'],
  ['remont', '🔧'], ['napraw', '🔧'],
  ['ślub', '💍'], ['wesel', '💍'],
  ['darowizn', '❤️'], ['charytat', '❤️'], ['kawa', '☕'],
];
const FALLBACK_ICONS = ['🔹','🔸','✨','🌟','🔖','🧩','🎯','🧿','💠','🔺'];
const MONTH_NAMES = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];

let data = {};
let currentMonth = todayKey();
let currentUser = null;
let editingExpenseId = null;
let editingFixedId = null;
let editingExtraId = null;
let editingBudgetCategory = null;
let expenseSearchQuery = '';

function getCategoryIcon(name) {
  if (data._categoryIcons[name]) return data._categoryIcons[name];
  if (CATEGORY_ICONS[name]) return (data._categoryIcons[name] = CATEGORY_ICONS[name]);
  const lower = name.toLowerCase();
  for (const [kw, icon] of KEYWORD_ICONS) {
    if (lower.includes(kw)) {
      data._categoryIcons[name] = icon;
      saveData();
      return icon;
    }
  }
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const icon = FALLBACK_ICONS[hash % FALLBACK_ICONS.length];
  data._categoryIcons[name] = icon;
  saveData();
  return icon;
}

function getCategoryColor(name) {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  if (data._categoryColors[name]) return data._categoryColors[name];
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0) * 31, 0);
  const color = `hsl(${hash % 360}, 65%, 55%)`;
  data._categoryColors[name] = color;
  saveData();
  return color;
}

function groupByCategory(expenses) {
  const map = {};
  for (const exp of expenses) {
    const key = exp.category.toLowerCase();
    if (!map[key]) map[key] = { label: exp.category, total: 0 };
    map[key].total += exp.amount;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function normalizeCategoryName(name) {
  const trimmed = name.trim();
  const existing = data._categories.find(c => c.toLowerCase() === trimmed.toLowerCase());
  return existing || trimmed;
}

function rememberCategory(name) {
  if (!data._categories.some(c => c.toLowerCase() === name.toLowerCase())) {
    data._categories.push(name);
  }
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function saveData() {
  if (!currentUser) return;
  db.collection('users').doc(currentUser.uid).set(data).catch(e => {
    console.error('Błąd zapisu danych:', e);
  });
}

function getMonthData(key) {
  if (!data[key]) {
    data[key] = { income: 0, expenses: [] };
  }
  data[key].extraIncome = data[key].extraIncome || [];
  return data[key];
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatMoney(n) {
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ---- Motyw (paleta kolorów) ----
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themePanelEl = document.getElementById('themePanel');

function getCurrentThemeKey() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function applyTheme(key) {
  const theme = window.THEMES[key] || window.THEMES.light;
  for (const cssVar in theme.vars) {
    document.documentElement.style.setProperty(cssVar, theme.vars[cssVar]);
  }
  document.documentElement.setAttribute('data-theme', key);
  localStorage.setItem('asystent-finansow-theme', key);
  renderThemePanel();
}

function renderThemePanel() {
  const current = getCurrentThemeKey();
  themePanelEl.innerHTML = '';
  for (const key in window.THEMES) {
    const theme = window.THEMES[key];
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'theme-swatch' + (key === current ? ' active' : '');
    swatch.style.background = theme.swatch;
    swatch.title = theme.name;
    swatch.setAttribute('aria-label', theme.name);
    swatch.addEventListener('click', () => applyTheme(key));
    themePanelEl.appendChild(swatch);
  }
}

themeToggleBtn.addEventListener('click', () => {
  const willOpen = themePanelEl.classList.contains('hidden');
  themePanelEl.classList.toggle('hidden');
  themeToggleBtn.setAttribute('aria-expanded', String(willOpen));
});

document.addEventListener('click', (e) => {
  if (!themePanelEl.classList.contains('hidden') && !themePanelEl.contains(e.target) && e.target !== themeToggleBtn) {
    themePanelEl.classList.add('hidden');
    themeToggleBtn.setAttribute('aria-expanded', 'false');
  }
});

renderThemePanel();

// ---- DOM refs ----
const monthLabelEl = document.getElementById('monthLabel');
const incomeInput = document.getElementById('incomeInput');
const sumIncomeEl = document.getElementById('sumIncome');
const sumExpensesEl = document.getElementById('sumExpenses');
const sumRemainingEl = document.getElementById('sumRemaining');
const progressFillEl = document.getElementById('progressFill');
const expenseForm = document.getElementById('expenseForm');
const expenseTableBody = document.getElementById('expenseTableBody');
const upcomingBannerEl = document.getElementById('upcomingBanner');
const expenseSearchInput = document.getElementById('expenseSearch');
expenseSearchInput.addEventListener('input', () => {
  expenseSearchQuery = expenseSearchInput.value;
  render();
});
const emptyStateEl = document.getElementById('emptyState');
const categoryChartEl = document.getElementById('categoryChart');
const expDateInput = document.getElementById('expDate');

const extraIncomeForm = document.getElementById('extraIncomeForm');
const extraTitleInput = document.getElementById('extraTitle');
const extraAmountInput = document.getElementById('extraAmount');
const extraDateInput = document.getElementById('extraDate');
const extraIncomeListEl = document.getElementById('extraIncomeList');
const extraIncomeEmptyStateEl = document.getElementById('extraIncomeEmptyState');

const fixedForm = document.getElementById('fixedForm');
const fixedTitleInput = document.getElementById('fixedTitle');
const fixedAmountInput = document.getElementById('fixedAmount');
const fixedDateInput = document.getElementById('fixedDate');
const fixedStandingOrderInput = document.getElementById('fixedStandingOrder');
const fixedListEl = document.getElementById('fixedList');
const fixedEmptyStateEl = document.getElementById('fixedEmptyState');

const pieChartEl = document.getElementById('pieChart');
const pieLegendEl = document.getElementById('pieLegend');
const pieEmptyStateEl = document.getElementById('pieEmptyState');

const trendChartEl = document.getElementById('trendChart');
const trendEmptyStateEl = document.getElementById('trendEmptyState');

const authScreenEl = document.getElementById('authScreen');
const appScreenEl = document.getElementById('appScreen');
const authForm = document.getElementById('authForm');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const authErrorEl = document.getElementById('authError');
const authTitleEl = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleBtn = document.getElementById('authToggleBtn');
const authToggleTextEl = document.getElementById('authToggleText');
const userEmailLabelEl = document.getElementById('userEmailLabel');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const capsLockWarningEl = document.getElementById('capsLockWarning');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const forgotPasswordRow = document.getElementById('forgotPasswordRow');
const authInfoEl = document.getElementById('authInfo');

togglePasswordBtn.addEventListener('click', () => {
  const showing = authPasswordInput.type === 'text';
  authPasswordInput.type = showing ? 'password' : 'text';
  togglePasswordBtn.textContent = showing ? '👁️' : '🙈';
  togglePasswordBtn.title = showing ? 'Pokaż hasło' : 'Ukryj hasło';
  togglePasswordBtn.setAttribute('aria-label', togglePasswordBtn.title);
});

function checkCapsLock(e) {
  const isOn = e.getModifierState && e.getModifierState('CapsLock');
  capsLockWarningEl.classList.toggle('hidden', !isOn);
}
authPasswordInput.addEventListener('keydown', checkCapsLock);
authPasswordInput.addEventListener('keyup', checkCapsLock);
authPasswordInput.addEventListener('blur', () => capsLockWarningEl.classList.add('hidden'));

let authMode = 'login';

const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Ten adres e-mail jest już zarejestrowany.',
  'auth/invalid-email': 'Nieprawidłowy adres e-mail.',
  'auth/weak-password': 'Hasło musi mieć co najmniej 6 znaków.',
  'auth/user-not-found': 'Nie znaleziono konta o tym adresie e-mail.',
  'auth/wrong-password': 'Błędne hasło.',
  'auth/invalid-credential': 'Błędny e-mail lub hasło.',
  'auth/too-many-requests': 'Zbyt wiele prób. Spróbuj ponownie za chwilę.',
};

function authErrorMessage(err) {
  return AUTH_ERROR_MESSAGES[err.code] || 'Wystąpił błąd. Spróbuj ponownie.';
}

authToggleBtn.addEventListener('click', () => {
  authMode = authMode === 'login' ? 'signup' : 'login';
  authErrorEl.textContent = '';
  authInfoEl.classList.add('hidden');
  if (authMode === 'signup') {
    authTitleEl.textContent = 'Załóż nowe konto';
    authSubmitBtn.textContent = 'Zarejestruj się';
    authToggleTextEl.textContent = 'Masz już konto?';
    authToggleBtn.textContent = 'Zaloguj się';
    authPasswordInput.autocomplete = 'new-password';
    forgotPasswordRow.classList.add('hidden');
  } else {
    authTitleEl.textContent = 'Zaloguj się do swojego konta';
    authSubmitBtn.textContent = 'Zaloguj się';
    authToggleTextEl.textContent = 'Nie masz konta?';
    authToggleBtn.textContent = 'Zarejestruj się';
    authPasswordInput.autocomplete = 'current-password';
    forgotPasswordRow.classList.remove('hidden');
  }
});

forgotPasswordBtn.addEventListener('click', async () => {
  authErrorEl.textContent = '';
  authInfoEl.classList.add('hidden');
  const email = authEmailInput.value.trim();
  if (!email) {
    authErrorEl.textContent = 'Wpisz najpierw swój adres e-mail powyżej.';
    return;
  }
  forgotPasswordBtn.disabled = true;
  let invalidEmail = false;
  try {
    await auth.sendPasswordResetEmail(email);
  } catch (err) {
    // Celowo NIE rozroznamy "nie ma takiego konta" od sukcesu - inaczej ktos
    // mógłby sprawdzac, które adresy e-mail maja tu konto (account enumeration).
    if (err.code === 'auth/invalid-email') {
      invalidEmail = true;
    } else if (err.code !== 'auth/user-not-found') {
      console.error('Błąd resetu hasła:', err);
    }
  } finally {
    forgotPasswordBtn.disabled = false;
  }
  if (invalidEmail) {
    authErrorEl.textContent = 'Nieprawidłowy adres e-mail.';
    return;
  }
  authInfoEl.textContent = 'Jeśli konto o tym adresie istnieje, wysłaliśmy e-mail z linkiem do resetu hasła.';
  authInfoEl.classList.remove('hidden');
});

const REMEMBERED_EMAIL_KEY = 'asystent-finansow-remembered-email';
const rememberEmailInput = document.getElementById('rememberEmail');

function applyRememberedEmail() {
  const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
  if (rememberedEmail) {
    authEmailInput.value = rememberedEmail;
    rememberEmailInput.checked = true;
  }
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErrorEl.textContent = '';
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;
  authSubmitBtn.disabled = true;
  try {
    if (authMode === 'signup') {
      await auth.createUserWithEmailAndPassword(email, password);
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
    if (rememberEmailInput.checked) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  } catch (err) {
    authErrorEl.textContent = authErrorMessage(err);
  } finally {
    authSubmitBtn.disabled = false;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  auth.signOut();
});

let unsubscribeDataListener = null;

auth.onAuthStateChanged((user) => {
  if (unsubscribeDataListener) {
    unsubscribeDataListener();
    unsubscribeDataListener = null;
  }

  if (!user) {
    currentUser = null;
    appScreenEl.classList.add('hidden');
    authScreenEl.classList.remove('hidden');
    authForm.reset();
    authPasswordInput.type = 'password';
    togglePasswordBtn.textContent = '👁️';
    capsLockWarningEl.classList.add('hidden');
    applyRememberedEmail();
    return;
  }

  currentUser = user;
  userEmailLabelEl.textContent = user.email;
  currentMonth = todayKey();
  authScreenEl.classList.add('hidden');
  appScreenEl.classList.remove('hidden');

  // Nasluchujemy na zywo, zeby zmiany z innego urzadzenia (np. telefonu)
  // od razu pojawialy sie tutaj, zamiast zostac nadpisane przez stare dane w pamieci.
  unsubscribeDataListener = db.collection('users').doc(user.uid).onSnapshot((snap) => {
    data = snap.exists ? snap.data() : {};
    data._categoryIcons = data._categoryIcons || {};
    data._categoryColors = data._categoryColors || {};
    data._categories = data._categories || [...DEFAULT_CATEGORIES];
    data._fixedPayments = data._fixedPayments || [];
    data._categoryBudgets = data._categoryBudgets || {};
    render();
  }, (err) => {
    console.error('Błąd synchronizacji danych:', err);
  });
});

document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth = shiftMonth(currentMonth, -1);
  render();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth = shiftMonth(currentMonth, 1);
  render();
});

document.getElementById('saveIncomeBtn').addEventListener('click', () => {
  const val = parseFloat(incomeInput.value);
  const month = getMonthData(currentMonth);
  month.income = isNaN(val) ? 0 : val;
  saveData();
  render();
});

expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('expAmount').value);
  const category = normalizeCategoryName(document.getElementById('expCategory').value.trim() || 'Inne');
  const desc = document.getElementById('expDesc').value.trim();
  const date = document.getElementById('expDate').value;
  if (isNaN(amount) || amount <= 0 || !date) return;

  rememberCategory(category);
  getCategoryIcon(category);
  getCategoryColor(category);

  const month = getMonthData(currentMonth);
  month.expenses.push({ id: Date.now(), amount, category, desc, date });
  saveData();

  document.getElementById('expAmount').value = '';
  document.getElementById('expCategory').value = '';
  document.getElementById('expDesc').value = '';
  render();
});

document.getElementById('exportBtn').addEventListener('click', exportExcelReport);

function deleteExpense(id) {
  const month = getMonthData(currentMonth);
  month.expenses = month.expenses.filter(e => e.id !== id);
  saveData();
  render();
}

function startEditExpense(id) {
  editingExpenseId = id;
  render();
}

function cancelEditExpense() {
  editingExpenseId = null;
  render();
}

function saveEditExpense(id, amount, categoryRaw, desc, date) {
  const month = getMonthData(currentMonth);
  const exp = month.expenses.find(e => e.id === id);
  if (!exp || isNaN(amount) || amount <= 0 || !date) return;
  const category = normalizeCategoryName(categoryRaw.trim() || 'Inne');
  rememberCategory(category);
  getCategoryIcon(category);
  getCategoryColor(category);
  exp.amount = amount;
  exp.category = category;
  exp.desc = desc.trim();
  exp.date = date;
  editingExpenseId = null;
  saveData();
  render();
}

extraIncomeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = extraTitleInput.value.trim();
  const amount = parseFloat(extraAmountInput.value);
  const date = extraDateInput.value;
  if (!title || isNaN(amount) || amount <= 0 || !date) return;

  const month = getMonthData(currentMonth);
  month.extraIncome.push({ id: Date.now(), title, amount, date });
  saveData();

  extraTitleInput.value = '';
  extraAmountInput.value = '';
  extraDateInput.value = '';
  render();
});

function deleteExtraIncome(id) {
  const month = getMonthData(currentMonth);
  month.extraIncome = month.extraIncome.filter(x => x.id !== id);
  saveData();
  render();
}

function startEditExtra(id) {
  editingExtraId = id;
  render();
}

function cancelEditExtra() {
  editingExtraId = null;
  render();
}

function saveEditExtra(id, title, amount, date) {
  const month = getMonthData(currentMonth);
  const item = month.extraIncome.find(x => x.id === id);
  if (!item || !title.trim() || isNaN(amount) || amount <= 0 || !date) return;
  item.title = title.trim();
  item.amount = amount;
  item.date = date;
  editingExtraId = null;
  saveData();
  render();
}

function renderExtraIncomeList() {
  const month = getMonthData(currentMonth);
  const items = [...month.extraIncome].sort((a, b) => b.date.localeCompare(a.date));
  extraIncomeListEl.innerHTML = '';
  extraIncomeEmptyStateEl.style.display = items.length ? 'none' : 'block';
  for (const item of items) {
    const el = document.createElement('div');
    el.className = 'fixed-item';
    if (item.id === editingExtraId) {
      el.innerHTML = `
        <div class="inline-edit-form">
          <input type="text" class="edit-input" value="${item.title}">
          <input type="number" step="0.01" min="0.01" class="edit-input" value="${item.amount}">
          <input type="date" class="edit-input" value="${item.date}">
          <div class="edit-actions">
            <button class="save-edit-btn" title="Zapisz">✓ Zapisz</button>
            <button class="cancel-edit-btn" title="Anuluj">Anuluj</button>
          </div>
        </div>
      `;
      const inputs = el.querySelectorAll('.edit-input');
      el.querySelector('.save-edit-btn').addEventListener('click', () => {
        saveEditExtra(item.id, inputs[0].value, parseFloat(inputs[1].value), inputs[2].value);
      });
      el.querySelector('.cancel-edit-btn').addEventListener('click', cancelEditExtra);
    } else {
      el.innerHTML = `
        <div class="fixed-item-main">
          <span class="fixed-item-title">${item.title}</span>
          <span class="fixed-item-meta">${item.date}</span>
        </div>
        <span class="fixed-item-amount positive">+${formatMoney(item.amount)}</span>
        <div class="edit-actions">
          <button class="edit-btn" title="Edytuj">✎</button>
          <button class="delete-btn" title="Usuń">✕</button>
        </div>
      `;
      el.querySelector('.edit-btn').addEventListener('click', () => startEditExtra(item.id));
      el.querySelector('.delete-btn').addEventListener('click', () => deleteExtraIncome(item.id));
    }
    extraIncomeListEl.appendChild(el);
  }
}

fixedForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = fixedTitleInput.value.trim();
  const amount = parseFloat(fixedAmountInput.value);
  const date = fixedDateInput.value;
  const standingOrder = fixedStandingOrderInput.checked;
  if (!title || isNaN(amount) || amount <= 0 || !date) return;

  data._fixedPayments.push({ id: Date.now(), title, amount, date, standingOrder });
  saveData();

  fixedTitleInput.value = '';
  fixedAmountInput.value = '';
  fixedDateInput.value = '';
  fixedStandingOrderInput.checked = false;
  render();
});

function deleteFixedPayment(id) {
  data._fixedPayments = data._fixedPayments.filter(p => p.id !== id);
  saveData();
  render();
}

function toggleStandingOrder(id) {
  const payment = data._fixedPayments.find(p => p.id === id);
  if (!payment) return;
  payment.standingOrder = !payment.standingOrder;
  saveData();
  render();
}

function startEditFixed(id) {
  editingFixedId = id;
  render();
}

function cancelEditFixed() {
  editingFixedId = null;
  render();
}

function saveEditFixed(id, title, amount, date, standingOrder) {
  const payment = data._fixedPayments.find(p => p.id === id);
  if (!payment || !title.trim() || isNaN(amount) || amount <= 0 || !date) return;
  payment.title = title.trim();
  payment.amount = amount;
  payment.date = date;
  payment.standingOrder = standingOrder;
  editingFixedId = null;
  saveData();
  render();
}

function daysUntilNextOccurrence(dayOfMonth) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let target = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (target < today) {
    target = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
  }
  return Math.round((target - today) / 86400000);
}

function renderUpcomingBanner() {
  const upcoming = data._fixedPayments
    .map(p => ({ p, days: daysUntilNextOccurrence(parseInt(p.date.split('-')[2], 10)) }))
    .filter(x => x.days >= 0 && x.days <= 3)
    .sort((a, b) => a.days - b.days);

  if (!upcoming.length) {
    upcomingBannerEl.classList.add('hidden');
    upcomingBannerEl.textContent = '';
    return;
  }

  const parts = upcoming.map(({ p, days }) => {
    const when = days === 0 ? 'dziś' : days === 1 ? 'jutro' : `za ${days} dni`;
    return `${p.title} (${when}, ${formatMoney(p.amount)})`;
  });
  upcomingBannerEl.textContent = `⏰ Zbliżają się: ${parts.join(', ')}`;
  upcomingBannerEl.classList.remove('hidden');
}

function renderFixedList() {
  const payments = [...data._fixedPayments].sort((a, b) => a.date.localeCompare(b.date));
  fixedListEl.innerHTML = '';
  fixedEmptyStateEl.style.display = payments.length ? 'none' : 'block';
  for (const p of payments) {
    const item = document.createElement('div');
    item.className = 'fixed-item';
    if (p.id === editingFixedId) {
      item.innerHTML = `
        <div class="inline-edit-form">
          <input type="text" class="edit-input" value="${p.title}">
          <input type="number" step="0.01" min="0.01" class="edit-input" value="${p.amount}">
          <input type="date" class="edit-input" value="${p.date}">
          <label class="checkbox-row"><input type="checkbox" ${p.standingOrder ? 'checked' : ''}> Stałe zlecenie w banku</label>
          <div class="edit-actions">
            <button class="save-edit-btn" title="Zapisz">✓ Zapisz</button>
            <button class="cancel-edit-btn" title="Anuluj">Anuluj</button>
          </div>
        </div>
      `;
      const inputs = item.querySelectorAll('.edit-input');
      const checkbox = item.querySelector('input[type="checkbox"]');
      item.querySelector('.save-edit-btn').addEventListener('click', () => {
        saveEditFixed(p.id, inputs[0].value, parseFloat(inputs[1].value), inputs[2].value, checkbox.checked);
      });
      item.querySelector('.cancel-edit-btn').addEventListener('click', cancelEditFixed);
    } else {
      item.innerHTML = `
        <div class="fixed-item-main">
          <span class="fixed-item-title">${p.title}</span>
          <span class="fixed-item-meta">${p.date}</span>
          <button type="button" class="standing-order-toggle${p.standingOrder ? ' active' : ''}">${p.standingOrder ? '✓ zlecenie stałe' : 'oznacz jako zlecenie stałe'}</button>
        </div>
        <span class="fixed-item-amount">${formatMoney(p.amount)}</span>
        <div class="edit-actions">
          <button class="edit-btn" title="Edytuj">✎</button>
          <button class="delete-btn" title="Usuń">✕</button>
        </div>
      `;
      item.querySelector('.standing-order-toggle').addEventListener('click', () => toggleStandingOrder(p.id));
      item.querySelector('.edit-btn').addEventListener('click', () => startEditFixed(p.id));
      item.querySelector('.delete-btn').addEventListener('click', () => deleteFixedPayment(p.id));
    }
    fixedListEl.appendChild(item);
  }
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function renderPieChart() {
  const month = getMonthData(currentMonth);
  const catSlices = groupByCategory(month.expenses).map(g => ({
    label: g.label, amount: g.total, color: getCategoryColor(g.label)
  }));
  const fixedSlices = data._fixedPayments.map(p => ({
    label: p.title, amount: p.amount, color: getCategoryColor(p.title)
  }));
  const slices = [...catSlices, ...fixedSlices].sort((a, b) => b.amount - a.amount);
  const total = slices.reduce((s, x) => s + x.amount, 0);

  pieChartEl.innerHTML = '';
  pieLegendEl.innerHTML = '';
  pieEmptyStateEl.style.display = slices.length ? 'none' : 'block';
  if (!slices.length) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const cx = 100, cy = 100, r = 90;
  let angle = 0;
  for (const slice of slices) {
    const sliceAngle = (slice.amount / total) * 360;
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', describeArc(cx, cy, r, angle, angle + Math.max(sliceAngle, 0.01)));
    path.setAttribute('fill', slice.color);
    const titleEl = document.createElementNS(svgNS, 'title');
    titleEl.textContent = `${slice.label}: ${formatMoney(slice.amount)}`;
    path.appendChild(titleEl);
    pieChartEl.appendChild(path);
    angle += sliceAngle;
  }

  const hole = document.createElementNS(svgNS, 'circle');
  hole.setAttribute('cx', cx);
  hole.setAttribute('cy', cy);
  hole.setAttribute('r', 45);
  hole.setAttribute('class', 'pie-donut-hole');
  pieChartEl.appendChild(hole);

  const centerText = document.createElementNS(svgNS, 'text');
  centerText.setAttribute('x', cx);
  centerText.setAttribute('y', cy);
  centerText.setAttribute('text-anchor', 'middle');
  centerText.setAttribute('dominant-baseline', 'middle');
  centerText.setAttribute('class', 'pie-center-label');
  centerText.textContent = formatMoney(total);
  pieChartEl.appendChild(centerText);

  for (const slice of slices) {
    const pct = total > 0 ? Math.round((slice.amount / total) * 100) : 0;
    const item = document.createElement('div');
    item.className = 'pie-legend-item';
    item.innerHTML = `
      <span class="pie-legend-swatch" style="background:${slice.color}"></span>
      <span class="pie-legend-label">${slice.label}</span>
      <span class="pie-legend-value">${formatMoney(slice.amount)} (${pct}%)</span>
    `;
    pieLegendEl.appendChild(item);
  }
}

function getRecentMonthKeys(count) {
  return Object.keys(data)
    .filter(k => /^\d{4}-\d{2}$/.test(k))
    .sort()
    .slice(-count);
}

function renderTrendChart() {
  const keys = getRecentMonthKeys(6);
  trendChartEl.innerHTML = '';
  trendEmptyStateEl.style.display = keys.length ? 'none' : 'block';
  if (!keys.length) return;

  const points = keys.map(key => {
    const m = getMonthData(key);
    const exp = m.expenses.reduce((s, e) => s + e.amount, 0);
    const inc = (m.income || 0) + m.extraIncome.reduce((s, x) => s + x.amount, 0);
    return { key, exp, inc };
  });

  const width = 320, height = 170, bottomPadding = 22, topPadding = 8;
  const chartHeight = height - bottomPadding - topPadding;
  const maxVal = Math.max(1, ...points.map(p => Math.max(p.exp, p.inc)));
  const groupWidth = width / points.length;
  const barWidth = Math.min(20, groupWidth / 3);

  const svgNS = 'http://www.w3.org/2000/svg';
  points.forEach((p, i) => {
    const groupCenter = groupWidth * i + groupWidth / 2;
    const incX = groupCenter - barWidth - 2;
    const expX = groupCenter + 2;

    const incH = (p.inc / maxVal) * chartHeight;
    const incRect = document.createElementNS(svgNS, 'rect');
    incRect.setAttribute('x', incX);
    incRect.setAttribute('y', topPadding + (chartHeight - incH));
    incRect.setAttribute('width', barWidth);
    incRect.setAttribute('height', Math.max(incH, 1));
    incRect.setAttribute('rx', 2);
    incRect.setAttribute('class', 'trend-bar-income');
    const incTitle = document.createElementNS(svgNS, 'title');
    incTitle.textContent = `Przychody: ${formatMoney(p.inc)}`;
    incRect.appendChild(incTitle);
    trendChartEl.appendChild(incRect);

    const expH = (p.exp / maxVal) * chartHeight;
    const expRect = document.createElementNS(svgNS, 'rect');
    expRect.setAttribute('x', expX);
    expRect.setAttribute('y', topPadding + (chartHeight - expH));
    expRect.setAttribute('width', barWidth);
    expRect.setAttribute('height', Math.max(expH, 1));
    expRect.setAttribute('rx', 2);
    expRect.setAttribute('class', 'trend-bar-expense');
    const expTitle = document.createElementNS(svgNS, 'title');
    expTitle.textContent = `Wydatki: ${formatMoney(p.exp)}`;
    expRect.appendChild(expTitle);
    trendChartEl.appendChild(expRect);

    const [, m] = p.key.split('-').map(Number);
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', groupCenter);
    label.setAttribute('y', height - 6);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'trend-label');
    label.textContent = MONTH_NAMES[m - 1].slice(0, 3);
    trendChartEl.appendChild(label);
  });
}

const categoryListEl = document.getElementById('categoryList');

function renderCategoryDatalist() {
  categoryListEl.innerHTML = data._categories
    .map(cat => `<option value="${cat}">`)
    .join('');
}

function render() {
  monthLabelEl.textContent = monthLabel(currentMonth);
  renderCategoryDatalist();
  expDateInput.value = expDateInput.value || `${currentMonth}-${new Date().getDate() < 10 ? '0' + new Date().getDate() : new Date().getDate()}`;

  const month = getMonthData(currentMonth);
  incomeInput.value = month.income || '';

  const totalExpenses = month.expenses.reduce((s, e) => s + e.amount, 0);
  const totalFixed = data._fixedPayments.reduce((s, p) => s + p.amount, 0);
  const totalExtraIncome = month.extraIncome.reduce((s, x) => s + x.amount, 0);
  const totalOut = totalExpenses + totalFixed;
  const totalIn = (month.income || 0) + totalExtraIncome;
  const remaining = totalIn - totalOut;

  sumIncomeEl.textContent = formatMoney(totalIn);
  sumExpensesEl.textContent = formatMoney(totalOut);
  sumRemainingEl.textContent = formatMoney(remaining);
  sumRemainingEl.classList.toggle('negative', remaining < 0);

  const pct = totalIn > 0 ? Math.min(100, (totalOut / totalIn) * 100) : 0;
  progressFillEl.style.width = pct + '%';
  progressFillEl.classList.toggle('over', remaining < 0);

  renderUpcomingBanner();
  renderFixedList();
  renderExtraIncomeList();
  renderPieChart();
  renderTrendChart();

  // table
  const query = expenseSearchQuery.trim().toLowerCase();
  const filtered = query
    ? month.expenses.filter(e => e.category.toLowerCase().includes(query) || (e.desc || '').toLowerCase().includes(query))
    : month.expenses;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  expenseTableBody.innerHTML = '';
  emptyStateEl.style.display = sorted.length ? 'none' : 'block';
  emptyStateEl.textContent = query && !sorted.length ? 'Brak wydatków pasujących do wyszukiwania.' : 'Brak wydatków w tym miesiącu.';
  for (const exp of sorted) {
    const tr = document.createElement('tr');
    if (exp.id === editingExpenseId) {
      tr.innerHTML = `
        <td><input type="date" class="edit-input" value="${exp.date}"></td>
        <td><input type="text" class="edit-input" value="${exp.category}" list="categoryList"></td>
        <td><input type="text" class="edit-input" value="${exp.desc || ''}"></td>
        <td><input type="number" step="0.01" min="0.01" class="edit-input edit-input-amount" value="${exp.amount}"></td>
        <td class="edit-actions">
          <button class="save-edit-btn" title="Zapisz">✓</button>
          <button class="cancel-edit-btn" title="Anuluj">✕</button>
        </td>
      `;
      const dateInput = tr.querySelector('input[type="date"]');
      const categoryInput = tr.querySelector('input[type="text"]');
      const descInput = tr.querySelectorAll('input[type="text"]')[1];
      const amountInput = tr.querySelector('.edit-input-amount');
      tr.querySelector('.save-edit-btn').addEventListener('click', () => {
        saveEditExpense(exp.id, parseFloat(amountInput.value), categoryInput.value, descInput.value, dateInput.value);
      });
      tr.querySelector('.cancel-edit-btn').addEventListener('click', cancelEditExpense);
    } else {
      tr.innerHTML = `
        <td>${exp.date}</td>
        <td>${getCategoryIcon(exp.category)} ${exp.category}</td>
        <td>${exp.desc || '—'}</td>
        <td>${formatMoney(exp.amount)}</td>
        <td class="edit-actions">
          <button class="edit-btn" title="Edytuj">✎</button>
          <button class="delete-btn" title="Usuń">✕</button>
        </td>
      `;
      tr.querySelector('.edit-btn').addEventListener('click', () => startEditExpense(exp.id));
      tr.querySelector('.delete-btn').addEventListener('click', () => deleteExpense(exp.id));
    }
    expenseTableBody.appendChild(tr);
  }

  // category breakdown
  const grouped = groupByCategory(month.expenses);
  categoryChartEl.innerHTML = '';
  const maxVal = Math.max(1, ...grouped.map(g => g.total));
  if (!grouped.length) {
    categoryChartEl.innerHTML = '<p class="empty-state">Brak danych do pokazania.</p>';
  } else {
    for (const { label, total } of grouped) {
      const pct = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
      const budget = data._categoryBudgets[label];
      const overBudget = budget && total > budget;
      const row = document.createElement('div');
      row.className = 'category-row';
      if (label === editingBudgetCategory) {
        row.innerHTML = `
          <span class="category-name">${getCategoryIcon(label)} ${label}</span>
          <span class="budget-edit-row">
            <input type="number" step="1" min="0" class="edit-input budget-input" placeholder="Limit zł" value="${budget || ''}">
            <button class="save-edit-btn" title="Zapisz">✓</button>
            <button class="cancel-edit-btn" title="Anuluj">✕</button>
          </span>
        `;
        const budgetInput = row.querySelector('.budget-input');
        row.querySelector('.save-edit-btn').addEventListener('click', () => saveBudget(label, budgetInput.value));
        row.querySelector('.cancel-edit-btn').addEventListener('click', () => { editingBudgetCategory = null; render(); });
      } else {
        row.innerHTML = `
          <span class="category-name">
            ${getCategoryIcon(label)} ${label}
            ${overBudget ? `<span class="budget-warning" title="Przekroczono limit ${formatMoney(budget)}">⚠️</span>` : ''}
            <button type="button" class="budget-btn" title="${budget ? 'Zmień limit' : 'Ustaw limit'}">🎯${budget ? ` ${formatMoney(budget)}` : ''}</button>
          </span>
          <span class="category-bar-bg"><span class="category-bar-fill" style="width:${(total / maxVal) * 100}%;background:${overBudget ? 'var(--danger)' : getCategoryColor(label)}"></span></span>
          <span class="category-amount">${formatMoney(total)}<span class="category-percent">(${pct}%)</span></span>
        `;
        row.querySelector('.budget-btn').addEventListener('click', () => { editingBudgetCategory = label; render(); });
      }
      categoryChartEl.appendChild(row);
    }
  }
}

function saveBudget(category, rawValue) {
  const value = parseFloat(rawValue);
  if (rawValue === '' || isNaN(value) || value <= 0) {
    delete data._categoryBudgets[category];
  } else {
    data._categoryBudgets[category] = value;
  }
  editingBudgetCategory = null;
  saveData();
  render();
}

function exportExcelReport() {
  const month = getMonthData(currentMonth);
  const totalExpenses = month.expenses.reduce((s, e) => s + e.amount, 0);
  const totalFixed = data._fixedPayments.reduce((s, p) => s + p.amount, 0);
  const totalExtraIncome = month.extraIncome.reduce((s, x) => s + x.amount, 0);
  const totalOut = totalExpenses + totalFixed;
  const totalIn = (month.income || 0) + totalExtraIncome;
  const remaining = totalIn - totalOut;

  const grouped = groupByCategory(month.expenses);

  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ['Raport finansowy', monthLabel(currentMonth)],
    [],
    ['Wypłata', round2(month.income || 0)],
    ['Dodatkowe wpływy', round2(totalExtraIncome)],
    ['Suma przychodów', round2(totalIn)],
    ['Wydatki jednorazowe', round2(totalExpenses)],
    ['Stałe opłaty', round2(totalFixed)],
    ['Suma wydatków', round2(totalOut)],
    ['Pozostało', round2(remaining)],
    ['% przychodów wydane', totalIn > 0 ? ((totalOut / totalIn) * 100).toFixed(1) + '%' : 'n/d'],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [{ wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Podsumowanie');

  const categoryRows = [['Kategoria', 'Suma', '% wydatków']];
  for (const { label, total } of grouped) {
    categoryRows.push([`${getCategoryIcon(label)} ${label}`, round2(total), totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(1) + '%' : '0%']);
  }
  const categoryWs = XLSX.utils.aoa_to_sheet(categoryRows);
  categoryWs['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, categoryWs, 'Wg kategorii');

  const expenseRows = [['Data', 'Kategoria', 'Opis', 'Kwota']];
  const sortedExpenses = [...month.expenses].sort((a, b) => a.date.localeCompare(b.date));
  for (const exp of sortedExpenses) {
    expenseRows.push([exp.date, `${getCategoryIcon(exp.category)} ${exp.category}`, exp.desc || '', round2(exp.amount)]);
  }
  const expenseWs = XLSX.utils.aoa_to_sheet(expenseRows);
  expenseWs['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, expenseWs, 'Wydatki');

  const extraRows = [['Źródło', 'Kwota', 'Data']];
  const sortedExtra = [...month.extraIncome].sort((a, b) => a.date.localeCompare(b.date));
  for (const x of sortedExtra) {
    extraRows.push([x.title, round2(x.amount), x.date]);
  }
  const extraWs = XLSX.utils.aoa_to_sheet(extraRows);
  extraWs['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, extraWs, 'Dodatkowe wpływy');

  const fixedRows = [['Tytuł', 'Kwota', 'Data pobrania', 'Stałe zlecenie']];
  const sortedFixed = [...data._fixedPayments].sort((a, b) => a.date.localeCompare(b.date));
  for (const p of sortedFixed) {
    fixedRows.push([p.title, round2(p.amount), p.date, p.standingOrder ? 'Tak' : 'Nie']);
  }
  const fixedWs = XLSX.utils.aoa_to_sheet(fixedRows);
  fixedWs['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, fixedWs, 'Stałe opłaty');

  XLSX.writeFile(wb, `raport-finansowy-${currentMonth}.xlsx`);
}
