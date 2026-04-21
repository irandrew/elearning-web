import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  ChevronRight, 
  Plus, 
  GraduationCap, 
  Layers, 
  PlayCircle, 
  Lock, 
  ClipboardCheck, 
  FileText,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Assessment } from '../types';
import AssessmentCreator from '../components/AssessmentCreator';

export default function CourseDetails() {
  const { courseId } = useParams();
  const { user, profile } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAssessmentCreator, setShowAssessmentCreator] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');

  const isLecturer = (profile?.role === 'lecturer' && course?.lecturerId === user?.uid) || profile?.role === 'admin';

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseData = async () => {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() });
          
          if (user) {
            const enrollmentRef = doc(db, 'enrollments', `${user.uid}_${courseId}`);
            const enrollmentSnap = await getDoc(enrollmentRef);
            setIsEnrolled(enrollmentSnap.exists());
          }
        }

        // Fetch Modules
        const modulesSnap = await getDocs(query(collection(db, `courses/${courseId}/modules`), orderBy('order', 'asc')));
        const modulesData = await Promise.all(modulesSnap.docs.map(async (moduleDoc) => {
          const lessonsSnap = await getDocs(query(collection(db, `courses/${courseId}/modules/${moduleDoc.id}/lessons`), orderBy('order', 'asc')));
          return {
            id: moduleDoc.id,
            ...moduleDoc.data(),
            lessons: lessonsSnap.docs.map(l => ({ id: l.id, ...l.data() }))
          };
        }));
        setModules(modulesData);

        // Fetch Assessments
        const assessmentsSnap = await getDocs(collection(db, `courses/${courseId}/assessments`));
        setAssessments(assessmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));

      } catch (err) {
        console.error("Course fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user, profile]);

  const handleEnroll = async () => {
    if (!user || !courseId) return;
    try {
      const enrollmentRef = doc(db, 'enrollments', `${user.uid}_${courseId}`);
      await setDoc(enrollmentRef, {
        studentId: user.uid,
        courseId: courseId,
        lecturerId: course.lecturerId,
        enrolledAt: serverTimestamp(),
        progress: 0,
        completed: false,
      });
      setIsEnrolled(true);
    } catch (err) {
      console.error("Enrollment error:", err);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !moduleTitle) return;
    try {
      const moduleRef = await addDoc(collection(db, `courses/${courseId}/modules`), {
        title: moduleTitle,
        order: modules.length + 1,
      });
      setModules([...modules, { id: moduleRef.id, title: moduleTitle, order: modules.length + 1, lessons: [] }]);
      setModuleTitle('');
      setShowAddModule(false);
    } catch (err) {
      console.error("Add module error:", err);
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!courseId) return;
    const lessonTitle = prompt("Enter lesson title:");
    if (!lessonTitle) return;

    try {
      const lessonRef = await addDoc(collection(db, `courses/${courseId}/modules/${moduleId}/lessons`), {
        title: lessonTitle,
        content: "Draft content...",
        order: (modules.find(m => m.id === moduleId)?.lessons?.length || 0) + 1,
      });
      
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: [...(m.lessons || []), { id: lessonRef.id, title: lessonTitle, order: (m.lessons || 0) + 1 }]
          };
        }
        return m;
      }));
    } catch (err) {
      console.error("Add lesson error:", err);
    }
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-64 bg-white rounded-[2.5rem]" />
    <div className="h-96 bg-white rounded-[2.5rem]" />
  </div>;

  if (!course) return <div>Course not found</div>;

  return (
    <div className="space-y-10">
      {/* Course Header */}
      <section className="relative rounded-[2.5rem] bg-white overflow-hidden border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 min-h-[300px]">
            <img 
              src={course.thumbnail || `https://picsum.photos/seed/${course.id}/1200/800`} 
              className="w-full h-full object-cover" 
              alt={course.title}
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center space-x-2 text-[#004A99] font-bold text-xs uppercase tracking-widest mb-4">
              <Book className="w-4 h-4" />
              <span>{course.code}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              {course.title}
            </h1>
            <p className="text-gray-500 text-lg mb-6 leading-relaxed">
              {course.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {course.prerequisites?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Prerequisites
                  </h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {course.prerequisites.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {course.objectives?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Objectives
                  </h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {course.objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-10 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-gray-400" />
                <span>{modules.length} Modules</span>
              </div>
              <div className="flex items-center space-x-2">
                <PlayCircle className="w-5 h-5 text-gray-400" />
                <span>{modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} Lessons</span>
              </div>
            </div>

            {user ? (
              isEnrolled || isLecturer ? (
                <div className="flex gap-4">
                  <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 font-bold px-6 py-3 rounded-2xl border border-green-100">
                    <GraduationCap className="w-5 h-5" />
                    <span>{isLecturer ? 'Manage Course' : 'Enrolled'}</span>
                  </div>
                  {isLecturer && (
                    <button 
                      className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
                      title="Course Settings"
                    >
                      <Layers className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  className="bg-[#004A99] text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-md transform hover:-translate-y-1 active:translate-y-0"
                >
                  Enroll in Course
                </button>
              )
            ) : (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center space-x-3">
                <Lock className="w-5 h-5 text-[#004A99]" />
                <p className="text-sm font-medium text-[#004A99]">Please login to enroll and access lessons.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Course Syllabus */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Syllabus & Modules</h2>
            {isLecturer && !showAddModule && (
              <button
                onClick={() => setShowAddModule(true)}
                className="flex items-center space-x-2 text-[#004A99] hover:text-blue-800 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            )}
          </div>

          {showAddModule && (
            <form onSubmit={handleAddModule} className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex items-center space-x-4">
              <input
                autoFocus
                type="text"
                placeholder="Module Title..."
                value={moduleTitle}
                onChange={e => setModuleTitle(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
              <button 
                type="submit"
                className="bg-[#004A99] text-white px-4 py-2 rounded-xl font-bold text-sm"
              >
                Save
              </button>
              <button 
                type="button"
                onClick={() => setShowAddModule(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="space-y-4">
            {modules.map((module, idx) => (
              <div key={module.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-400">
                      {idx + 1}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{module.title}</h3>
                  </div>
                  {isLecturer && (
                    <button 
                      onClick={() => handleAddLesson(module.id)}
                      className="p-2 hover:bg-white rounded-lg text-[#004A99] transition-colors"
                      title="Add Lesson"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="divide-y divide-gray-50">
                  {module.lessons?.map((lesson: any, lIdx: number) => (
                    <Link
                      key={lesson.id}
                      to={isEnrolled || isLecturer ? `/course/${courseId}/lesson/${lesson.id}` : '#'}
                      className={cn(
                        "flex items-center justify-between p-6 transition-all",
                        isEnrolled || isLecturer 
                          ? "hover:bg-blue-50/50 group" 
                          : "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                          {idx + 1}.{lIdx + 1}
                        </div>
                        <span className="font-medium text-gray-700 group-hover:text-[#004A99] transition-colors">
                          {lesson.title}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#004A99] transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessments Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Assessments</h2>
            {isLecturer && (
              <button
                onClick={() => setShowAssessmentCreator(true)}
                className="p-1 px-3 bg-blue-50 text-[#004A99] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
              >
                Add New
              </button>
            )}
          </div>

          <div className="space-y-4">
            {assessments.length === 0 ? (
              <div className="bg-white p-8 rounded-[2rem] border border-dashed border-gray-200 text-center">
                <ClipboardCheck className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 text-xs">No assessments scheduled yet.</p>
              </div>
            ) : (
              assessments.map((a) => (
                <Link
                  key={a.id}
                  to={isEnrolled || isLecturer ? `/course/${courseId}/assessment/${a.id}` : '#'}
                  className="block bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={cn(
                      "p-2 rounded-xl bg-opacity-10 shrink-0",
                      a.type === 'quiz' ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {a.type === 'quiz' ? <ClipboardCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    {a.type === 'quiz' ? (
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{a.timeLimit}m</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-gray-400">
                        Due: {a.dueDate?.toDate ? a.dueDate.toDate().toLocaleDateString() : 'TBD'}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 group-hover:text-[#004A99] transition-colors">{a.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{a.description}</p>
                </Link>
              ))
            )}
            
            {isLecturer && (
              <Link 
                to={`/course/${courseId}/submissions`}
                className="flex items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Review Student Submissions
              </Link>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAssessmentCreator && (
          <AssessmentCreator 
            courseId={courseId!} 
            onClose={() => setShowAssessmentCreator(false)} 
            onCreated={(a) => setAssessments([a, ...assessments])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

