import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { Search, Heart, MapPin, Clock, Calendar, FileText, Info, Star } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-gray-50">
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

        <div className="flex gap-4 mb-8">

          <div className="relative flex-grow">

            <input
              type="text"
              placeholder="ค้นหาตำแหน่งฝึกงาน"
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Search className="absolute left-3 top-3 text-gray-400" size={18} />

          </div>

          <button
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
            className={`px-5 py-2.5 border rounded-lg flex items-center gap-2 transition ${
              showFavoritesOnly
                ? "bg-blue-900 text-white border-blue-900"
                : "bg-white hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Heart
              size={16}
              className={`${showFavoritesOnly ? 'text-white' : 'text-gray-700'} group-hover:text-red-500 transition-transform duration-150 group-hover:scale-110`}
              fill={showFavoritesOnly ? "currentColor" : "none"}
            />
            แสดงรายการโปรด
          </button>

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
                className="bg-white p-6 rounded-xl shadow border"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                      {post.internship_title}
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 text-[10px] font-bold tracking-wider shadow-sm mt-0.5">
                        <Star size={10} className="fill-current" />
                        MOU
                      </div>
                    </h2>
                    <p className="text-gray-600 text-base mt-1">
                      {post.company_name}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleFavorite(post.post_id)}
                    className="group p-1 -mr-1 rounded-full hover:bg-gray-50 transition-transform duration-150"
                  >
                    <Heart
                      size={20}
                      className={`${isFavorite ? 'text-red-500' : 'text-gray-400'} group-hover:text-red-500 group-hover:scale-110 transition-transform duration-150`}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </button>

                </div>

                <p className="flex items-center mt-2 text-gray-600">
                  <MapPin size={14} className="mr-1" />
                  {post.internship_location}
                </p>

                <p className="text-sm mt-3 line-clamp-3">
                  {post.internship_description}
                </p>

                <div className="mt-4 text-sm space-y-2">

                  <div className="flex items-center gap-1">
                   <Clock size={14} />
                  {post.internship_duration} เดือน
                  </div>

                  <div className="text-green-600 font-semibold">
                    ฿ {post.internship_compensation}
                  </div>

                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    {post.internship_working_method}
                  </div>

                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar size={14} />
                    หมดเขต: {post.internship_expired_date}
                  </div>

                </div>

                <div className="flex gap-3 mt-5">

                  <Link
                    to={`/posts/${post.post_id}`}
                    className="flex-1 py-2 border text-blue-900 border-blue-900 text-center rounded-lg"
                  >
                    ดูรายละเอียด
                  </Link>


                  {post.internship_link && (
                    <a
                      href={post.internship_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-blue-900 text-white text-center rounded-lg"
                    >
                      สมัคร
                    </a>
                  )}

                </div>

              </div>
            );

          })}

        </div>

      </div>

    </div>
  );
}

export default InternshipPosts;
