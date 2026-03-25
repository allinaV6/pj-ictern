import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAdminSite = location.pathname.startsWith('/admin');

  // ✅ ดึง user
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // ✅ เช็ค role
  const isAdminUser = user?.role === "admin";

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500">
            Logo
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Mahidol University</h1>
            <p className="text-base text-gray-500">Faculty of ICT</p>
          </div>
        </div>
        
        {/* Menu */}
        <div className="flex items-center gap-6 text-gray-700 font-medium text-base">
          
          {!isAdmin && (
            <>
              <Link to="/posts" className="hover:text-blue-600">ประกาศ</Link>
              <Link to="/quiz" className="hover:text-blue-600">แบบทดสอบ</Link>
            </>
          )}
          
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Bell size={20} />
          </button>
          
          {/* Profile */}
          <div className="relative">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {user?.student_name?.charAt(0) || "U"}
              </div>
              <ChevronDown size={16} />
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">

                {/* ✅ ADMIN MENU (เฉพาะ admin เท่านั้น) */}
                {isAdminUser && (
                  <button 
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-100"
                    onClick={() => isOnAdminSite ? navigate('/posts') : navigate('/admin/dashboard')}
                  >
                    {isOnAdminSite ? 'Back to user site' : 'Admin Dashboard'}
                  </button>
                )}

                {/* Setting */}
                <button 
                  className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-100"
                  onClick={() => navigate('/setting')}
                >
                  Setting
                </button>

                {/* Logout */}
                <button 
                  className="block w-full text-left px-4 py-3 text-base text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    localStorage.removeItem("user"); // ✅ clear session
                    navigate("/");
                  }}
                >
                  ออกจากระบบ
                </button>

              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}