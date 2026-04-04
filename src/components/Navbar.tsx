import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, MapPin, Clock, Calendar, FileText, X, CheckCircle, XCircle, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

const renderCompensation = (value: string | number | undefined | null): string => {
  if (!value || value === '' || value === 'N/A') return 'N/A';
  const str = String(value);
  const numPart = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(numPart);
  if (isNaN(num)) return 'N/A';
  
  const formattedNum = num.toLocaleString('th-TH');
  const unit = str.includes('ต่อวัน') ? 'บาท/วัน' : 'บาท/เดือน';
  return `฿ ${formattedNum} ${unit}`;
};

const formatDateOnly = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('th-TH');
};

export default function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isOnAdminSite = location.pathname.startsWith('/admin');
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const roleStr = localStorage.getItem("role") || user?.role || "";
  const normalizedUserRole = String(roleStr).trim().toLowerCase();

  const isAdminRole = normalizedUserRole.includes("admin");

  const getAdminDefaultRoute = () => {
    return isAdminRole ? "/admin/dashboard" : "/posts";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/");
  };

  // 🔥 โหลด notification
  const loadNotifications = async () => {
    if (isAdminRole) {
      // Admin: โหลดประกาศที่ใกล้หมดอายุ
      try {
        const res = await fetch(`http://localhost:5000/api/admin/notifications`);
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("โหลด admin notification ไม่สำเร็จ", err);
      }
    } else {
      // Student: โหลด favorite ที่ใกล้หมดอายุ
      const studentId = user?.student_id;
      if (!studentId) return;

      try {
        const notificationsEnabled = localStorage.getItem("notificationsEnabled") === 'true';
        const res = await fetch(`http://localhost:5000/api/notifications/${studentId}?enabled=${notificationsEnabled}`);
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("โหลด notification ไม่สำเร็จ", err);
      }
    }
  };

  // 🔥 โหลดตอนเปิดหน้า
  useEffect(() => {
    loadNotifications();
  }, []);

  // 🔥 โหลด post detail เมื่อเลือก
  useEffect(() => {
    if (selectedPostId) {
      setLoadingPost(true);
      fetch(`http://localhost:5000/api/posts/detail/${selectedPostId}`)
        .then((res) => res.json())
        .then((data) => {
          setSelectedPost(data);
          setLoadingPost(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingPost(false);
        });
    } else {
      setSelectedPost(null);
    }
  }, [selectedPostId]);

  return (
    <>
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
          
          {/* 🔔 Notification */}
          <div className="relative">
            <button 
              className="p-2 hover:bg-gray-100 rounded-full relative"
              onClick={() => {
                setIsDropdownOpen(false);
                loadNotifications();
                setShowNotif(prev => !prev);
              }}
            >
              <Bell size={20} />

              {/* 🔴 badge */}
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* 🔔 Popup */}
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-50">
                <h3 className="font-bold mb-2">การแจ้งเตือน</h3>

                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm">ไม่มีแจ้งเตือน</p>
                ) : (
                  notifications.map((n, index) => (
                    <div 
                      key={index} 
                      className="mb-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setShowNotif(false);
                        setSelectedPostId(n.post_id);
                      }}
                    >
                      <p className="text-sm font-medium">{n.internship_title}</p>
                      <p className="text-xs text-red-500">
                        เหลือ {n.daysLeft} วันก่อนหมดเขต
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Profile */}
          <div className="relative">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
              onClick={() => {
                setShowNotif(false);
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-white uppercase">
                {(user?.student_name || user?.username || "U").charAt(0)}
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

                {/* Logout */}
                <button 
                  className="block w-full text-left px-4 py-3 text-base text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleLogout();
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

    {/* 🔥 Modal for Post Detail */}
    {selectedPostId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedPostId(null)}
        ></div>
        <div 
          className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => setSelectedPostId(null)}
            className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 z-10 p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={24} />
          </button>

          <div className="overflow-y-auto p-8 pt-10">
            {loadingPost ? (
              <div className="text-center">กำลังโหลดข้อมูล...</div>
            ) : selectedPost ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-1">{selectedPost.internship_title}</h2>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600 font-medium">{selectedPost.company_name}</span>
                    <div className={`flex items-center gap-1 font-bold ${selectedPost?.review_count ? 'text-yellow-500' : 'text-gray-400'}`}>
                      <Star size={16} fill="currentColor" className="fill-current" /> {(selectedPost?.rating ?? 0).toFixed(1)}
                      <span className="text-gray-400 font-normal ml-1">({selectedPost?.review_count ?? 0} Reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-8 text-[15px]">
                  <div className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg border ${selectedPost.internship_status === 1 ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                    {selectedPost.internship_status === 1 ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {selectedPost.internship_status === 1 ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <FileText size={16} />
                    {selectedPost.internship_working_method || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <MapPin size={16} className="text-red-500" />
                    {selectedPost.internship_location || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Clock size={16} />
                    <span className="text-green-600 font-bold">{renderCompensation(selectedPost.internship_compensation)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Calendar size={16} />
                    วันเปิดรับสมัคร: {formatDateOnly(selectedPost.internship_create_date)}
                  </div>
                  <div className="flex items-center gap-1.5 text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                    <Calendar size={16} />
                    วันปิดรับสมัคร: {formatDateOnly(selectedPost.internship_expired_date)}
                  </div>
                  {selectedPost.internship_poster && (
                    <button 
                      onClick={() => {
                        window.open(selectedPost.internship_poster.startsWith('/') ? `http://localhost:5000${selectedPost.internship_poster}` : selectedPost.internship_poster, '_blank');
                      }}
                      className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 font-bold hover:bg-blue-100 transition-colors"
                    >
                      <FileText size={16} />
                      ดูโปสเตอร์ประชาสัมพันธ์
                    </button>
                  )}
                </div>

                <div className="h-[1.5px] bg-gray-300 w-full mb-8 opacity-80"></div>

                <div className="space-y-8 pb-4">
                  <section>
                    <h3 className="text-lg font-bold text-blue-900 mb-3">รายละเอียดงาน</h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">{selectedPost.internship_description || 'ไม่มีข้อมูล'}</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-blue-900 mb-3">หน้าที่และความรับผิดชอบ</h3>
                    <div className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-line">
                      {selectedPost.internship_responsibilities ? selectedPost.internship_responsibilities.split('\n').map((line: string, i: number) => (
                        <div key={i} className="flex gap-2 mb-1">
                          <span className="text-blue-900">•</span>
                          <span>{line}</span>
                        </div>
                      )) : 'ไม่มีข้อมูล'}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-blue-900 mb-3">คุณสมบัติที่ต้องการ</h3>
                    <div className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-line">
                      {selectedPost.internship_requirements ? selectedPost.internship_requirements.split('\n').map((line: string, i: number) => (
                        <div key={i} className="flex gap-2 mb-1">
                          <span className="text-blue-900">•</span>
                          <span>{line}</span>
                        </div>
                      )) : 'ไม่มีข้อมูล'}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <div className="text-center">ไม่พบข้อมูลโพสต์</div>
            )}
          </div>

          {selectedPost && (
            <div className="p-8 pt-4 flex justify-center gap-4">
              <button 
                onClick={() => {
                  setSelectedPostId(null);
                  navigate(`/company/${selectedPost.company_id}`);
                }}
                className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                ดูรายละเอียดบริษัท
              </button>
              <button 
                onClick={() => {
                  const applyType = selectedPost.internship_apply_type;
                  const applyLink = selectedPost.internship_link || '';
                  if (applyType === 'email' || applyLink.includes('@')) {
                    window.location.href = `mailto:${applyLink}`;
                  } else if (applyLink) {
                    const finalLink = applyLink.startsWith('http') ? applyLink : `https://${applyLink}`;
                    window.open(finalLink, '_blank');
                  } else {
                    alert('ไม่มีข้อมูลการสมัครงาน');
                  }
                }}
                className="px-10 py-3 bg-[#1a3a8a] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
              >
                สมัครงาน
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}