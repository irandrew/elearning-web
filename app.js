/* ================================
   UR LEARN — App JavaScript
   ================================ */

// ==================== NAVIGATION ====================
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  const navItem = document.querySelector(`[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }

  // Init calendar when navigating there
  if (page === 'calendar') renderCalendar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ==================== NOTIFICATIONS ====================
function toggleNotifications() {
  const dd = document.getElementById('notifDropdown');
  dd.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const dd = document.getElementById('notifDropdown');
  if (!e.target.closest('.topbar-actions')) {
    dd.classList.remove('open');
  }
});

// ==================== SEARCH ====================
function handleSearch(val) {
  if (!val.trim()) return;
  // Visual feedback
  showToast(`Searching for "${val}"…`);
}

// ==================== COURSE FILTER ====================
function filterCourses(status, btn) {
  document.querySelectorAll('#coursesGrid .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  document.querySelectorAll('.course-card').forEach(card => {
    if (status === 'all' || card.dataset.status === status) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

// ==================== COURSE MODAL ====================
const courseData = {
  cs301: { code: 'CS 301', title: 'Database Systems', instructor: 'Dr. Jean-Pierre Nkusi', lectures: 12, assignments: 4, progress: 68, credits: 4, bg: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' },
  math201: { code: 'MA 201', title: 'Linear Algebra', instructor: 'Prof. Clementine Mukandayisenga', lectures: 9, assignments: 3, progress: 45, credits: 3, bg: 'linear-gradient(135deg,#064e3b,#10b981)' },
  cs401: { code: 'CS 401', title: 'Web Development', instructor: 'Dr. Patrick Habimana', lectures: 15, assignments: 5, progress: 82, credits: 4, bg: 'linear-gradient(135deg,#4c1d95,#8b5cf6)' },
  cs350: { code: 'CS 350', title: 'Computer Networks', instructor: 'Prof. Emmanuel Rurangwa', lectures: 11, assignments: 3, progress: 35, credits: 3, bg: 'linear-gradient(135deg,#7c2d12,#f97316)' },
  cs200: { code: 'CS 200', title: 'Data Structures & Algorithms', instructor: 'Dr. Solange Ingabire', lectures: 14, assignments: 6, progress: 100, credits: 4, bg: 'linear-gradient(135deg,#134e4a,#14b8a6)' },
  stat101: { code: 'ST 101', title: 'Probability & Statistics', instructor: 'Prof. Alphonse Bizimana', lectures: 10, assignments: 4, progress: 100, credits: 3, bg: 'linear-gradient(135deg,#1e1b4b,#6366f1)' }
};

function openCourseModal(id) {
  const d = courseData[id];
  if (!d) return;
  document.getElementById('modalBanner').style.background = d.bg;
  document.getElementById('modalCode').textContent = d.code;
  document.getElementById('modalTitle').textContent = d.title;
  document.getElementById('modalInstructor').textContent = d.instructor;

  const stats = document.querySelectorAll('.ms-item .ms-num');
  if (stats[0]) stats[0].textContent = d.lectures;
  if (stats[1]) stats[1].textContent = d.assignments;
  if (stats[2]) stats[2].textContent = d.progress + '%';
  if (stats[3]) stats[3].textContent = d.credits;

  document.getElementById('courseModal').classList.add('open');
}

function openSubmitModal() {
  document.getElementById('submitModal').classList.add('open');
}

function openNewPost() {
  document.getElementById('newPostModal').classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ==================== ASSIGNMENT FILTER ====================
function filterAssign(status, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  document.querySelectorAll('#assignBody tr').forEach(row => {
    if (status === 'all' || row.dataset.status === status) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// ==================== FILE UPLOAD ====================
function handleFileSelect(input) {
  if (input.files && input.files[0]) {
    showFilePreview(input.files[0]);
  }
}

function handleDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) showFilePreview(file);
}

function showFilePreview(file) {
  const preview = document.getElementById('filePreview');
  preview.style.display = 'block';
  const size = (file.size / 1024 / 1024).toFixed(2);
  preview.innerHTML = `<strong>📄 ${file.name}</strong> — ${size} MB <span style="color:#16a34a;margin-left:8px">✓ Ready to submit</span>`;
}

function submitAssignment() {
  closeModal('submitModal');
  showToast('✅ Assignment submitted successfully!');
}

// ==================== FORUM ====================
function filterForum(course, el) {
  document.querySelectorAll('.forum-cat').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');

  document.querySelectorAll('.forum-post').forEach(post => {
    if (course === 'all' || post.dataset.course === course) {
      post.style.display = '';
    } else {
      post.style.display = 'none';
    }
  });
}

function vote(btn, dir) {
  const score = btn.parentElement.querySelector('.fp-score');
  score.textContent = parseInt(score.textContent) + dir;
}

function openThread() {
  showToast('💬 Thread view coming soon…');
}

function postForumPost() {
  closeModal('newPostModal');
  showToast('✅ Post published to the forum!');
}

function toggleTag(el) {
  el.classList.toggle('active');
}

// ==================== RESOURCES ====================
function downloadFile(name) {
  showToast(`⬇ Downloading "${name}"…`);
}

// ==================== LECTURES ====================
let isPlaying = true;
let playProgress = 0;
let playInterval = null;

function selectLecture(el, title, instructor, duration, course) {
  document.querySelectorAll('.lec-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');

  document.getElementById('currentLecTitle').textContent = title;
  document.getElementById('ldTitle').textContent = title;
  document.getElementById('ldInstructor').textContent = instructor;
  document.getElementById('ldDuration').textContent = duration.replace(':','h ').replace(':','m ') + 's';

  // Reset player
  playProgress = 0;
  updateTimeline();
  document.getElementById('timeCur').textContent = '0:00';
}

function togglePlay() {
  isPlaying = !isPlaying;
  const btn = document.getElementById('playBtn');
  if (isPlaying) {
    btn.textContent = '⏸';
    startProgress();
  } else {
    btn.textContent = '▶';
    clearInterval(playInterval);
  }
}

function startProgress() {
  clearInterval(playInterval);
  playInterval = setInterval(() => {
    if (playProgress < 100) {
      playProgress += 0.05;
      updateTimeline();
      // Update time display
      const totalSecs = 72 * 60 + 34;
      const cur = Math.floor((playProgress / 100) * totalSecs);
      const m = Math.floor(cur / 60);
      const s = cur % 60;
      document.getElementById('timeCur').textContent = `${m}:${s.toString().padStart(2,'0')}`;
    } else {
      clearInterval(playInterval);
      isPlaying = false;
      document.getElementById('playBtn').textContent = '▶';
    }
  }, 100);
}

function updateTimeline() {
  document.getElementById('timelineFill').style.width = playProgress + '%';
}

function seekVideo(e, el) {
  const rect = el.getBoundingClientRect();
  playProgress = ((e.clientX - rect.left) / rect.width) * 100;
  updateTimeline();
}

function changeSpeed(val) {
  showToast(`⏩ Playback speed: ${val}`);
}

// Start playing on load
startProgress();

function filterLectures(val) {
  document.querySelectorAll('.lec-item').forEach(item => {
    const title = item.querySelector('.lec-title');
    if (!title) return;
    if (!val || title.textContent.toLowerCase().includes(val.toLowerCase())) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

function switchLdTab(btn, tab) {
  document.querySelectorAll('.ld-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.ld-tab-content').forEach(c => c.classList.add('hidden'));
  const target = document.getElementById('ld-' + tab);
  if (target) target.classList.remove('hidden');
}

// ==================== CALENDAR ====================
const calEvents = {
  '2025-04-07': [{ text: 'DB Systems', type: 'blue' }, { text: 'Linear Algebra', type: 'green' }],
  '2025-04-09': [{ text: 'Web Dev Lecture', type: 'blue' }],
  '2025-04-14': [{ text: 'Networks', type: 'blue' }, { text: 'Assignment Due', type: 'red' }],
  '2025-04-16': [{ text: 'Math Tutorial', type: 'green' }],
  '2025-04-21': [{ text: 'DB Systems', type: 'blue' }, { text: 'Math Tutorial', type: 'green' }],
  '2025-04-23': [{ text: 'Web Dev Due', type: 'red' }],
  '2025-04-24': [{ text: 'Networks Midterm', type: 'amber' }],
  '2025-04-28': [{ text: 'Math Assignment', type: 'red' }],
  '2025-04-30': [{ text: 'Web Dev Lecture', type: 'blue' }],
  '2025-05-05': [{ text: 'DB Systems', type: 'blue' }],
  '2025-05-12': [{ text: 'Final Exam Period', type: 'amber' }],
};

let calYear = 2025, calMonth = 3; // 0-indexed: 3=April

function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = names[calMonth] + ' ' + calYear;
  document.querySelector('#page-calendar .page-subtitle').textContent = names[calMonth] + ' ' + calYear;
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  days.forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // Previous month fill
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = document.createElement('div');
    day.className = 'cal-day other-month';
    day.innerHTML = `<div class="cal-num">${prevDays - i}</div>`;
    grid.appendChild(day);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const day = document.createElement('div');
    day.className = 'cal-day' + (dateStr === todayStr ? ' today' : '');
    let html = `<div class="cal-num">${d}</div>`;
    if (calEvents[dateStr]) {
      calEvents[dateStr].forEach(ev => {
        html += `<div class="cal-event ${ev.type}">${ev.text}</div>`;
      });
    }
    day.innerHTML = html;
    day.onclick = () => {
      if (calEvents[dateStr]) showToast(`📅 ${calEvents[dateStr].map(e => e.text).join(', ')}`);
    };
    grid.appendChild(day);
  }

  // Next month fill
  const total = firstDay + daysInMonth;
  const remaining = 7 - (total % 7 || 7);
  for (let i = 1; i <= remaining; i++) {
    const day = document.createElement('div');
    day.className = 'cal-day other-month';
    day.innerHTML = `<div class="cal-num">${i}</div>`;
    grid.appendChild(day);
  }
}

// ==================== TOAST ====================
let toastTimeout;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3000);
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();

  // Animate stat numbers
  document.querySelectorAll('.stat-num').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all .5s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 200 + Math.random() * 300);
  });
});
