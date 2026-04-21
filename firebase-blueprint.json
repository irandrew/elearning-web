{
  "entities": {
    "User": {
      "title": "User Profile",
      "description": "User account information and roles.",
      "type": "object",
      "properties": {
        "uid": { "type": "string" },
        "email": { "type": "string" },
        "displayName": { "type": "string" },
        "role": { "type": "string", "enum": ["student", "lecturer", "admin"] },
        "photoURL": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["uid", "email", "role"]
    },
    "Course": {
      "title": "Course",
      "description": "Educational course offered by the university.",
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "code": { "type": "string" },
        "lecturerId": { "type": "string" },
        "thumbnail": { "type": "string" },
        "category": { "type": "string" },
        "prerequisites": { "type": "array", "items": { "type": "string" } },
        "objectives": { "type": "array", "items": { "type": "string" } },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["title", "code", "lecturerId"]
    },
    "Material": {
      "title": "Course Material",
      "description": "Uploaded documents, videos, or external links.",
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "type": { "type": "string", "enum": ["video", "document", "link"] },
        "url": { "type": "string" },
        "addedAt": { "type": "string", "format": "date-time" }
      }
    },
    "Quiz": {
      "title": "Quiz",
      "description": "Assessment with multiple question types.",
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "timeLimit": { "type": "integer" },
        "questions": { "type": "array", "items": { "type": "object" } },
        "passingScore": { "type": "integer" }
      }
    },
    "Assignment": {
      "title": "Assignment",
      "description": "Task for students to complete and submit.",
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "dueDate": { "type": "string", "format": "date-time" },
        "gradingCriteria": { "type": "string" },
        "maxScore": { "type": "integer" }
      }
    },
    "Submission": {
      "title": "Submission",
      "description": "Record of a student's answer or file upload.",
      "type": "object",
      "properties": {
        "userId": { "type": "string" },
        "courseId": { "type": "string" },
        "artifactId": { "type": "string" },
        "type": { "type": "string", "enum": ["quiz", "assignment"] },
        "content": { "type": "object" },
        "score": { "type": "integer" },
        "feedback": { "type": "string" },
        "submittedAt": { "type": "string", "format": "date-time" }
      }
    },
    "Module": {
      "title": "Course Module",
      "description": "A section within a course.",
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "order": { "type": "integer" }
      },
      "required": ["title", "order"]
    },
    "Lesson": {
      "title": "Lesson",
      "description": "Individual lesson content within a module.",
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "content": { "type": "string" },
        "order": { "type": "integer" },
        "resources": { "type": "array", "items": { "type": "object" } }
      },
      "required": ["title", "content", "order"]
    },
    "Enrollment": {
      "title": "Student Enrollment",
      "description": "Tracks a student's progress in a course.",
      "type": "object",
      "properties": {
        "studentId": { "type": "string" },
        "courseId": { "type": "string" },
        "enrolledAt": { "type": "string", "format": "date-time" },
        "progress": { "type": "integer" },
        "completed": { "type": "boolean" }
      },
      "required": ["studentId", "courseId"]
    }
  },
  "firestore": {
    "/users/{userId}": {
      "schema": "User",
      "description": "User profiles by UID."
    },
    "/courses/{courseId}": {
      "schema": "Course",
      "description": "Available university courses."
    },
    "/courses/{courseId}/modules/{moduleId}": {
      "schema": "Module",
      "description": "Modules for a specific course."
    },
    "/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}": {
      "schema": "Lesson",
      "description": "Lessons within a module."
    },
    "/courses/{courseId}/assessments/{assessmentId}": {
      "schema": { "$ref": "Quiz" },
      "description": "Quizzes or assignments at the course level."
    },
    "/submissions/{submissionId}": {
      "schema": "Submission",
      "description": "Student task completions."
    },
    "/enrollments/{enrollmentId}": {
      "schema": "Enrollment",
      "description": "Student enrollments in courses."
    }
  }
}
