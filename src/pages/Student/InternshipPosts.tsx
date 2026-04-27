import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { Search, Heart, MapPin, Clock, Calendar, FileText, Star, X, CheckCircle, XCircle, Mail, Building2, Laptop, Blend } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatThaiDateOnly, getDaysLeftFromToday, isPostOpenByDateAndStatus } from '../../lib/postStatus';

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

const formatDateOnly = (dateString: string | undefined): string => formatThaiDateOnly(dateString);

const getDaysLeft = (dateString: string | undefined): number | null => getDaysLeftFromToday(dateString);

const getExpireTextColor = (daysLeft: number | null): string => {
  if (daysLeft === null) return 'text-gray-500';
  if (daysLeft >= 1 && daysLeft <= 3) return 'text-red-500';
  if (daysLeft >= 4 && daysLeft <= 5) return 'text-orange-500';
  return 'text-gray-500';
};

const getWorkingMethodIcon = (method: string | undefined) => {
  const value = String(method || '').trim().toLowerCase();

  if (value.includes('hybrid') || value.includes('ผสม')) {
    return Blend;
  }

  if (value.includes('online') || value.includes('remote') || value.includes('wfh') || value.includes('ออนไลน์')) {
    return Laptop;
  }

  if (
    value.includes('on-site') ||
    value.includes('onsite') ||
    value.includes('on site') ||
    value.includes('office') ||
    value.includes('เข้าออฟฟิศ')
  ) {
    return Building2;
  }

  return FileText;
};

