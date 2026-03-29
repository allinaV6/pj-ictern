import Navbar from '../components/Navbar';
import { User, CheckSquare } from 'lucide-react';
import { useState } from 'react';

export default function Setting() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Navbar />
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 top-[80px]" // top-[80px] to start below navbar
      >
        {/* Overlay to ensure text readability if needed, though design seems to have a clean card */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex justify-center pt-20 px-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-3">
            <User className="text-blue-900" size={24} />
            <h1 className="text-2xl font-bold text-blue-900">Profile</h1>
          </div>

          {/* Card Content */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-blue-900 font-bold mb-1 text-lg">Name</h2>
              <p className="text-gray-700 uppercase text-base">Mr Testing Data</p>
              <p className="text-gray-600 text-base">มิสเตอ เทสติ้ง ดาต้า</p>
            </div>

            <div className="mb-8">
              <h2 className="text-blue-900 font-bold mb-1 text-lg">Program</h2>
              <p className="text-gray-700 text-base">Bachelor of Science in Digital Science and Technology</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-blue-900 font-bold mb-4 text-lg">ตั้งค่าการแจ้งเตือน</h2>
              
              <div 
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${notificationsEnabled ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                  {notificationsEnabled && <CheckSquare size={16} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-gray-700 text-base">รับการแจ้งเตือนโพสต์ประกาศการฝึกงาน</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
