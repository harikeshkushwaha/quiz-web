// --- Auth Modal Logic ---
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const closeModal = document.getElementById('close-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const homeSection = document.getElementById('home-section');
const quizSetup = document.getElementById('quiz-setup');
const quizSection = document.getElementById('quiz-section');
const resultSection = document.getElementById('result-section');

function showModal(form) {
  authModal.style.display = 'flex';
  loginForm.style.display = form === 'login' ? 'flex' : 'none';
  registerForm.style.display = form === 'register' ? 'flex' : 'none';
  document.getElementById('login-msg').textContent = '';
  document.getElementById('register-msg').textContent = '';
}
loginBtn.onclick = () => showModal('login');
registerBtn.onclick = () => showModal('register');
closeModal.onclick = () => { authModal.style.display = 'none'; };
window.onclick = function(e) { if (e.target == authModal) authModal.style.display = 'none'; };

// --- Auth Logic (localStorage demo) ---
function registerUser(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value;
  const pass2 = document.getElementById('reg-password2').value;
  if (!name || !email || !pass || !pass2) {
    document.getElementById('register-msg').textContent = "All fields required.";
    return;
  }
  if (pass.length < 6) {
    document.getElementById('register-msg').textContent = "Password must be at least 6 characters.";
    return;
  }
  if (pass !== pass2) {
    document.getElementById('register-msg').textContent = "Passwords do not match.";
    return;
  }
  if (localStorage.getItem('user_' + email)) {
    document.getElementById('register-msg').textContent = "Email already registered.";
    return;
  }
  localStorage.setItem('user_' + email, JSON.stringify({name, email, pass}));
  document.getElementById('register-msg').style.color = "#388e3c";
  document.getElementById('register-msg').textContent = "Registration successful! Please login.";
  setTimeout(() => showModal('login'), 1200);
}
function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const user = localStorage.getItem('user_' + email);
  if (!user) {
    document.getElementById('login-msg').textContent = "User not found.";
    return;
  }
  const data = JSON.parse(user);
  if (data.pass !== pass) {
    document.getElementById('login-msg').textContent = "Incorrect password.";
    return;
  }
  localStorage.setItem('quiz_loggedin', email);
  authModal.style.display = 'none';
  showQuizSetup();
}
loginForm.onsubmit = loginUser;
registerForm.onsubmit = registerUser;

function logoutUser() {
  localStorage.removeItem('quiz_loggedin');
  location.reload();
}
document.getElementById('logout-btn').onclick = logoutUser;
document.getElementById('logout-btn2').onclick = logoutUser;

// --- Navigation Logic ---
document.getElementById('start-quiz-home').onclick = () => {
  if (localStorage.getItem('quiz_loggedin')) {
    showQuizSetup();
  } else {
    showModal('login');
  }
};

function showQuizSetup() {
  homeSection.style.display = 'none';
  quizSetup.style.display = 'block';
  quizSection.style.display = 'none';
  resultSection.style.display = 'none';
  loadCategories();
}

// --- Quiz Logic ---
let questions = [];
let current = 0;
let score = 0;

async function loadCategories() {
  const res = await fetch('https://opentdb.com/api_category.php');
  const data = await res.json();
  const select = document.getElementById('category');
  select.innerHTML = '';
  data.trivia_categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

document.getElementById('start-btn').onclick = async function() {
  const cat = document.getElementById('category').value;
  const amount = Math.min(Math.max(parseInt(document.getElementById('amount').value), 10), 100);
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${cat}&type=multiple`;
  document.getElementById('start-btn').disabled = true;
  document.getElementById('start-btn').textContent = "Loading...";
  const res = await fetch(url);
  const data = await res.json();
  document.getElementById('start-btn').disabled = false;
  document.getElementById('start-btn').textContent = "Start Quiz";
  if (!data.results || data.results.length === 0) {
    alert("Not enough questions available for this category/amount. Try fewer questions or another category.");
    return;
  }
  questions = data.results;
  current = 0;
  score = 0;
  quizSetup.style.display = 'none';
  quizSection.style.display = 'block';
  resultSection.style.display = 'none';
  showQuestion();
};

function decodeHtml(html) {
  var txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function showQuestion() {
  if (current >= questions.length) {
    quizSection.style.display = 'none';
    resultSection.style.display = 'block';
    document.getElementById('score').textContent = `Your Score: ${score} / ${questions.length}`;
    return;
  }
  const q = questions[current];
  document.getElementById('progress').textContent = `Question ${current + 1} of ${questions.length}`;
  document.getElementById('question').textContent = decodeHtml(q.question);

  const answersDiv = document.getElementById('answers');
  answersDiv.innerHTML = '';
  let options = [...q.incorrect_answers, q.correct_answer].map(decodeHtml);
  options = shuffle(options);

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(btn, opt, decodeHtml(q.correct_answer));
    answersDiv.appendChild(btn);
  });

  document.getElementById('next-btn').style.display = 'none';
}

function selectAnswer(btn, selected, correct) {
  const btns = document.querySelectorAll('.answer-btn');
  btns.forEach(b => b.disabled = true);
  if (selected === correct) {
    btn.classList.add('correct');
    score++;
  } else {
    btn.classList.add('wrong');
    btns.forEach(b => {
      if (b.textContent === correct) b.classList.add('correct');
    });
  }
  document.getElementById('next-btn').style.display = 'inline-block';
}

document.getElementById('next-btn').onclick = function() {
  current++;
  showQuestion();
};

document.getElementById('restart-btn').onclick = function() {
  showQuizSetup();
};

// On Load
window.onload = function() {
  if (localStorage.getItem('quiz_loggedin')) {
    showQuizSetup();
  } else {
    homeSection.style.display = 'flex';
    quizSetup.style.display = 'none';
    quizSection.style.display = 'none';
    resultSection.style.display = 'none';
  }
};
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
