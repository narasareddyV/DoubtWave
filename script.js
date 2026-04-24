// ===== SilentDesk – script.js =====
 
// ===================== CONFIG =====================
const TEACHER_GATE_PASSWORD = "teacher@123"; // Default access password (admin changes this in code)
const MAX_DOUBTS = 3; // Max doubts a student can send per session until chat is cleared
const MAX_MSG_CHARS = 50; // Max characters (no spaces)
 
// ===================== BANNED WORDS (basic filter) =====================
const BANNED_WORDS = [
  "fuck","shit","bitch","bastard","asshole","damn","hell","crap","dick","pussy",
  "nigger","nigga","slut","whore","faggot","retard","idiot","stupid","moron","kill",
  "rape","abuse","porn","sex","nude","naked"
];
 
function containsBannedContent(text) {
  const lower = text.toLowerCase().replace(/[^a-z0-9]/g,"");
  return BANNED_WORDS.some(w => lower.includes(w));
}
 
// ===================== ANONYMOUS ID GENERATOR =====================
const ADJECTIVES = ["Swift","Silent","Amber","Cobalt","Lunar","Solar","Neon","Echo","Nova","Pixel","Zen","Arc","Blaze","Crisp","Dusk"];
const NOUNS      = ["Fox","Comet","Wave","Spark","Cloud","Storm","Petal","Ridge","Drift","Flare","Bolt","Orbit","Sage","Prism","Tide"];
 
function generateAnonId() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(1000 + Math.random() * 8999);
  return `${adj}${noun}${num}`;
}
 
// ===================== STORAGE HELPERS =====================
function getTeachers() {
  return JSON.parse(localStorage.getItem("sd_teachers") || "{}");
}
function saveTeachers(t) {
  localStorage.setItem("sd_teachers", JSON.stringify(t));
}
 
function getSession() {
  return JSON.parse(sessionStorage.getItem("sd_session") || "null");
}
function saveSession(s) {
  sessionStorage.setItem("sd_session", JSON.stringify(s));
}
function clearSession() {
  sessionStorage.removeItem("sd_session");
}
 
// Chat key: branch_sem_sec_subject
function chatKey(branch, sem, sec, subject) {
  return `sd_chat_${branch}_${sem}_${sec}_${subject}`;
}
function getMessages(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}
function saveMessages(key, msgs) {
  localStorage.setItem(key, JSON.stringify(msgs));
}
 
// Student doubt count key per session (reset on chat clear)
function countKey(anonId, chatK) {
  return `sd_count_${anonId}_${chatK}`;
}
function getCount(anonId, chatK) {
  return parseInt(localStorage.getItem(countKey(anonId, chatK)) || "0");
}
function setCount(anonId, chatK, val) {
  localStorage.setItem(countKey(anonId, chatK), String(val));
}
function resetCount(anonId, chatK) {
  localStorage.removeItem(countKey(anonId, chatK));
}
 
// ===================== PAGE DETECTION =====================
function currentPage() {
  const p = location.pathname.split("/").pop();
  return p || "index.html";
}
 