function InternshipPosts() {
  const [posts, setPosts] = useState<InternshipPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showOpenPosts, setShowOpenPosts] = useState(true);
  const [showClosedPosts, setShowClosedPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<InternshipPostType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<string>("");
  const [selectedPosterTitle, setSelectedPosterTitle] = useState<string>("");
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
  const userId = user?.student_id || user?.admin_id || user?.user_id;
  const userRole = user?.role || (user?.student_id ? 'student' : 'admin');

  if (!userId) {
    setFavoriteIds([]); // กันค่าค้าง
    return;
  }

  const url = userRole === 'admin' 
    ? `http://localhost:5000/api/favorites/${userId}?user_type=admin`
    : `http://localhost:5000/api/favorites/${userId}`;
  
  const res = await fetch(url);
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
  const userId = user?.student_id || user?.admin_id || user?.user_id;
  const userRole = user?.role || (user?.student_id ? 'student' : 'admin');

  if (!userId) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    return;
  }

  const isFav = favoriteIds.includes(postId);

  if (isFav) {
    await fetch("http://localhost:5000/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: userId, post_id: postId, user_type: userRole })
    });
  } else {
    await fetch("http://localhost:5000/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: userId, post_id: postId, user_type: userRole })
    });
  }

  await loadFavorites(); // 🔥 สำคัญมาก (sync DB จริง)
  window.dispatchEvent(new Event("favoritesChanged"));
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
        const isOpen = isPostOpenByDateAndStatus(post);
        if (!showOpenPosts && !showClosedPosts) return false;
        if (showOpenPosts && !showClosedPosts) return isOpen;
        if (!showOpenPosts && showClosedPosts) return !isOpen;
        return true;
      })
      .filter((post) => {
        if (!showFavoritesOnly) return true;
        return favoriteIds.includes(post.post_id);
      });

    const compareStatusFirst = (a: InternshipPostType, b: InternshipPostType) => {
      const statusDiff = Number(isPostOpenByDateAndStatus(b)) - Number(isPostOpenByDateAndStatus(a));
      if (statusDiff !== 0) return statusDiff;
      return 0;
    };

    // 🔥 SORT
    if (sortType === "compensation") {
      result.sort((a, b) =>
        compareStatusFirst(a, b) ||
        Number(b.internship_compensation) - Number(a.internship_compensation)
      );
    }

    if (sortType === "compensation_asc") {
      result.sort((a, b) =>
        compareStatusFirst(a, b) ||
        Number(a.internship_compensation) - Number(b.internship_compensation)
      );
    }

    if (sortType === "duration") {
      result.sort((a, b) =>
        compareStatusFirst(a, b) ||
        Number(b.internship_duration) - Number(a.internship_duration)
      );
    }

    if (sortType === "duration_asc") {
      result.sort((a, b) =>
        compareStatusFirst(a, b) ||
        Number(a.internship_duration) - Number(b.internship_duration)
      );
    }

    if (sortType === "rating") {
      result.sort((a, b) =>
        compareStatusFirst(a, b) ||
        ((b.rating || 0) - (a.rating || 0))
      );
    }

    if (sortType === "rating_asc") {
      result.sort((a, b) =>
        compareStatusFirst(a, b) ||
        ((a.rating || 0) - (b.rating || 0))
      );
    }

    if (sortType === "nearest_expiry") {
      result.sort((a, b) =>
        compareStatusFirst(a, b) ||
        new Date(a.internship_expired_date).getTime() -
        new Date(b.internship_expired_date).getTime()
      );
    }

    if (sortType === "mou") {
      result.sort((a, b) => {
        const statusDiff = compareStatusFirst(a, b);
        if (statusDiff !== 0) return statusDiff;

        const mouDiff = Number(b.mou ?? 0) - Number(a.mou ?? 0);
        if (mouDiff !== 0) return mouDiff;

        return new Date(b.internship_create_date || 0).getTime() -
          new Date(a.internship_create_date || 0).getTime();
      });
    }

    if (!sortType) {
      result.sort((a, b) =>
        compareStatusFirst(a, b) ||
        new Date(b.internship_create_date || 0).getTime() -
        new Date(a.internship_create_date || 0).getTime()
      );
    }

    return result;
  }, [posts, searchTerm, showFavoritesOnly, favoriteIds, sortType, showOpenPosts, showClosedPosts]);

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
          <button
            onClick={() => navigate('/quiz')}
            className="mt-4 px-5 py-2 bg-white text-blue-900 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            เริ่มทำแบบประเมินความสนใจในสายอาชีพ
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        
        {/* Count and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-lg font-medium text-gray-700">
            <span className="font-bold">{filteredPosts.length}</span> โพสต์ประกาศงานแนะนำสำหรับคุณ
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

            <div className="flex flex-col justify-between gap-2 text-sm text-gray-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOpenPosts}
                  onChange={(e) => setShowOpenPosts(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                โพสต์เปิดอยู่
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showClosedPosts}
                  onChange={(e) => setShowClosedPosts(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                โพสต์ปิดแล้ว
              </label>
            </div>

            {/* 🔥 SORT */}
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700"
            > 
              <option value="">เรียงตาม</option>
              <option value="compensation">ค่าตอบแทนสูงสุด</option>
              <option value="compensation_asc">ค่าตอบแทนต่ำสุด</option>
              <option value="duration">ระยะเวลานานที่สุด</option>
              <option value="duration_asc">ระยะเวลาสั้นที่สุด</option>
              <option value="rating">คะแนนรีวิวสูงสุด</option>
              <option value="rating_asc">คะแนนรีวิวต่ำสุด</option>
              <option value="nearest_expiry">ใกล้ปิดรับสมัครที่สุด</option>
              <option value="mou">MOU ก่อน</option>
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
            const isOpen = isPostOpenByDateAndStatus(post);
            const daysLeft = getDaysLeft(post.internship_expired_date);
            const expireTextColorClass = getExpireTextColor(daysLeft);
            const WorkingMethodIcon = getWorkingMethodIcon(post.internship_working_method);

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
                  <div className={`flex items-center gap-1 text-sm font-bold ${(post.review_count ?? 0) > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                    <Star size={14} fill="currentColor" className="fill-current" /> {Number(post.rating ?? 0).toFixed(1)}
                    <span className="font-normal ml-1 text-current">
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
                  <div className={`flex items-center gap-2 text-[15px] ${expireTextColorClass}`}>
                    <Calendar size={16} className="text-gray-400" />
                    วันที่ปิดรับสมัคร {formatDateOnly(post.internship_expired_date)}
                  </div>
                  <div className="flex items-center gap-2 text-[15px] text-gray-600">
                    <WorkingMethodIcon size={16} className="text-gray-400" />
                    {post.internship_working_method}
                  </div>
                  {post.internship_poster && (
                    <button 
                      onClick={() => {
                        setSelectedPoster(post.internship_poster!);
                        setSelectedPosterTitle(post.internship_title || 'ไม่ระบุชื่อประกาศ');
                        setIsPosterModalOpen(true);
                      }}
                      className="text-[15px] text-gray-800 font-bold underline text-left flex items-center gap-1 hover:text-blue-700 transition-colors"
                    >
                      <FileText size={14} />
                      แสดงโปสเตอร์
                    </button>
                  )}
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
                const isOpen = isPostOpenByDateAndStatus(selectedPost);
                const SelectedWorkingMethodIcon = getWorkingMethodIcon(selectedPost.internship_working_method);
                return (
                  <>
                    {/* Header Info */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-blue-900">{selectedPost.internship_title}</h2>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(selectedPost.post_id)}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                          title={favoriteIds.includes(selectedPost.post_id) ? 'ยกเลิกบันทึกโพสต์' : 'บันทึกโพสต์'}
                        >
                          <Heart
                            size={18}
                            className={favoriteIds.includes(selectedPost.post_id) ? 'text-red-500' : 'text-gray-400'}
                            fill={favoriteIds.includes(selectedPost.post_id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 font-medium">{selectedPost.company_name}</span>
                        <div className={`flex items-center gap-1 font-bold ${selectedPost?.review_count ? 'text-yellow-500' : 'text-gray-400'}`}>
                          <Star size={16} fill="currentColor" className="fill-current" /> {Number(selectedPost?.rating ?? 0).toFixed(1)}
                          <span className="font-normal ml-1 text-current">
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
                        <SelectedWorkingMethodIcon size={16} />
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
                        วันที่เปิดรับสมัคร: {formatDateOnly(selectedPost.internship_create_date)}
                      </div>
                      <div className="flex items-center gap-1.5 text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <Calendar size={16} />
                        วันที่ปิดรับสมัคร: {formatDateOnly(selectedPost.internship_expired_date)}
                      </div>
                      {selectedPost.internship_poster && (
                        <button 
                          onClick={() => {
                            setSelectedPoster(selectedPost.internship_poster!);
                            setSelectedPosterTitle(selectedPost.internship_title || 'ไม่ระบุชื่อประกาศ');
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
              {(() => {
                const isOpen = isPostOpenByDateAndStatus(selectedPost);
                return (
                  <>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  navigate(`/company/${selectedPost.company_id}`);
                }}
                className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                ดูข้อมูลบริษัท
              </button>
              <button 
                onClick={() => {
                  if (!isOpen) return;
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
                    alert('ไม่มีข้อมูลช่องทางการสมัครงาน');
                  }
                }}
                disabled={!isOpen}
                className={`px-10 py-3 text-white font-bold rounded-xl transition-colors shadow-sm ${
                  isOpen
                    ? 'bg-[#1a3a8a] hover:bg-blue-800'
                    : 'bg-gray-400 cursor-not-allowed opacity-70'
                }`}
              >
                {isOpen ? 'สมัครงาน' : 'ปิดรับสมัคร'}
              </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Poster Pop-up Modal */}
      {isPosterModalOpen && selectedPoster && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsPosterModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-[760px] rounded-[18px] border-[6px] border-white bg-[#f8f8f8] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-white/95">
              <h3 className="text-lg md:text-xl font-bold text-blue-900 truncate">
                โปสเตอร์รับสมัครงาน: {selectedPosterTitle || 'ไม่ระบุชื่อประกาศ'}
              </h3>
            </div>
            <button 
              onClick={() => setIsPosterModalOpen(false)}
              className="absolute right-4 top-4 w-12 h-12 flex items-center justify-center text-white bg-gray-500/90 hover:bg-gray-600 z-10 rounded-full transition-all"
              aria-label="ปิดหน้าต่าง"
            >
              <X size={28} />
            </button>
            <div className="overflow-auto p-4 md:p-6 bg-[#f8f8f8]">
              <img 
                src={selectedPoster.startsWith('/') ? `http://localhost:5000${selectedPoster}` : selectedPoster} 
                alt="Internship Poster" 
                className="w-full max-h-[72vh] object-contain rounded-md bg-white shadow-md"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">ช่องทางการสมัครงาน</h3>
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
