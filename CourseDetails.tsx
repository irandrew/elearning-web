import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, LogOut, LayoutDashboard, Home, BookOpen, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, profile, login, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    ...(user ? [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
    { name: 'All Courses', path: '/courses', icon: BookOpen },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[#004A99] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              UR
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline">E-Learning</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2",
                  location.pathname === item.path
                    ? "bg-blue-50 text-[#004A99]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <Link 
                to="/profile"
                className="flex items-center space-x-2 p-1 pr-3 rounded-full hover:bg-gray-50 transition-colors"
              >
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-gray-200"
                  referrerPolicy="no-referrer"
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {profile?.role === 'lecturer' ? 'Lecturer' : 'Student'}
                </span>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center space-x-2 bg-[#004A99] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-800 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