// ===================== SUBJECTS DATA =====================
const SUBJECTS = {
  CSE: {
    1: ["Mathematics I","Engineering Physics","Engineering Chemistry","C Programming","Engineering Drawing","English"],
    2: ["Mathematics II","Data Structures","Digital Electronics","Environmental Science","OOP with Java","Workshop"],
    3: ["Discrete Mathematics","DBMS","Computer Organization","Operating Systems","Formal Languages","Software Engg"],
    4: ["Design & Analysis of Algorithms","Computer Networks","Microprocessors","Statistics","Web Technologies","OOAD"],
    5: ["Compiler Design","AI","Information Security","Cloud Computing","Machine Learning","Open Elective"],
    6: ["Distributed Systems","Deep Learning","Big Data Analytics","Blockchain","NLP","Professional Elective"],
    7: ["Project Phase I","Internship","Research Methodology","Professional Elective","Open Elective"],
    8: ["Project Phase II","Seminar","Professional Elective"],
  },
  ECE: {
    1: ["Mathematics I","Engineering Physics","Engineering Chemistry","C Programming","Engineering Drawing","English"],
    2: ["Mathematics II","Network Analysis","Electronic Devices","Signals & Systems","EMT","Workshop"],
    3: ["Analog Circuits","Digital Electronics","Control Systems","Mathematics III","Communication Theory","VLSI"],
    4: ["Microprocessors","DSP","Antenna Theory","Embedded Systems","Linear ICs","OOP"],
    5: ["Wireless Comm","Radar & TV","Satellite Comm","VLSI Design","IoT","Open Elective"],
    6: ["RF Engineering","Image Processing","Optical Comm","MEMS","Professional Elective","Machine Learning"],
    7: ["Project Phase I","Internship","Research Methodology","Professional Elective","Open Elective"],
    8: ["Project Phase II","Seminar","Professional Elective"],
  },
  EEE: {
    1: ["Mathematics I","Engineering Physics","Engineering Chemistry","C Programming","Engineering Drawing","English"],
    2: ["Mathematics II","Circuit Theory","EMT","Electrical Machines I","Workshop","Engg Mechanics"],
    3: ["Electrical Machines II","Control Systems","Mathematics III","Power Systems I","Measurements","Digital Electronics"],
    4: ["Power Electronics","Microprocessors","Power Systems II","Switchgear","DSP","Network Theory"],
    5: ["High Voltage Engg","Drives","SCADA","Renewable Energy","Open Elective","Professional Elective"],
    6: ["Power System Protection","Smart Grid","Power Quality","Flexible AC Transmission","Professional Elective","ML for EEE"],
    7: ["Project Phase I","Internship","Research Methodology","Professional Elective","Open Elective"],
    8: ["Project Phase II","Seminar","Professional Elective"],
  },
  MECH: {
    1: ["Mathematics I","Engineering Physics","Engineering Chemistry","C Programming","Engineering Drawing","English"],
    2: ["Mathematics II","Engg Mechanics","Material Science","Thermodynamics","Workshop","Manufacturing Processes"],
    3: ["Fluid Mechanics","Kinematics","SOM","Mathematics III","Machine Drawing","Manufacturing Technology"],
    4: ["Dynamics of Machinery","Heat Transfer","Design of Machine Elements","Metrology","IC Engines","CAD/CAM"],
    5: ["Refrigeration & AC","Mechatronics","Automobile Engg","Open Elective","Professional Elective","Tribology"],
    6: ["Robotics","FEA","Industrial Management","Unconventional Machining","Professional Elective","EV Technology"],
    7: ["Project Phase I","Internship","Research Methodology","Professional Elective","Open Elective"],
    8: ["Project Phase II","Seminar","Professional Elective"],
  },
  CIVIL: {
    1: ["Mathematics I","Engineering Physics","Engineering Chemistry","C Programming","Engineering Drawing","English"],
    2: ["Mathematics II","SOM","FM","Construction Materials","Surveying","Engineering Geology"],
    3: ["Structural Analysis I","Geotechnical Engineering","Hydraulics","Mathematics III","Environmental Engg","RCC"],
    4: ["Structural Analysis II","Design of Steel Structures","Transportation Engg","Water Supply","Foundation Engg","GIS"],
    5: ["Prestressed Concrete","Construction Management","Irrigation","Open Elective","Professional Elective","Hydrology"],
    6: ["Remote Sensing","Urban Planning","Earthquake Engg","Professional Elective","Bridge Engg","Waste Management"],
    7: ["Project Phase I","Internship","Research Methodology","Professional Elective","Open Elective"],
    8: ["Project Phase II","Seminar","Professional Elective"],
  },
  IT: {
    1: ["Mathematics I","Engineering Physics","Engineering Chemistry","C Programming","Engineering Drawing","English"],
    2: ["Mathematics II","Data Structures","Digital Electronics","Environmental Science","OOP with Java","Workshop"],
    3: ["Discrete Mathematics","DBMS","Computer Organization","Operating Systems","Formal Languages","Software Engg"],
    4: ["Design & Analysis of Algorithms","Computer Networks","Microprocessors","Statistics","Web Technologies","OOAD"],
    5: ["Compiler Design","AI","Information Security","Cloud Computing","Machine Learning","Open Elective"],
    6: ["Distributed Systems","Deep Learning","Big Data Analytics","Blockchain","NLP","Professional Elective"],
    7: ["Project Phase I","Internship","Research Methodology","Professional Elective","Open Elective"],
    8: ["Project Phase II","Seminar","Professional Elective"],
  },
  AIDS: {
    1: ["Mathematics I","Engineering Physics","Engineering Chemistry","C Programming","Engineering Drawing","English"],
    2: ["Mathematics II","Python Programming","Statistics & Probability","Data Structures","Database Management","Workshop"],
    3: ["Machine Learning","Data Visualization","Linear Algebra","Mathematics III","Big Data","Cloud Computing"],
    4: ["Deep Learning","Computer Vision","NLP","Data Engineering","Time Series Analysis","AI Ethics"],
    5: ["Reinforcement Learning","MLOps","Graph Analytics","Open Elective","Professional Elective","Business Intelligence"],
    6: ["Generative AI","Explainable AI","Data Governance","Professional Elective","Research Methods","Capstone Prep"],
    7: ["Project Phase I","Internship","Research Methodology","Professional Elective","Open Elective"],
    8: ["Project Phase II","Seminar","Professional Elective"],
  },
  AIML: {
    1: ["Mathematics I","Engineering Physics","Engineering Chemistry","C Programming","Engineering Drawing","English"],
    2: ["Mathematics II","Python for ML","Probability & Statistics","Data Structures","DBMS","Workshop"],
    3: ["Machine Learning Fundamentals","Linear Algebra","Computer Vision Basics","Mathematics III","Big Data Intro","Cloud Services"],
    4: ["Deep Learning","NLP","Reinforcement Learning","Model Deployment","Ethics in AI","Software Engineering"],
    5: ["Advanced ML","Robotics & AI","Generative Models","Open Elective","Professional Elective","MLOps"],
    6: ["Explainable AI","AI in Healthcare","Edge AI","Professional Elective","Research Methods","Capstone Prep"],
    7: ["Project Phase I","Internship","Research Methodology","Professional Elective","Open Elective"],
    8: ["Project Phase II","Seminar","Professional Elective"],
  }
};
 
