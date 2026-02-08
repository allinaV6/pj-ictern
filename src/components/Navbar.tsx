import { Link } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {/* Placeholder for Logo */}
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">
          Logo
        </div>
        <div>
          <h1 className="text-xl font-bold text-blue-900">Mahidol University</h1>
          <p className="text-sm text-gray-500">Faculty of Information and Communication Technology</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6 text-gray-600 font-medium">
        <Link to="/posts" className="hover:text-blue-600">ประกาศ</Link>
        <Link to="/quiz" className="hover:text-blue-600">แบบทดสอบ</Link>
        
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Bell size={20} />
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-white">
            Test
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </nav>
  );
}
