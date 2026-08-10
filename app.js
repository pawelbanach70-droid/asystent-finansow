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

async function loadData(uid) {
  try {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : {};
  } catch (e) {
    console.error('Błąd wczytywania danych:', e);
    return {};
  }
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
const emptyStateEl = document.getElementById('emptyState');
const categoryChartEl = document.getElementById('categoryChart');
const expDateInput = document.getElementById('expDate');

const fixedForm = document.getElementById('fixedForm');
const fixedTitleInput = document.getElementById('fixedTitle');
const fixedAmountInput = document.getElementById('fixedAmount');
const fixedDateInput = document.getElementById('fixedDate');
const fixedStandingOrderInput = document.getElementById('fixedStandingOrder');
const fixedListEl = document.getElementById('fixedList');
const fixedEmptyStateEl = document.getElementById('fixedEmptyState');

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
  if (authMode === 'signup') {
    authTitleEl.textContent = 'Załóż nowe konto';
    authSubmitBtn.textContent = 'Zarejestruj się';
    authToggleTextEl.textContent = 'Masz już konto?';
    authToggleBtn.textContent = 'Zaloguj się';
  } else {
    authTitleEl.textContent = 'Zaloguj się do swojego konta';
    authSubmitBtn.textContent = 'Zaloguj się';
    authToggleTextEl.textContent = 'Nie masz konta?';
    authToggleBtn.textContent = 'Zarejestruj się';
  }
});

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
  } catch (err) {
    authErrorEl.textContent = authErrorMessage(err);
  } finally {
    authSubmitBtn.disabled = false;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  auth.signOut();
});

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    currentUser = null;
    appScreenEl.classList.add('hidden');
    authScreenEl.classList.remove('hidden');
    authForm.reset();
    authPasswordInput.type = 'password';
    togglePasswordBtn.textContent = '👁️';
    capsLockWarningEl.classList.add('hidden');
    return;
  }
  currentUser = user;
  userEmailLabelEl.textContent = user.email;
  data = await loadData(user.uid);
  data._categoryIcons = data._categoryIcons || {};
  data._categoryColors = data._categoryColors || {};
  data._categories = data._categories || [...DEFAULT_CATEGORIES];
  data._fixedPayments = data._fixedPayments || [];
  currentMonth = todayKey();
  authScreenEl.classList.add('hidden');
  appScreenEl.classList.remove('hidden');
  render();
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

function renderFixedList() {
  const payments = [...data._fixedPayments].sort((a, b) => a.date.localeCompare(b.date));
  fixedListEl.innerHTML = '';
  fixedEmptyStateEl.style.display = payments.length ? 'none' : 'block';
  for (const p of payments) {
    const item = document.createElement('div');
    item.className = 'fixed-item';
    item.innerHTML = `
      <div class="fixed-item-main">
        <span class="fixed-item-title">${p.title}${p.standingOrder ? '<span class="standing-order-badge">zlecenie stałe</span>' : ''}</span>
        <span class="fixed-item-meta">${p.date}</span>
      </div>
      <span class="fixed-item-amount">${formatMoney(p.amount)}</span>
      <button class="delete-btn" title="Usuń">✕</button>
    `;
    item.querySelector('.delete-btn').addEventListener('click', () => deleteFixedPayment(p.id));
    fixedListEl.appendChild(item);
  }
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
  const totalOut = totalExpenses + totalFixed;
  const remaining = (month.income || 0) - totalOut;

  sumIncomeEl.textContent = formatMoney(month.income || 0);
  sumExpensesEl.textContent = formatMoney(totalOut);
  sumRemainingEl.textContent = formatMoney(remaining);
  sumRemainingEl.classList.toggle('negative', remaining < 0);

  const pct = month.income > 0 ? Math.min(100, (totalOut / month.income) * 100) : 0;
  progressFillEl.style.width = pct + '%';
  progressFillEl.classList.toggle('over', remaining < 0);

  renderFixedList();

  // table
  const sorted = [...month.expenses].sort((a, b) => b.date.localeCompare(a.date));
  expenseTableBody.innerHTML = '';
  emptyStateEl.style.display = sorted.length ? 'none' : 'block';
  for (const exp of sorted) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${exp.date}</td>
      <td>${getCategoryIcon(exp.category)} ${exp.category}</td>
      <td>${exp.desc || '—'}</td>
      <td>${formatMoney(exp.amount)}</td>
      <td><button class="delete-btn" title="Usuń">✕</button></td>
    `;
    tr.querySelector('.delete-btn').addEventListener('click', () => deleteExpense(exp.id));
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
      const row = document.createElement('div');
      row.className = 'category-row';
      row.innerHTML = `
        <span class="category-name">${getCategoryIcon(label)} ${label}</span>
        <span class="category-bar-bg"><span class="category-bar-fill" style="width:${(total / maxVal) * 100}%;background:${getCategoryColor(label)}"></span></span>
        <span class="category-amount">${formatMoney(total)}<span class="category-percent">(${pct}%)</span></span>
      `;
      categoryChartEl.appendChild(row);
    }
  }
}

function exportExcelReport() {
  const month = getMonthData(currentMonth);
  const totalExpenses = month.expenses.reduce((s, e) => s + e.amount, 0);
  const totalFixed = data._fixedPayments.reduce((s, p) => s + p.amount, 0);
  const totalOut = totalExpenses + totalFixed;
  const remaining = (month.income || 0) - totalOut;

  const grouped = groupByCategory(month.expenses);

  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ['Raport finansowy', monthLabel(currentMonth)],
    [],
    ['Wypłata', round2(month.income || 0)],
    ['Wydatki jednorazowe', round2(totalExpenses)],
    ['Stałe opłaty', round2(totalFixed)],
    ['Suma wydatków', round2(totalOut)],
    ['Pozostało', round2(remaining)],
    ['% wypłaty wydane', month.income > 0 ? ((totalOut / month.income) * 100).toFixed(1) + '%' : 'n/d'],
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