// ===================== INDEX PAGE =====================
function showTeacherGate() {
  document.getElementById("teacherGate").classList.add("active");
  setTimeout(() => document.getElementById("gatePass").focus(), 100);
}
function hideTeacherGate() {
  document.getElementById("teacherGate").classList.remove("active");
  document.getElementById("gatePass").value = "";
  document.getElementById("gateError").textContent = "";
}
function checkGatePass() {
  const pass = document.getElementById("gatePass").value.trim();
  if (pass === TEACHER_GATE_PASSWORD) {
    hideTeacherGate();
    location.href = "teacher-login.html";
  } else {
    document.getElementById("gateError").textContent = "Incorrect access password.";
  }
}
// Allow Enter key in gate modal
document.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    const gate = document.getElementById("teacherGate");
    if (gate && gate.classList.contains("active")) checkGatePass();
  }
});
 
// ===================== STUDENT LOGIN =====================
let generatedAnonId = null;
 
function initStudentLogin() {
  // Check if already has stored id in sessionStorage
  const sess = getSession();
  if (sess && sess.role === "student") {
    location.href = "class.html";
    return;
  }
  generatedAnonId = generateAnonId();
  const el = document.getElementById("anonIdValue");
  if (el) el.textContent = generatedAnonId;
}
 
function studentLogin() {
  if (!generatedAnonId) return;
  saveSession({ role: "student", id: generatedAnonId });
  location.href = "class.html";
}
 
// ===================== TEACHER LOGIN =====================
function teacherLogin() {
  const user = document.getElementById("teacherUser").value.trim();
  const pass = document.getElementById("teacherPass").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
 
  if (!user || !pass) { errEl.textContent = "Please fill all fields."; return; }
 
  const teachers = getTeachers();
  if (!teachers[user]) { errEl.textContent = "Username not found."; return; }
  if (teachers[user].password !== pass) { errEl.textContent = "Incorrect password."; return; }
 
  saveSession({ role: "teacher", id: user });
  location.href = "class.html";
}
 
// ===================== TEACHER REGISTER =====================
function registerTeacher() {
  const user  = document.getElementById("regUser").value.trim();
  const pass  = document.getElementById("regPass").value;
  const pass2 = document.getElementById("regPass2").value;
  const errEl = document.getElementById("regError");
  const okEl  = document.getElementById("regSuccess");
  errEl.textContent = ""; okEl.textContent = "";
 
  if (!user || !pass || !pass2) { errEl.textContent = "Please fill all fields."; return; }
  if (pass !== pass2) { errEl.textContent = "Passwords do not match."; return; }
  if (pass.length < 6)  { errEl.textContent = "Password must be at least 6 characters."; return; }
 
  const teachers = getTeachers();
  if (teachers[user]) { errEl.textContent = "Username already taken."; return; }
 
  teachers[user] = { password: pass };
  saveTeachers(teachers);
  okEl.textContent = "Account created! Redirecting to login…";
  setTimeout(() => location.href = "teacher-login.html", 1500);
}
 
