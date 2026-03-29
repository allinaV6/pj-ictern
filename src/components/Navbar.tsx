import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAdminSite = location.pathname.startsWith('/admin');
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role || "";
  const normalizedUserRole = String(userRole).trim().toLowerCase();

  const isAdminRole = normalizedUserRole === "admin";

  const getAdminDefaultRoute = () => {
    return normalizedUserRole === "admin" ? "/admin/dashboard" : "/posts";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500">
            Logo
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Mahidol University</h1>
            <p className="text-base text-gray-500">Faculty of Information and Communication Technology</p>
          </div>
        </div>
        
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
          
          <div className="relative">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-white">
                DS
              </div>
              <ChevronDown size={16} />
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                {isAdminRole && (
                  <button 
                    className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-100 font-bold"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (isOnAdminSite) {
                        navigate('/posts');
                      } else {
                        navigate(getAdminDefaultRoute());
                      }
                    }}
                  >
                    {isOnAdminSite ? 'Back to User Site' : 'Admin Site'}
                  </button>
                )}
                <button 
                  className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-100"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/setting');
                  }}
                >
                  Setting
                </button>
                <button 
                  className="block w-full text-left px-4 py-3 text-base text-red-600 hover:bg-red-50 transition-colors"
                  onClick={handleLogout}
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
