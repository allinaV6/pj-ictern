import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { Search, Heart, MapPin, Clock, Calendar, FileText, Info, Star, X, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface InternshipPostType {
  post_id: number;
  company_id: number;
  internship_title: string;
  company_name: string;
  internship_location: string;
  internship_duration: string | number;
  internship_description: string;
  internship_responsibilities: string;
  internship_requirements: string;
  internship_compensation: string;
  internship_working_method: string;
  internship_link?: string;
  internship_expired_date: string;
  company_name: string;
}

function InternshipPosts() {
  const [posts, setPosts] = useState<InternshipPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedPost, setSelectedPost] = useState<InternshipPostType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Fetching posts from http://localhost:5001/api/posts...");
    fetch("http://localhost:5001/api/posts")
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

  const toggleFavorite = (id: number) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const filteredPosts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return posts
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
  }, [posts, searchTerm, showFavoritesOnly, favoriteIds]);

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

            <button
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`px-5 py-2.5 border rounded-lg flex items-center gap-2 transition ${
                showFavoritesOnly
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
              }`}
            >
              <Heart
                size={16}
                className={`${showFavoritesOnly ? 'text-white' : 'text-gray-700'}`}
                fill={showFavoritesOnly ? "currentColor" : "none"}
              />
              รายการโปรด
            </button>
          </div>
        </div>

        {loading && <p className="text-center py-10">กำลังโหลดข้อมูล...</p>}
        {error && <p className="text-center py-10 text-red-500">{error}</p>}

        {!loading && !error && filteredPosts.length === 0 && (
          <p className="text-center py-10 text-gray-500">ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredPosts.map((post) => {
            const isFavorite = favoriteIds.includes(post.post_id);

            return (
              <div
                key={post.post_id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-grow">
                    <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                      {post.internship_title}
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 text-[10px] font-bold tracking-wider shadow-sm">
                        <Star size={10} className="fill-current" />
                        MOU
                      </div>
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
                    ★ 0.0 <span className="text-gray-300 font-normal ml-1">(0 Reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-[13px] font-medium">
                    <div className="w-4 h-4 rounded-full border-2 border-green-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                    </div>
                    เปิดรับสมัคร
                  </div>
                </div>

                <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-3 mb-6">
                  {post.internship_description}
                </p>

                <div className="grid grid-cols-2 gap-y-3 mb-6">
                  <div className="flex items-center gap-2 text-[13px] text-gray-600">
                    <MapPin size={16} className="text-red-500" />
                    {post.internship_location}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    ฝึกงาน {post.internship_duration} เดือนขึ้นไป
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-green-600 font-semibold">
                    ฿ {post.internship_compensation}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Calendar size={16} className="text-gray-400" />
                    ประกาศเมื่อ: {post.internship_expired_date}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-600">
                    <FileText size={16} className="text-gray-400" />
                    {post.internship_working_method}
                  </div>
                  <button className="text-[13px] text-gray-800 font-bold underline text-left flex items-center gap-1">
                    <FileText size={14} />
                    รายละเอียดเพิ่มเติม
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
              {/* Header Info */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-1">{selectedPost.internship_title}</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 font-medium">{selectedPost.company_name}</span>
                  <div className="flex items-center gap-1 text-gray-400 font-bold">
                    ★ 0.0 <span className="text-gray-300 font-normal ml-1">(0 Reviews)</span>
                  </div>
                </div>
              </div>

              {/* Badges/Tags Row */}
              <div className="flex flex-wrap gap-4 mb-8 text-[13px]">
                <div className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                  <CheckCircle size={16} />
                  เปิดรับสมัคร
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
                  {selectedPost.internship_compensation}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Calendar size={16} />
                  ประกาศเมื่อ: {selectedPost.internship_expired_date}
                </div>
              </div>

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
                className="px-10 py-3 bg-[#1a3a8a] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
              >
                สมัครงาน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InternshipPosts;