// ===================== CHANGE PASSWORD (profile.html) =====================
function initProfile() {
  const sess = getSession();
  if (!sess || sess.role !== "teacher") { location.href = "index.html"; return; }
  const h = document.getElementById("profileUsername");
  if (h) h.textContent = `👤 ${sess.id}`;
}
 
function changePassword() {
  const sess = getSession();
  if (!sess) return;
  const old   = document.getElementById("oldPass").value;
  const newP  = document.getElementById("newPass").value;
  const newP2 = document.getElementById("newPass2").value;
  const errEl = document.getElementById("profileError");
  const okEl  = document.getElementById("profileSuccess");
  errEl.textContent = ""; okEl.textContent = "";
 
  if (!old || !newP || !newP2) { errEl.textContent = "Fill all fields."; return; }
  const teachers = getTeachers();
  if (!teachers[sess.id] || teachers[sess.id].password !== old) {
    errEl.textContent = "Current password is incorrect."; return;
  }
  if (newP !== newP2) { errEl.textContent = "New passwords do not match."; return; }
  if (newP.length < 6) { errEl.textContent = "New password must be at least 6 characters."; return; }
 
  teachers[sess.id].password = newP;
  saveTeachers(teachers);
  okEl.textContent = "Password updated successfully!";
  document.getElementById("oldPass").value = "";
  document.getElementById("newPass").value = "";
  document.getElementById("newPass2").value = "";
}
 
// ===================== CLASS/SUBJECT SELECTION =====================
function initClassPage() {
  const sess = getSession();
  if (!sess) { location.href = "index.html"; return; }
 
  const chip = document.getElementById("userChip");
  if (chip) {
    chip.textContent = sess.role === "teacher" ? `🧑‍🏫 ${sess.id}` : `🎓 ${sess.id}`;
  }
 
  // Add profile link for teacher in topbar
  if (sess.role === "teacher") {
    const right = document.querySelector(".topbar-right");
    if (right) {
      const profBtn = document.createElement("a");
      profBtn.href = "profile.html";
      profBtn.className = "btn-ghost";
      profBtn.style.textDecoration = "none";
      profBtn.textContent = "👤 Profile";
      right.insertBefore(profBtn, right.children[1]);
    }
    const desc = document.getElementById("classDesc");
    if (desc) desc.textContent = "Select the class you're teaching to manage doubts.";
  }
}
 
function onBranchChange() {
  const branch = document.getElementById("branchSelect").value;
  const semGroup = document.getElementById("semGroup");
  const secGroup = document.getElementById("secGroup");
  const subjectArea = document.getElementById("subjectArea");
 
  // Reset downstream
  document.getElementById("semSelect").value = "";
  document.getElementById("secSelect").value = "";
  subjectArea.style.display = "none";
 
  if (branch) {
    semGroup.style.display = "flex";
    secGroup.style.display = "none";
  } else {
    semGroup.style.display = "none";
    secGroup.style.display = "none";
  }
}
 
function onSemChange() {
  const sem = document.getElementById("semSelect").value;
  const secGroup = document.getElementById("secGroup");
  const subjectArea = document.getElementById("subjectArea");
  document.getElementById("secSelect").value = "";
  subjectArea.style.display = "none";
 
  if (sem) {
    secGroup.style.display = "flex";
  } else {
    secGroup.style.display = "none";
  }
}
 
function onSectionChange() {
  const branch  = document.getElementById("branchSelect").value;
  const sem     = document.getElementById("semSelect").value;
  const sec     = document.getElementById("secSelect").value;
  const subjectArea = document.getElementById("subjectArea");
  const grid    = document.getElementById("subjectGrid");
  const meta    = document.getElementById("subjectMeta");
 
  if (!branch || !sem || !sec) { subjectArea.style.display = "none"; return; }
 
  const subjects = (SUBJECTS[branch] && SUBJECTS[branch][parseInt(sem)]) || [];
  meta.textContent = `— ${branch} | Sem ${sem} | Sec ${sec}`;
  grid.innerHTML = "";
 
  subjects.forEach(subj => {
    const card = document.createElement("div");
    card.className = "subject-card";
    card.innerHTML = `
      <div class="subj-code">${branch}-${sem}</div>
      <div class="subj-name">${subj}</div>
      <div class="subj-arrow">Open Chat →</div>
    `;
    card.onclick = () => {
      sessionStorage.setItem("sd_subject", JSON.stringify({ branch, sem, sec, subject: subj }));
      location.href = "chat.html";
    };
    grid.appendChild(card);
  });
 
  subjectArea.style.display = "block";
}
 
