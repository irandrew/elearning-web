// ============================================
// E-LEARNING SYSTEM FOR UNIVERSITY OF RWANDA
// Single-file Node.js + Express + SQLite
// ============================================

require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// ========== CONFIGURATION ==========
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ur_elearning_secret_key';
const UPLOAD_DIR = './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ========== DATABASE SETUP (SQLite) ==========
const db = new sqlite3.Database('./database.sqlite');

// Initialize tables (run once)
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    fullName TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','lecturer','admin')),
    studentId TEXT UNIQUE,
    department TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Courses table
  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    credits INTEGER,
    lecturerId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lecturerId) REFERENCES users(id)
  )`);

  // Enrollments (junction)
  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    studentId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studentId, courseId),
    FOREIGN KEY(studentId) REFERENCES users(id),
    FOREIGN KEY(courseId) REFERENCES courses(id)
  )`);

  // Modules
  db.run(`CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    videoUrl TEXT,
    "order" INTEGER,
    courseId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(courseId) REFERENCES courses(id)
  )`);

  // Assignments
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    dueDate TEXT,
    maxScore REAL,
    courseId TEXT NOT NULL,
    FOREIGN KEY(courseId) REFERENCES courses(id)
  )`);

  // Submissions
  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    assignmentId TEXT NOT NULL,
    studentId TEXT NOT NULL,
    fileUrl TEXT,
    score REAL,
    feedback TEXT,
    submittedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assignmentId) REFERENCES assignments(id),
    FOREIGN KEY(studentId) REFERENCES users(id)
  )`);

  // Quizzes
  db.run(`CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    courseId TEXT NOT NULL,
    FOREIGN KEY(courseId) REFERENCES courses(id)
  )`);

  // Questions (JSON options stored as text)
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    options TEXT NOT NULL,   -- JSON array
    correctOption INTEGER NOT NULL,
    quizId TEXT NOT NULL,
    FOREIGN KEY(quizId) REFERENCES quizzes(id)
  )`);

  // Quiz submissions (student answers)
  db.run(`CREATE TABLE IF NOT EXISTS quiz_submissions (
    id TEXT PRIMARY KEY,
    quizId TEXT NOT NULL,
    studentId TEXT NOT NULL,
    answers TEXT NOT NULL,   -- JSON array of selected option indices
    score REAL,
    submittedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quizId, studentId)
  )`);
});

// ========== HELPER FUNCTIONS ==========
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ========== MIDDLEWARE ==========
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/uploads', express.static(UPLOAD_DIR)); // serve uploaded files

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Authentication middleware
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getQuery('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ========== AUTH CONTROLLERS ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role, studentId, department } = req.body;
    if (!['student', 'lecturer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = generateId();
    await runQuery(
      `INSERT INTO users (id, email, passwordHash, fullName, role, studentId, department)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, email, hashedPassword, fullName, role, studentId || null, department || null]
    );
    res.status(201).json({ message: 'User registered successfully', userId: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== COURSE ROUTES ==========
// List courses (filter by role: students see enrolled, lecturers see their own, admin sees all)
app.get('/api/courses', protect, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'admin') {
      courses = await allQuery(`SELECT c.*, u.fullName as lecturerName FROM courses c
                                LEFT JOIN users u ON c.lecturerId = u.id`);
    } else if (req.user.role === 'lecturer') {
      courses = await allQuery(`SELECT c.*, u.fullName as lecturerName FROM courses c
                                LEFT JOIN users u ON c.lecturerId = u.id
                                WHERE c.lecturerId = ?`, [req.user.id]);
    } else { // student
      courses = await allQuery(`SELECT c.*, u.fullName as lecturerName, 
                                (SELECT COUNT(*) FROM enrollments e WHERE e.courseId = c.id AND e.studentId = ?) as enrolled
                                FROM courses c LEFT JOIN users u ON c.lecturerId = u.id`, [req.user.id]);
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create course (lecturer/admin)
app.post('/api/courses', protect, restrictTo('lecturer', 'admin'), async (req, res) => {
  try {
    const { title, code, description, credits } = req.body;
    if (!title || !code) return res.status(400).json({ message: 'Title and code required' });

    const existing = await getQuery('SELECT id FROM courses WHERE code = ?', [code]);
    if (existing) return res.status(400).json({ message: 'Course code already exists' });

    const id = generateId();
    await runQuery(
      `INSERT INTO courses (id, title, code, description, credits, lecturerId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, code, description, credits || 3, req.user.id]
    );
    res.status(201).json({ message: 'Course created', courseId: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Enroll in course (student)
app.post('/api/courses/:courseId/enroll', protect, restrictTo('student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await getQuery('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const existing = await getQuery('SELECT id FROM enrollments WHERE studentId = ? AND courseId = ?', [req.user.id, courseId]);
    if (existing) return res.status(400).json({ message: 'Already enrolled' });

    const id = generateId();
    await runQuery('INSERT INTO enrollments (id, studentId, courseId) VALUES (?, ?, ?)', [id, req.user.id, courseId]);
    res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get modules of a course (only if enrolled or lecturer)
app.get('/api/courses/:courseId/modules', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await getQuery('SELECT lecturerId FROM courses WHERE id = ?', [courseId]);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'student') {
      const enrolled = await getQuery('SELECT id FROM enrollments WHERE studentId = ? AND courseId = ?', [req.user.id, courseId]);
      if (!enrolled && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not enrolled in this course' });
      }
    } else if (req.user.role === 'lecturer' && course.lecturerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not your course' });
    }

    const modules = await allQuery('SELECT * FROM modules WHERE courseId = ? ORDER BY "order" ASC', [courseId]);
    res.json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add module to course (lecturer only)
app.post('/api/courses/:courseId/modules', protect, restrictTo('lecturer', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, videoUrl, order } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    const course = await getQuery('SELECT lecturerId FROM courses WHERE id = ?', [courseId]);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.lecturerId !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this course' });
    }

    const id = generateId();
    await runQuery(
      `INSERT INTO modules (id, title, content, videoUrl, "order", courseId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, content || '', videoUrl || null, order || 0, courseId]
    );
    res.status(201).json({ message: 'Module added', moduleId: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== ASSIGNMENT ROUTES ==========
// List assignments (student sees assignments of enrolled courses, lecturer sees own courses)
app.get('/api/assignments', protect, async (req, res) => {
  try {
    let assignments;
    if (req.user.role === 'admin') {
      assignments = await allQuery(`SELECT a.*, c.title as courseTitle FROM assignments a
                                    JOIN courses c ON a.courseId = c.id`);
    } else if (req.user.role === 'lecturer') {
      assignments = await allQuery(`SELECT a.*, c.title as courseTitle FROM assignments a
                                    JOIN courses c ON a.courseId = c.id
                                    WHERE c.lecturerId = ?`, [req.user.id]);
    } else { // student
      assignments = await allQuery(`SELECT a.*, c.title as courseTitle FROM assignments a
                                    JOIN courses c ON a.courseId = c.id
                                    JOIN enrollments e ON e.courseId = c.id
                                    WHERE e.studentId = ?`, [req.user.id]);
    }
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create assignment (lecturer)
app.post('/api/assignments', protect, restrictTo('lecturer', 'admin'), async (req, res) => {
  try {
    const { title, description, dueDate, maxScore, courseId } = req.body;
    if (!title || !courseId) return res.status(400).json({ message: 'Title and courseId required' });

    const course = await getQuery('SELECT lecturerId FROM courses WHERE id = ?', [courseId]);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.lecturerId !== req.user.id) {
      return res.status(403).json({ message: 'Not your course' });
    }

    const id = generateId();
    await runQuery(
      `INSERT INTO assignments (id, title, description, dueDate, maxScore, courseId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, description || '', dueDate || null, maxScore || 100, courseId]
    );
    res.status(201).json({ message: 'Assignment created', assignmentId: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit assignment (file upload)
app.post('/api/assignments/:assignmentId/submit', protect, restrictTo('student'), upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    // Check if student is enrolled in the course of this assignment
    const assignment = await getQuery(`SELECT a.courseId FROM assignments a WHERE a.id = ?`, [assignmentId]);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const enrolled = await getQuery('SELECT id FROM enrollments WHERE studentId = ? AND courseId = ?', [req.user.id, assignment.courseId]);
    if (!enrolled) return res.status(403).json({ message: 'You are not enrolled in this course' });

    // Check if already submitted
    const existing = await getQuery('SELECT id FROM submissions WHERE assignmentId = ? AND studentId = ?', [assignmentId, req.user.id]);
    if (existing) {
      // Update file
      await runQuery('UPDATE submissions SET fileUrl = ?, submittedAt = CURRENT_TIMESTAMP WHERE id = ?', [file.path, existing.id]);
      return res.json({ message: 'Submission updated', submissionId: existing.id });
    }

    const id = generateId();
    await runQuery(
      `INSERT INTO submissions (id, assignmentId, studentId, fileUrl)
       VALUES (?, ?, ?, ?)`,
      [id, assignmentId, req.user.id, file.path]
    );
    res.status(201).json({ message: 'Assignment submitted', submissionId: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get submission details (student or lecturer)
app.get('/api/submissions/:submissionId', protect, async (req, res) => {
  try {
    const submission = await getQuery(`SELECT s.*, a.title as assignmentTitle, u.fullName as studentName
                                       FROM submissions s
                                       JOIN assignments a ON s.assignmentId = a.id
                                       JOIN users u ON s.studentId = u.id
                                       WHERE s.id = ?`, [req.params.submissionId]);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Check authorization
    const course = await getQuery('SELECT lecturerId FROM courses WHERE id = (SELECT courseId FROM assignments WHERE id = ?)', [submission.assignmentId]);
    if (req.user.role !== 'admin' && req.user.id !== submission.studentId && req.user.id !== course.lecturerId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Grade submission (lecturer)
app.put('/api/submissions/:submissionId/grade', protect, restrictTo('lecturer', 'admin'), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const submission = await getQuery('SELECT assignmentId FROM submissions WHERE id = ?', [req.params.submissionId]);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const assignment = await getQuery('SELECT courseId FROM assignments WHERE id = ?', [submission.assignmentId]);
    const course = await getQuery('SELECT lecturerId FROM courses WHERE id = ?', [assignment.courseId]);
    if (req.user.role !== 'admin' && course.lecturerId !== req.user.id) {
      return res.status(403).json({ message: 'Not your course' });
    }

    await runQuery('UPDATE submissions SET score = ?, feedback = ? WHERE id = ?', [score, feedback || null, req.params.submissionId]);
    res.json({ message: 'Submission graded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== QUIZ ROUTES ==========
// Create quiz (lecturer)
app.post('/api/quizzes', protect, restrictTo('lecturer', 'admin'), async (req, res) => {
  try {
    const { title, courseId, questions } = req.body; // questions: array of {text, options[], correctOption}
    if (!title || !courseId || !questions || !questions.length) {
      return res.status(400).json({ message: 'Title, courseId and at least one question required' });
    }

    const course = await getQuery('SELECT lecturerId FROM courses WHERE id = ?', [courseId]);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.lecturerId !== req.user.id) {
      return res.status(403).json({ message: 'Not your course' });
    }

    const quizId = generateId();
    await runQuery('INSERT INTO quizzes (id, title, courseId) VALUES (?, ?, ?)', [quizId, title, courseId]);

    for (const q of questions) {
      const qId = generateId();
      await runQuery(
        `INSERT INTO questions (id, text, options, correctOption, quizId)
         VALUES (?, ?, ?, ?, ?)`,
        [qId, q.text, JSON.stringify(q.options), q.correctOption, quizId]
      );
    }
    res.status(201).json({ message: 'Quiz created', quizId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Take quiz (get questions without correct answers)
app.get('/api/quizzes/:quizId/take', protect, restrictTo('student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await getQuery('SELECT courseId FROM quizzes WHERE id = ?', [quizId]);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const enrolled = await getQuery('SELECT id FROM enrollments WHERE studentId = ? AND courseId = ?', [req.user.id, quiz.courseId]);
    if (!enrolled) return res.status(403).json({ message: 'You are not enrolled in this course' });

    const questions = await allQuery('SELECT id, text, options FROM questions WHERE quizId = ?', [quizId]);
    // Return options as parsed JSON
    const parsed = questions.map(q => ({ ...q, options: JSON.parse(q.options) }));
    res.json({ quizId, questions: parsed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit quiz answers (auto-grade)
app.post('/api/quizzes/:quizId/submit', protect, restrictTo('student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // array of selected option indices (same order as questions)
    if (!answers || !answers.length) return res.status(400).json({ message: 'Answers required' });

    const quiz = await getQuery('SELECT courseId FROM quizzes WHERE id = ?', [quizId]);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const enrolled = await getQuery('SELECT id FROM enrollments WHERE studentId = ? AND courseId = ?', [req.user.id, quiz.courseId]);
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled' });

    // Check if already submitted
    const existing = await getQuery('SELECT id FROM quiz_submissions WHERE quizId = ? AND studentId = ?', [quizId, req.user.id]);
    if (existing) return res.status(400).json({ message: 'You have already taken this quiz' });

    const questions = await allQuery('SELECT correctOption FROM questions WHERE quizId = ? ORDER BY id', [quizId]);
    if (answers.length !== questions.length) {
      return res.status(400).json({ message: 'Number of answers does not match questions' });
    }

    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctOption) score++;
    }
    const total = questions.length;
    const finalScore = (score / total) * 100;

    const submissionId = generateId();
    await runQuery(
      `INSERT INTO quiz_submissions (id, quizId, studentId, answers, score)
       VALUES (?, ?, ?, ?, ?)`,
      [submissionId, quizId, req.user.id, JSON.stringify(answers), finalScore]
    );
    res.json({ message: 'Quiz submitted', score: finalScore, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 University of Rwanda E-Learning System running on http://localhost:${PORT}`);
  console.log(`📁 File uploads saved to: ${UPLOAD_DIR}`);
  console.log(`📦 Database: database.sqlite`);
});