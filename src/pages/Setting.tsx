import Navbar from '../components/Navbar';
import { User, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Setting() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // 🔥 โหลด user จาก localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      // ❗ ถ้าไม่ login → กลับหน้า login
      navigate("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
  }, []);

  // 🔥 โหลดสถานะการแจ้งเตือนจาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("notificationsEnabled");
    if (saved !== null) {
      setNotificationsEnabled(JSON.parse(saved));
    }
  }, []);

  // 🔥 เซฟสถานะเมื่อเปลี่ยน
  const handleNotificationChange = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem("notificationsEnabled", JSON.stringify(newState));
  };

  // 🔥 Map major abbreviation เป็นชื่อเต็ม
  const getMajorFullName = (major: string): string => {
    const majorMap: { [key: string]: string } = {
      'ICT': 'Information and Communication Technology(ICT)',
      'DST': 'Digital Science and Technology(DST)'
    };
    return majorMap[major?.toUpperCase()] || major || '-';
  };

  // 🔥 ตรวจสอบว่าเป็น admin หรือ student
  const isAdmin = !!user?.admin_id;
  const userName = isAdmin ? user?.admin_name : user?.student_name;
  const userProgram = isAdmin ? 'Admin' : getMajorFullName(user?.student_major);

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Navbar />

      {/* Background */}
      <div className="absolute inset-0 z-0 top-[80px]">
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex justify-center pt-20 px-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-3">
            <User className="text-blue-900" size={24} />
            <h1 className="text-2xl font-bold text-blue-900">Profile</h1>
          </div>

          {/* Content */}
          <div className="p-8">

            {/* Name */}
            <div className="mb-6">
              <h2 className="text-blue-900 font-bold mb-1 text-lg">Name</h2>
              <p className="text-gray-700 uppercase text-base">
                {userName || "-"}
              </p>
            </div>

            {/* Program */}
            <div className="mb-8">
              <h2 className="text-blue-900 font-bold mb-1 text-lg">Program</h2>
              <p className="text-gray-700 text-base">
                {userProgram}
              </p>
            </div>

            {/* Notification */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-blue-900 font-bold mb-4 text-lg">
                ตั้งค่าการแจ้งเตือน
              </h2>

              <div
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={handleNotificationChange}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  notificationsEnabled
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 bg-white'
                }`}>
                  {notificationsEnabled && (
                    <CheckSquare size={16} className="text-white" strokeWidth={3} />
                  )}
                </div>

                <span className="text-gray-700 text-base">
                  รับการแจ้งเตือนโพสต์ประกาศการฝึกงาน
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
