import { Link } from 'react-router-dom';
import { Book, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    code: string;
    category?: string;
    thumbnail?: string;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        <img
          src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-700">
          {course.category || 'General'}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center space-x-2 text-[#004A99] mb-2 uppercase tracking-widest text-[10px] font-bold">
          <Book className="w-3 h-3" />
          <span>{course.code}</span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#004A99] transition-colors leading-tight">
          {course.title}
        </h3>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">
          {course.description}
        </p>
        
        <Link
          to={`/course/${course.id}`}
          className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-2xl group-hover:bg-[#004A99] transition-all group"
        >
          <span className="text-sm font-bold text-gray-700 group-hover:text-white">View Syllabus</span>
          <ArrowRight className="w-4 h-4 text-[#004A99] group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </motion.div>
  );
}
