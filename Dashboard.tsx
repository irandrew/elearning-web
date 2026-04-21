import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, GraduationCap } from 'lucide-react';

export default function RoleSelection() {
  const { updateRole, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#004A99]">Welcome to UR E-Learning</h1>
          <p className="text-gray-500 mt-2">Please select your role to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => updateRole('student')}
            className="w-full flex items-center p-4 border-2 border-gray-100 rounded-2xl hover:border-[#004A99] hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#004A99] group-hover:bg-[#004A99] group-hover:text-white transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="ml-4 text-left">
              <p className="font-bold text-[#1a1a1a]">I am a Student</p>
              <p className="text-sm text-gray-500">Access courses and learning materials</p>
            </div>
          </button>

          <button
            onClick={() => updateRole('lecturer')}
            className="w-full flex items-center p-4 border-2 border-gray-100 rounded-2xl hover:border-[#F27D26] hover:bg-orange-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-[#F27D26] group-hover:bg-[#F27D26] group-hover:text-white transition-colors">
              <UserCircle className="w-6 h-6" />
            </div>
            <div className="ml-4 text-left">
              <p className="font-bold text-[#1a1a1a]">I am a Lecturer</p>
              <p className="text-sm text-gray-500">Manage courses and lesson content</p>
            </div>
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full mt-8 text-gray-400 text-sm hover:text-gray-600 transition-colors"
        >
          Cancel and Logout
        </button>
      </div>
    </div>
  );
}
