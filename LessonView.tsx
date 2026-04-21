import { useEffect, useState } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CourseCard from '../components/CourseCard';
import { motion } from 'motion/react';
import { Search, GraduationCap, Users, Clock, Book } from 'lucide-react';

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), limit(12));
        const querySnapshot = await getDocs(q);
        const fetchedCourses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(fetchedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-[2.5rem] bg-[#004A99] overflow-hidden p-8 md:p-16 text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-2xl"
        >
          <div className="inline-flex items-center space-x-2 bg-blue-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <GraduationCap className="w-4 h-4" />
            <span>Empowering Your Future</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            E-Learning Redefined for the University of Rwanda
          </h1>
          <p className="text-lg text-blue-100 mb-8 max-w-lg">
            Access world-class educational resources, collaborate with lecturers, and accelerate your learning journey with our AI-powered platform.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <Users className="w-5 h-5 text-blue-300" />
              <span className="text-sm font-medium">10,000+ Students</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <Clock className="w-5 h-5 text-blue-300" />
              <span className="text-sm font-medium">24/7 Learning</span>
            </div>
          </div>
        </motion.div>
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-64 h-64 border-8 border-white rounded-full translate-x-1/2" />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 border-4 border-white rotate-45" />
        </div>
      </section>

      {/* Course Search & Filter */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Explore Courses</h2>
            <p className="text-gray-500 mt-1">Browse our wide range of academic programs and specializations.</p>
          </div>
          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#004A99] transition-colors" />
            <input 
              type="text" 
              placeholder="Search for courses..." 
              className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#004A99] transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-3xl h-80 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Book className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No courses available yet</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">We're currently preparing the academic catalog. Please check back later.</p>
          </div>
        )}
      </section>
    </div>
  );
}
