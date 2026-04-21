import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, documentId } from 'firebase/firestore';
import CourseCard from '../components/CourseCard';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  BookOpen, 
  GraduationCap, 
  LayoutGrid, 
  X, 
  Users, 
  Clock, 
  Trophy, 
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    engagement: 0
  });

  useEffect(() => {
    if (!user || !profile) return;
    fetchData();
  }, [user, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (profile?.role === 'lecturer') {
        const q = query(collection(db, 'courses'), where('lecturerId', '==', user?.uid));
        const snap = await getDocs(q);
        const courseList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(courseList);
        
        // Fetch real stats for lecturer
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('lecturerId', '==', user?.uid)));
        const submissionsSnap = await getDocs(query(collection(db, 'submissions'), where('lecturerId', '==', user?.uid)));
        
        const submissions = submissionsSnap.docs.map(doc => doc.data());
        const pendingReviews = submissions.filter(s => s.score === undefined).length;
        const gradedSubmissions = submissions.filter(s => s.score !== undefined);
        const avgScore = gradedSubmissions.length > 0 
          ? Math.round(gradedSubmissions.reduce((acc, curr) => acc + curr.score, 0) / gradedSubmissions.length)
          : 0;

        setStats({ 
          total: courseList.length, 
          active: enrollmentsSnap.size, 
          completed: pendingReviews, 
          engagement: avgScore 
        });
      } else {
        const q = query(collection(db, 'enrollments'), where('studentId', '==', user?.uid));
        const snap = await getDocs(q);
        const enrollmentData = snap.docs.map(doc => doc.data());
        
        if (enrollmentData.length > 0) {
          const courseIds = enrollmentData.map(e => e.courseId);
          const qCourses = query(collection(db, 'courses'), where(documentId(), 'in', courseIds));
          const coursesSnap = await getDocs(qCourses);
          const courseList = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCourses(courseList);
          const avgProgress = Math.round(enrollmentData.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrollmentData.length);
          setStats({
            total: enrollmentData.length,
            active: enrollmentData.filter(e => !e.completed).length,
            completed: enrollmentData.filter(e => e.completed).length,
            engagement: avgProgress
          });
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role === 'lecturer') return <LecturerDashboard courses={courses} stats={stats} loading={loading} onNewCourse={() => setIsModalOpen(true)} modal={<CourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={fetchData} />} />;
  return <StudentDashboard courses={courses} stats={stats} loading={loading} />;
}

function LecturerDashboard({ courses, stats, loading, onNewCourse, modal }: any) {
  const { user } = useAuth();
  return (
    <div className="space-y-10 pb-20">
      {modal}
      <header className="relative rounded-[3rem] bg-white border border-gray-100 p-10 shadow-sm overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Users className="w-3 h-3" />
              <span>Lecturer Insight</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
              Hello, Professor <span className="text-[#004A99]">{user?.displayName?.split(' ')[0]}</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Manage your courses and evaluate student progress.</p>
          </div>
          <button onClick={onNewCourse} className="bg-[#004A99] text-white px-8 py-4 rounded-2xl font-bold shadow-lg flex items-center space-x-3 hover:-translate-y-1 transition-all">
            <Plus className="w-5 h-5" />
            <span>Create Course</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={BookOpen} label="Total Courses" value={stats.total} color="blue" />
        <StatCard icon={TrendingUp} label="Active Students" value="240" color="green" />
        <StatCard icon={FileText} label="Pending Reviews" value={stats.completed} color="purple" />
        <StatCard icon={TrendingUp} label="Success Rate" value={stats.engagement + '%'} color="orange" />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-900">Your Academic Catalog</h2>
        <CourseGrid courses={courses} loading={loading} />
      </div>
    </div>
  );
}

function StudentDashboard({ courses, stats, loading }: any) {
  const { user } = useAuth();
  return (
    <div className="space-y-10 pb-20">
      <header className="relative rounded-[3rem] bg-[#004A99] p-10 shadow-lg text-white overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <GraduationCap className="w-3 h-3" />
            <span>Scholar Portal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            Greetings, {user?.displayName?.split(' ')[0]}
          </h1>
          <p className="text-blue-100 mt-2 font-medium">Ready to continue your academic journey today?</p>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <GraduationCap className="w-64 h-64 rotate-12" />
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={BookOpen} label="Subjects" value={stats.total} color="white" />
        <StatCard icon={Clock} label="Learning Hours" value="42h" color="white" />
        <StatCard icon={Trophy} label="Completed" value={stats.completed} color="white" />
        <StatCard icon={TrendingUp} label="Avg Progress" value={stats.engagement + '%'} color="white" />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-900">Education Roadmap</h2>
        <CourseGrid courses={courses} loading={loading} isStudent />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "p-6 rounded-[2.5rem] border transition-all",
        color === 'white' ? "bg-white border-gray-100" : "bg-gray-50 border-transparent hover:bg-white hover:shadow-md"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
        color === 'blue' ? "bg-blue-100 text-blue-600" :
        color === 'green' ? "bg-green-100 text-green-600" :
        color === 'purple' ? "bg-purple-100 text-purple-600" :
        color === 'orange' ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-[#004A99]"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </motion.div>
  );
}

function CourseGrid({ courses, loading, isStudent }: any) {
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map(n => <div key={n} className="bg-white rounded-[2.5rem] h-80 animate-pulse border border-gray-100" />)}
    </div>
  );
  
  if (courses.length === 0) return (
    <div className="bg-white rounded-[3rem] p-16 text-center border border-gray-100">
      <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-6" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">No active courses</h3>
      <p className="text-gray-500 max-w-xs mx-auto">Explore the catalog to find your next academic challenge.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {courses.map((c: any) => <CourseCard key={c.id} course={c} />)}
    </div>
  );
}

function CourseModal({ isOpen, onClose, onCreated }: any) {
  const { user } = useAuth();
  const [course, setCourse] = useState({ title: '', code: '', description: '', category: 'Engineering' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'courses'), { ...course, lecturerId: user?.uid, createdAt: serverTimestamp() });
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
            <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl pointer-events-auto relative">
              <h2 className="text-3xl font-black text-gray-900 mb-8">Establish New Course</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input required placeholder="Academic Title" value={course.title} onChange={e => setCourse({...course, title: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Unit Code" value={course.code} onChange={e => setCourse({...course, code: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold" />
                  <select value={course.category} onChange={e => setCourse({...course, category: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold">
                    <option>Engineering</option><option>Business</option><option>Medicine</option><option>ICT</option>
                  </select>
                </div>
                <textarea required placeholder="Syllabus Overview" rows={4} value={course.description} onChange={e => setCourse({...course, description: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold" />
                <button disabled={isSaving} className="w-full bg-[#004A99] text-white py-5 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all">
                  {isSaving ? 'Establishing...' : 'Create Course'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
