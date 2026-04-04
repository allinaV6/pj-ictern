import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { Search, Heart, MapPin, Clock, Calendar, FileText, Star, X, CheckCircle, XCircle, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface InternshipPostType {
  post_id: number;
  company_id: number;
  company_name: string;
  internship_title: string;
  mou?: number;
  internship_status?: number;
  internship_location: string;
  internship_duration: string | number;
  internship_description: string;
  internship_responsibilities: string;
  internship_requirements: string;
  internship_compensation: string;
  internship_working_method: string;
  internship_link?: string;
  internship_apply_type?: string;
  internship_poster?: string;
  internship_create_date?: string;
  internship_expired_date: string;
  rating?: number;
  review_count?: number;
}

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

function InternshipPosts() {
  const [posts, setPosts] = useState<InternshipPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedPost, setSelectedPost] = useState<InternshipPostType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<string>("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const navigate = useNavigate();
  const [sortType, setSortType] = useState("");
  const [searchParams] = useSearchParams();

  // 🔥 อ่าน search parameter จาก URL
  useEffect(() => {
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

 useEffect(() => {
    console.log("Fetching posts from http://localhost:5000/api/posts...");
    fetch("http://localhost:5000/api/posts")
      .then((res) => {
        if (!res.ok) {
          console.error("Fetch error, status:", res.status);
          throw new Error("Server error");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched data:", data);
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.warn("Fetched data is not an array:", data);
          setPosts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch failed:", err);
        setError("ไม่สามารถโหลดข้อมูลได้: " + err.message);
        setLoading(false);
      });
  }, []);

// 🔥 function โหลด favorite
const loadFavorites = async () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const studentId = user?.student_id;

  if (!studentId) {
    setFavoriteIds([]); // กันค่าค้าง
    return;
  }

  const res = await fetch(`http://localhost:5000/api/favorites/${studentId}`);
  const data = await res.json();

  const ids = data.map((f: any) => f.post_id);
  setFavoriteIds(ids);
};

// 🔥 useEffect
useEffect(() => {
  loadFavorites();
}, []);

// 🔥 toggle favorite
const toggleFavorite = async (postId: number) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const studentId = user?.student_id;

  if (!studentId) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    return;
  }

  const isFav = favoriteIds.includes(postId);

  if (isFav) {
    await fetch("http://localhost:5000/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, post_id: postId })
    });
  } else {
    await fetch("http://localhost:5000/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, post_id: postId })
    });
  }

  await loadFavorites(); // 🔥 สำคัญมาก (sync DB จริง)
};

  const filteredPosts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    let result = posts
      .filter((post) => {
        if (!keyword) return true;

        const text = `
          ${post.internship_title}
          ${post.company_name}
          ${post.internship_location}
          ${post.internship_description}
        `.toLowerCase();

        return text.includes(keyword);
      })
      .filter((post) => {
        if (!showFavoritesOnly) return true;
        return favoriteIds.includes(post.post_id);
      });

    // 🔥 SORT
    if (sortType === "compensation") {
      result.sort((a, b) =>
        Number(b.internship_compensation) - Number(a.internship_compensation)
      );
    }

    if (sortType === "duration") {
      result.sort((a, b) =>
        Number(b.internship_duration) - Number(a.internship_duration)
      );
    }

    if (sortType === "date") {
      result.sort(
        (a, b) =>
          new Date(b.internship_expired_date).getTime() -
          new Date(a.internship_expired_date).getTime()
      );
    }

    if (sortType === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [posts, searchTerm, showFavoritesOnly, favoriteIds, sortType]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <div className="bg-blue-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">
            ค้นหาตำแหน่งฝึกงานที่เหมาะกับคุณ
          </h1>
          <p className="text-blue-100 text-lg">
            แนะนำตำแหน่งฝึกงานที่ตรงกับความสนใจของคุณ
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        
        {/* Count and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-lg font-medium text-gray-700">
            <span className="font-bold">{filteredPosts.length}</span> ตำแหน่งงานแนะนำสำหรับคุณ
          </h2>

          <div className="flex gap-4">
            <div className="relative flex-grow min-w-[300px]">
              <input
                type="text"
                placeholder="ค้นหาตำแหน่งฝึกงาน"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>

            {/* 🔥 SORT */}
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700"
            >
              <option value="">เรียงตาม</option>
              <option value="compensation">💰 เงินมากสุด</option>
              <option value="duration">⏳ ระยะเวลามากสุด</option>
              <option value="rating">⭐ rating สูงสุด</option>
              <option value="date">📅 ล่าสุด</option>
            </select>

            {/* ❤️ favorite */}
            <button
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`px-5 py-2.5 border rounded-lg flex items-center gap-2 ${showFavoritesOnly ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              <Heart size={18} fill={showFavoritesOnly ? "currentColor" : "none"} />
              รายการโปรด
            </button>

          </div>
        </div>

        {loading && <p className="text-center py-10">กำลังโหลดข้อมูล...</p>}
        {error && <p className="text-center py-10 text-red-500">{error}</p>}

        {!loading && !error && filteredPosts.length === 0 && (
          <p className="text-center py-10 text-gray-500">ไม่พบข้อมูล</p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredPosts.map((post) => {
            const isFavorite = favoriteIds.includes(post.post_id);
            const statusValue = Number(post.internship_status ?? 1);
            const isOpen = statusValue === 1;

            return (
              <div
                key={post.post_id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-grow">
                    <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                      {post.internship_title}
                      {post.mou === 1 && (
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 text-[10px] font-bold tracking-wider shadow-sm">
                          <Star size={10} className="fill-current" />
                          MOU
                        </div>
                      )}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {post.company_name}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleFavorite(post.post_id)}
                    className="p-1.5 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <Heart
                      size={22}
                      className={`${isFavorite ? 'text-red-500' : 'text-blue-900'} transition-transform duration-150 active:scale-125`}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-gray-400 text-sm font-bold">
                    ⭐ {(post.rating ?? 0).toFixed(1)}
                    <span className="text-gray-300 font-normal ml-1">
                      ({post.review_count ?? 0} Reviews)
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-[15px] font-medium ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isOpen ? 'border-green-600' : 'border-red-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                    {isOpen ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                  </div>
                </div>

                <p className="text-gray-600 text-[15px] leading-relaxed line-clamp-3 mb-6">
                  {post.internship_description}
                </p>

                <div className="grid grid-cols-2 gap-y-3 mb-6">
                  <div className="flex items-center gap-2 text-[15px] text-gray-600">
                    <MapPin size={16} className="text-red-500" />
                    {post.internship_location}
                  </div>
                  <div className="flex items-center gap-2 text-[15px] text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    ฝึกงาน {post.internship_duration} เดือน
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold text-[14px]">
                      {renderCompensation(post.internship_compensation)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[15px] text-gray-500">
                    <Calendar size={16} className="text-gray-400" />
                    วันที่ปิดรับสมัคร: {new Date(post.internship_expired_date).toLocaleDateString('th-TH')}
                  </div>
                  <div className="flex items-center gap-2 text-[15px] text-gray-600">
                    <FileText size={16} className="text-gray-400" />
                    {post.internship_working_method}
                  </div>
                  <button 
                    onClick={() => {
                      if (post.internship_poster) {
                        setSelectedPoster(post.internship_poster);
                        setIsPosterModalOpen(true);
                      } else {
                        alert("ยังไม่มีรูปโปสเตอร์สำหรับโพสต์นี้");
                      }
                    }}
                    className="text-[15px] text-gray-800 font-bold underline text-left flex items-center gap-1 hover:text-blue-700 transition-colors"
                  >
                    <FileText size={14} />
                    แสดงโปสเตอร์
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedPost(post);
                    setIsModalOpen(true);
                  }}
                  className="mt-auto w-full py-3 bg-[#1a3a8a] text-white text-center rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-sm"
                >
                  ดูรายละเอียด
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Detail Pop-up */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col">
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 z-10 p-2 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={24} />
            </button>

            <div className="overflow-y-auto p-8 pt-10">
              {(() => {
                const isOpen = (selectedPost.internship_status ?? 1) === 1;
                return (
                  <>
                    {/* Header Info */}
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-blue-900 mb-1">{selectedPost.internship_title}</h2>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 font-medium">{selectedPost.company_name}</span>
                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                          ⭐ {(selectedPost?.rating ?? 0).toFixed(1)}
                          <span className="text-gray-400 font-normal ml-1">
                            ({selectedPost?.review_count ?? 0} Reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badges/Tags Row */}
                    <div className="flex flex-wrap gap-4 mb-8 text-[15px]">
                      <div className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg border ${isOpen ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                        {isOpen ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {isOpen ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <FileText size={16} />
                        {selectedPost.internship_working_method}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <MapPin size={16} className="text-red-500" />
                        {selectedPost.internship_location}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Clock size={16} />
                        <span className="text-green-600 font-bold">
                          {renderCompensation(selectedPost.internship_compensation)}
                        </span>
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
                            setSelectedPoster(selectedPost.internship_poster!);
                            setIsPosterModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 font-bold hover:bg-blue-100 transition-colors"
                        >
                          <FileText size={16} />
                          ดูโปสเตอร์ประชาสัมพันธ์
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Separator Line (Top) */}
              <div className="h-[1.5px] bg-gray-300 w-full mb-8 opacity-80"></div>

              {/* Main Content Sections */}
              <div className="space-y-8 pb-4">
                {/* Description */}
                <section>
                  <h3 className="text-lg font-bold text-blue-900 mb-3">รายละเอียดงาน</h3>
                  <p className="text-gray-600 text-[15px] leading-relaxed">
                    {selectedPost.internship_description}
                  </p>
                </section>

                {/* Responsibilities */}
                <section>
                  <h3 className="text-lg font-bold text-blue-900 mb-3">หน้าที่และความรับผิดชอบ</h3>
                  <div className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-line">
                    {selectedPost.internship_responsibilities ? selectedPost.internship_responsibilities.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-2 mb-1">
                        <span className="text-blue-900">•</span>
                        <span>{line}</span>
                      </div>
                    )) : 'ไม่มีข้อมูล'}
                  </div>
                </section>

                {/* Requirements */}
                <section>
                  <h3 className="text-lg font-bold text-blue-900 mb-3">คุณสมบัติที่ต้องการ</h3>
                  <div className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-line">
                    {selectedPost.internship_requirements ? selectedPost.internship_requirements.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-2 mb-1">
                        <span className="text-blue-900">•</span>
                        <span>{line}</span>
                      </div>
                    )) : 'ไม่มีข้อมูล'}
                  </div>
                </section>
              </div>

              {/* Separator Line (Bottom) */}
              <div className="h-[1.5px] bg-gray-300 w-full mt-6 mb-2 opacity-80"></div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 pt-4 flex justify-center gap-4">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
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
                  
                  // Check if it's explicitly 'email' OR looks like an email address
                  if (applyType === 'email' || applyLink.includes('@')) {
                    setSelectedEmail(applyLink);
                    setIsEmailModalOpen(true);
                  } else if (applyLink) {
                    // Make sure link has protocol
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
          </div>
        </div>
      )}

      {/* Poster Pop-up Modal */}
      {isPosterModalOpen && selectedPoster && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsPosterModalOpen(false)}
          ></div>
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl bg-white">
            <button 
              onClick={() => setIsPosterModalOpen(false)}
              className="absolute right-4 top-4 text-white bg-black/50 hover:bg-black/70 z-10 p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            <div className="overflow-auto p-2">
              <img 
                src={selectedPoster.startsWith('/') ? `http://localhost:5000${selectedPoster}` : selectedPoster} 
                alt="Internship Poster" 
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Email Application Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEmailModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">ติดต่อสมัครงาน</h3>
            <p className="text-gray-600 mb-6">
              กรุณาส่ง Resume หรือเอกสารประกอบการสมัครงานไปที่อีเมลด้านล่างนี้:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 select-all cursor-pointer group hover:bg-gray-100 transition-colors">
              <span className="text-blue-700 font-bold text-lg break-all">
                {selectedEmail || 'ไม่ระบุอีเมล'}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  window.location.href = `mailto:${selectedEmail}`;
                }}
                className="w-full py-3 bg-[#1a3a8a] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
              >
                เปิดแอปอีเมล
              </button>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InternshipPosts;