// ===================== CHAT PAGE =====================
let currentChatKey = null;
let currentSession = null;
let editingMsgIndex = null;
 
function initChat() {
  const sess = getSession();
  if (!sess) { location.href = "index.html"; return; }
  currentSession = sess;
 
  const subjData = JSON.parse(sessionStorage.getItem("sd_subject") || "null");
  if (!subjData) { location.href = "class.html"; return; }
 
  const { branch, sem, sec, subject } = subjData;
  currentChatKey = chatKey(branch, sem, sec, subject);
 
  // Topbar
  const subjectNameEl = document.getElementById("chatSubjectName");
  const metaEl = document.getElementById("chatMeta");
  const chip = document.getElementById("userChip");
  if (subjectNameEl) subjectNameEl.textContent = subject;
  if (metaEl) metaEl.textContent = `${branch} | Sem ${sem} | Section ${sec}`;
  if (chip) chip.textContent = sess.role === "teacher" ? `🧑‍🏫 ${sess.id}` : `🎓 ${sess.id}`;
 
  if (sess.role === "teacher") {
    // Show clear chat button
    const clearBtn = document.getElementById("clearChatBtn");
    if (clearBtn) clearBtn.style.display = "inline-flex";
 
    // Add profile link
    const right = document.querySelector(".chat-topbar-right");
    if (right) {
      const profBtn = document.createElement("a");
      profBtn.href = "profile.html";
      profBtn.className = "btn-ghost";
      profBtn.style.textDecoration = "none";
      profBtn.textContent = "👤 Profile";
      right.insertBefore(profBtn, right.children[1]);
    }
  } else {
    // Show input bar for students
    const inputBar = document.getElementById("chatInputBar");
    if (inputBar) inputBar.style.display = "block";
  }
 
  renderMessages();
  // Poll for new messages every 3 seconds
  setInterval(renderMessages, 3000);
}
 
