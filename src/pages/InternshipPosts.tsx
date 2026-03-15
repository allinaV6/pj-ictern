import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Search, Heart, MapPin, Clock, Calendar, FileText } from "lucide-react";

interface InternshipPostType {
  post_id: number;
  internship_title: string;
  company_name: string;
  internship_location: string;
  internship_duration: string;
  internship_description: string;
  internship_responsibilities: string;
  internship_requirements: string;
  internship_compensation: string;
  internship_working_method: string;
  internship_link?: string;
  internship_expired_date: string;
}

function InternshipPosts() {
  const [posts, setPosts] = useState<InternshipPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("ไม่สามารถโหลดข้อมูลได้");
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
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="px-4 py-2 border rounded-lg"
          >
            รายการโปรด
          </button>

        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredPosts.map((post) => {

            const isFavorite = favoriteIds.includes(post.post_id);

            return (
              <div
                key={post.post_id}
                className="bg-white p-6 rounded-xl shadow border"
              >

                <div className="flex justify-between">

                  <div>

                    <h2 className="text-xl font-bold text-blue-900">
                      {post.internship_title}
                    </h2>

                    <p className="text-gray-500">
                      {post.company_name}
                    </p>

                  </div>

                  <button onClick={() => toggleFavorite(post.post_id)}>
                    <Heart
                      size={20}
                      className={isFavorite ? "text-red-500" : "text-gray-400"}
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