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

function rememberCategory(name) {
  if (!data._categories.includes(name)) {
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
    return;
  }
  currentUser = user;
  userEmailLabelEl.textContent = user.email;
  data = await loadData(user.uid);
  data._categoryIcons = data._categoryIcons || {};
  data._categoryColors = data._categoryColors || {};
  data._categories = data._categories || [...DEFAULT_CATEGORIES];
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
  const category = document.getElementById('expCategory').value.trim() || 'Inne';
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
  const remaining = (month.income || 0) - totalExpenses;

  sumIncomeEl.textContent = formatMoney(month.income || 0);
  sumExpensesEl.textContent = formatMoney(totalExpenses);
  sumRemainingEl.textContent = formatMoney(remaining);
  sumRemainingEl.classList.toggle('negative', remaining < 0);

  const pct = month.income > 0 ? Math.min(100, (totalExpenses / month.income) * 100) : 0;
  progressFillEl.style.width = pct + '%';
  progressFillEl.classList.toggle('over', remaining < 0);

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
  const byCategory = {};
  for (const exp of month.expenses) {
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
  }
  categoryChartEl.innerHTML = '';
  const maxVal = Math.max(1, ...Object.values(byCategory));
  const categories = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a]);
  if (!categories.length) {
    categoryChartEl.innerHTML = '<p class="empty-state">Brak danych do pokazania.</p>';
  } else {
    for (const cat of categories) {
      const val = byCategory[cat];
      const row = document.createElement('div');
      row.className = 'category-row';
      row.innerHTML = `
        <span>${getCategoryIcon(cat)} ${cat}</span>
        <span class="category-bar-bg"><span class="category-bar-fill" style="width:${(val / maxVal) * 100}%;background:${getCategoryColor(cat)}"></span></span>
        <span>${formatMoney(val)}</span>
      `;
      categoryChartEl.appendChild(row);
    }
  }
}

function exportExcelReport() {
  const month = getMonthData(currentMonth);
  const totalExpenses = month.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = (month.income || 0) - totalExpenses;

  const byCategory = {};
  for (const exp of month.expenses) {
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
  }

  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ['Raport finansowy', monthLabel(currentMonth)],
    [],
    ['Wypłata', round2(month.income || 0)],
    ['Suma wydatków', round2(totalExpenses)],
    ['Pozostało', round2(remaining)],
    ['% wypłaty wydane', month.income > 0 ? ((totalExpenses / month.income) * 100).toFixed(1) + '%' : 'n/d'],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [{ wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Podsumowanie');

  const categoryRows = [['Kategoria', 'Suma', '% wydatków']];
  const catSorted = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a]);
  for (const cat of catSorted) {
    categoryRows.push([`${getCategoryIcon(cat)} ${cat}`, round2(byCategory[cat]), totalExpenses > 0 ? ((byCategory[cat] / totalExpenses) * 100).toFixed(1) + '%' : '0%']);
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

  XLSX.writeFile(wb, `raport-finansowy-${currentMonth}.xlsx`);
}