function renderMessages() {
  if (!currentChatKey || !currentSession) return;
  const msgs = getMessages(currentChatKey);
  const container = document.getElementById("chatMessages");
  if (!container) return;
 
  if (msgs.length === 0) {
    container.innerHTML = '<div class="chat-empty">No doubts yet. Be the first to ask!</div>';
  } else {
    container.innerHTML = "";
    msgs.forEach((msg, i) => {
      const isOwn = msg.senderId === currentSession.id;
      const div = document.createElement("div");
      div.className = `chat-msg ${isOwn ? "own" : "other"}`;
 
      const editedTag = msg.edited ? '<span class="msg-edited">(edited)</span>' : "";
      const editBtn = (isOwn && currentSession.role === "student")
        ? `<button class="msg-edit-btn" onclick="openEditModal(${i})" title="Edit">✏</button>` : "";
 
      div.innerHTML = `
        <div class="msg-meta">
          <span class="msg-sender">${msg.senderId}</span>
          <span>${msg.time}</span>
          ${editedTag}
          ${editBtn}
        </div>
        <div class="msg-bubble">${escapeHtml(msg.text)}</div>
      `;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  }
 
  // Update limit display for students
  if (currentSession.role === "student") {
    updateLimitDisplay();
  }
}
 
function updateLimitDisplay() {
  const count = getCount(currentSession.id, currentChatKey);
  const remaining = MAX_DOUBTS - count;
  const limitEl = document.getElementById("limitInfo");
  const sendBtn = document.getElementById("sendBtn");
  const msgInput = document.getElementById("msgInput");
 
  if (!limitEl) return;
  if (remaining <= 0) {
    limitEl.className = "limit-text maxed";
    limitEl.textContent = `⛔ You've reached the ${MAX_DOUBTS}-doubt limit. Wait for the teacher to clear the chat.`;
    if (sendBtn) sendBtn.disabled = true;
    if (msgInput) msgInput.disabled = true;
  } else {
    limitEl.className = remaining === 1 ? "limit-text warn" : "limit-text";
    limitEl.textContent = `You can send ${remaining} more doubt${remaining !== 1 ? "s" : ""} (${count}/${MAX_DOUBTS} used).`;
    if (sendBtn) sendBtn.disabled = false;
    if (msgInput) msgInput.disabled = false;
  }
}
 
function validateInput(input) {
  // Remove spaces for char counting
  const noSpaces = input.value.replace(/\s/g, "");
  const charCountId = input.id === "editInput" ? "editCharCount" : "charCount";
  const countEl = document.getElementById(charCountId);
  if (countEl) countEl.textContent = `${noSpaces.length}/50`;
}
 
function sendMessage() {
  if (!currentSession || currentSession.role === "teacher") return;
 
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  const noSpaces = text.replace(/\s/g, "");
 
  const errEl = document.querySelector(".limit-text");
 
  if (!text) return;
  if (noSpaces.length > MAX_MSG_CHARS) {
    alert("Message exceeds 50 characters (excluding spaces)."); return;
  }
  if (containsBannedContent(text)) {
    alert("Your message contains inappropriate content and cannot be sent."); return;
  }
 
  const count = getCount(currentSession.id, currentChatKey);
  if (count >= MAX_DOUBTS) return;
 
  const msgs = getMessages(currentChatKey);
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  msgs.push({ senderId: currentSession.id, text, time, edited: false });
  saveMessages(currentChatKey, msgs);
  setCount(currentSession.id, currentChatKey, count + 1);
 
  input.value = "";
  document.getElementById("charCount").textContent = "0/50";
  renderMessages();
}
 
// ===== EDIT =====
function openEditModal(index) {
  const msgs = getMessages(currentChatKey);
  const msg = msgs[index];
  if (!msg || msg.senderId !== currentSession.id) return;
 
  editingMsgIndex = index;
  const modal = document.getElementById("editModal");
  const input = document.getElementById("editInput");
  input.value = msg.text;
  document.getElementById("editCharCount").textContent = `${msg.text.replace(/\s/g,"").length}/50`;
  document.getElementById("editError").textContent = "";
  modal.classList.add("active");
  setTimeout(() => input.focus(), 100);
}
 
function closeEditModal() {
  document.getElementById("editModal").classList.remove("active");
  editingMsgIndex = null;
}
 
function saveEdit() {
  const input = document.getElementById("editInput");
  const text = input.value.trim();
  const noSpaces = text.replace(/\s/g, "");
  const errEl = document.getElementById("editError");
  errEl.textContent = "";
 
  if (!text) { errEl.textContent = "Message cannot be empty."; return; }
  if (noSpaces.length > MAX_MSG_CHARS) { errEl.textContent = "Exceeds 50 characters (no spaces)."; return; }
  if (containsBannedContent(text)) { errEl.textContent = "Inappropriate content detected."; return; }
 
  const msgs = getMessages(currentChatKey);
  msgs[editingMsgIndex].text = text;
  msgs[editingMsgIndex].edited = true;
  saveMessages(currentChatKey, msgs);
  closeEditModal();
  renderMessages();
}
 
// ===== CLEAR CHAT =====
function confirmClearChat() {
  document.getElementById("clearModal").classList.add("active");
}
 
function clearChat() {
  // Remove messages
  localStorage.removeItem(currentChatKey);
  // Reset ALL student counts for this chat
  const keys = Object.keys(localStorage);
  keys.forEach(k => {
    if (k.startsWith("sd_count_") && k.endsWith("_" + currentChatKey.replace("sd_chat_",""))) {
      localStorage.removeItem(k);
    }
  });
  // Also reset by scanning all count keys that contain this chatKey fragment
  const chatFragment = currentChatKey.replace("sd_chat_","");
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("sd_count_") && k.includes(chatFragment)) {
      localStorage.removeItem(k);
    }
  });
 
  document.getElementById("clearModal").classList.remove("active");
  renderMessages();
}
 
// ===================== LOGOUT =====================
function logout() {
  clearSession();
  location.href = "index.html";
}
 
// ===================== UTILS =====================
function escapeHtml(text) {
  return text
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}
 
// ===================== AUTO INIT =====================
window.addEventListener("DOMContentLoaded", function() {
  const page = currentPage();
  if (page === "student-login.html") initStudentLogin();
  else if (page === "teacher-login.html") {
    // Check if already logged in
    const sess = getSession();
    if (sess && sess.role === "teacher") location.href = "class.html";
  }
  else if (page === "class.html") initClassPage();
  else if (page === "chat.html") initChat();
  else if (page === "profile.html") initProfile();
});