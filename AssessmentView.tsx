export type UserRole = 'student' | 'lecturer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole | null;
  photoURL: string | null;
  createdAt?: string;
}

export interface Material {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  addedAt: any;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  text: string;
  options?: string[]; // For MCQ
  correctAnswer?: string;
  points: number;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: 'quiz' | 'assignment';
  
  // Quiz specific
  timeLimit?: number; // in minutes
  questions?: Question[];
  passingScore?: number;

  // Assignment specific
  dueDate?: any;
  gradingCriteria?: string;
  maxScore?: number;
  
  createdAt: any;
}

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  artifactId: string; // Assessment ID
  type: 'quiz' | 'assignment';
  content: any; // Answers for quiz, fileUrl/text for assignment
  score?: number;
  feedback?: string;
  submittedAt: any;
  gradedAt?: any;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  code: string;
  lecturerId: string;
  thumbnail?: string;
  category?: string;
  prerequisites?: string[];
  objectives?: string[];
  createdAt: any;
}
