<<<<<<< HEAD
<<<<<<< HEAD
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, Heart, MapPin, Clock, Calendar, FileText } from 'lucide-react';
=======
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
>>>>>>> 9805dcc75177ccd82c3ba6655fa4e7ab03373e26
=======
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Search, Heart, MapPin, Clock, Calendar, FileText } from "lucide-react";
>>>>>>> e5f453c19db71429b08bdbb49f69971bd10db24a

interface InternshipPostType {
  post_id: number;
  internship_title: string;
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

function InternshipPost() {
  const [posts, setPosts] = useState<InternshipPostType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/posts")
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setPosts([]);
        }
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

  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const toggleFavorite = (jobId: number) => {
    setFavoriteIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const filteredJobs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return jobs
      .filter((job) => {
        if (!keyword) return true;
        const text = `${job.title} ${job.company} ${job.location} ${job.type}`.toLowerCase();
        return text.includes(keyword);
      })
      .filter((job) => {
        if (!showFavoritesOnly) return true;
        return favoriteIds.includes(job.id);
      });
  }, [jobs, searchTerm, showFavoritesOnly, favoriteIds]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
<<<<<<< HEAD
<<<<<<< HEAD
      
      {/* Banner */}
      <div className="bg-blue-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">ค้นหาตำแหน่งฝึกงานที่เหมาะกับคุณ</h1>
          <p className="mb-8 text-blue-100 text-lg">แนะนำตำแหน่งฝึกงานที่ตรงกับทักษะและความถนัดของคุณ เพื่อเริ่มต้นเส้นทางอาชีพที่ใช่</p>
          <Link to="/quiz" className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold text-base hover:bg-gray-100 transition">
            เริ่มทำแบบประเมินความสนใจในสายอาชีพ
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Search & Filter */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div className="relative flex-grow max-w-2xl">
            <input 
              type="text" 
              placeholder="ค้นหาตำแหน่งฝึกงาน, บริษัท, ทักษะ" 
              className="w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          
          <div className="flex gap-4 items-center text-base text-gray-700">
             <button className="px-5 py-2.5 border rounded-lg bg-white hover:bg-gray-50">ดูตำแหน่งฝึกงานที่แนะนำ</button>
             <button 
               className={`group px-5 py-2.5 border rounded-lg flex items-center gap-2 transition ${
                 showFavoritesOnly ? 'bg-blue-900 text-white border-blue-900' : 'bg-white hover:bg-gray-50 text-gray-700'
               }`}
               onClick={() => setShowFavoritesOnly((prev) => !prev)}
             >
                <Heart 
                  size={16} 
                  className={`${showFavoritesOnly ? 'text-white' : 'text-gray-700'} group-hover:text-red-500 transition-transform duration-150 group-hover:scale-110`} 
                  fill={showFavoritesOnly ? 'currentColor' : 'none'}
                /> 
                แสดงรายการโปรด
             </button>
             <div className="flex items-center gap-1 font-medium cursor-pointer">
                sort by <span className="text-sm">▼</span>
             </div>
             <div className="flex items-center gap-1 font-medium cursor-pointer">
                Location <span className="text-sm">▼</span>
             </div>
          </div>
        </div>

        <p className="mb-6 text-gray-700 font-semibold text-base">? ตำแหน่งงานแนะนำสำหรับคุณ</p>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const isFavorite = favoriteIds.includes(job.id);
            return (
            <div key={job.id} className="bg-white p-7 rounded-xl shadow-sm border hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-blue-900 flex items-center gap-1">
                  {job.title} 
                  <span className="text-blue-500 text-sm">✓</span>
                </h2>
                <button
                  type="button"
                  onClick={() => toggleFavorite(job.id)}
                  className="group p-1 -mr-1 rounded-full hover:bg-gray-50 transition-transform duration-150"
                >
                  <Heart
                    size={20}
                    className={`${isFavorite ? 'text-red-500' : 'text-gray-400'} group-hover:text-red-500 group-hover:scale-110 transition-transform duration-150`}
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
              
              <p className="text-gray-600 text-base mb-3">{job.company}</p>
              
              <div className="flex items-center gap-4 text-base text-yellow-500 mb-4">
                 <span className="font-bold">★ {job.rating}</span>
                 <span className="text-gray-500">({job.reviews} Reviews)</span>
                 <span className="text-green-500 text-sm border border-green-500 px-2 py-0.5 rounded ml-auto font-medium">✓ {job.status}</span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                ร่วมออกแบบและพัฒนาประสบการณ์ผู้ใช้ (User Experience) และส่วนติดต่อผู้ใช้ (User Interface) สำหรับโปรเจกต์เว็บและโมบายแอปพลิเคชัน เพื่อให้...
              </p>

              <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700 mb-4">
                <div className="flex items-center gap-1"><MapPin size={14} className="text-red-500"/> {job.location}</div>
                <div className="flex items-center gap-1"><Clock size={14}/> {job.duration}</div>
                <div className="flex items-center gap-1 text-green-600 font-semibold">฿ {job.allowance}</div>
                <div className="flex items-center gap-1"><Calendar size={14}/> ประกาศเมื่อ: {job.posted}</div>
                <div className="flex items-center gap-1"><FileText size={14}/> {job.type}</div>
                <div className="flex items-center gap-1 underline text-blue-700 cursor-pointer">รายละเอียดเพิ่มเติม</div>
              </div>
              
              <Link to={`/posts/${job.id}`} className="block w-full py-2.5 bg-blue-900 text-white text-center rounded-lg font-semibold text-base hover:bg-blue-800">
                ดูรายละเอียด
              </Link>
=======
      <div className="container mt-4">
        <h2 className="mb-4">Internship Opportunities</h2>

        {loading && <p>กำลังโหลดข้อมูล...</p>}
        {error && <p className="text-danger">{error}</p>}

        <div className="row">
          {posts.map((post) => (
            <div key={post.post_id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    {post.internship_title}
                  </h5>

                  <p className="text-muted">
                    📍 {post.internship_location}
                  </p>

                  <p>
                    <strong>Duration:</strong>{" "}
                    {post.internship_duration}
                  </p>

                  <p>
                    {post.internship_description}
                  </p>

                  <p>
                    <strong>Responsibilities:</strong><br />
                    {post.internship_responsibilities}
                  </p>

                  <p>
                    <strong>Requirements:</strong><br />
                    {post.internship_requirements}
                  </p>

                  <p>
                    <strong>Compensation:</strong>{" "}
                    {post.internship_compensation}
                  </p>

                  <p>
                    <strong>Working Method:</strong>{" "}
                    {post.internship_working_method}
                  </p>

                  {post.internship_link && (
                    <a
                      href={post.internship_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary mt-2"
                    >
                      Apply Now
                    </a>
                  )}
                </div>

                <div className="card-footer text-muted">
                  Expire: {post.internship_expired_date}
                </div>
              </div>
>>>>>>> 9805dcc75177ccd82c3ba6655fa4e7ab03373e26
            </div>
          );})}
=======

      {/* Banner */}
      <div className="bg-blue-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">
            ค้นหาตำแหน่งฝึกงานที่เหมาะกับคุณ
          </h1>
          <p className="text-blue-100 text-lg">
            แนะนำตำแหน่งฝึกงานที่ตรงกับความสนใจของคุณ
          </p>
>>>>>>> e5f453c19db71429b08bdbb49f69971bd10db24a
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div className="relative flex-grow max-w-2xl">
            <input
              type="text"
              placeholder="ค้นหาตำแหน่งฝึกงาน"
              className="w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>

          <button
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
            className={`px-5 py-2.5 border rounded-lg flex items-center gap-2 transition ${
              showFavoritesOnly
                ? "bg-blue-900 text-white border-blue-900"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <Heart
              size={16}
              fill={showFavoritesOnly ? "currentColor" : "none"}
            />
            แสดงรายการโปรด
          </button>
        </div>

        {loading && <p>กำลังโหลดข้อมูล...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const isFavorite = favoriteIds.includes(post.post_id);

            return (
              <div
                key={post.post_id}
                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-blue-900">
                    {post.internship_title}
                  </h2>

                  <button
                    onClick={() => toggleFavorite(post.post_id)}
                  >
                    <Heart
                      size={20}
                      className={isFavorite ? "text-red-500" : "text-gray-400"}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                <p className="text-gray-600 mt-2 flex items-center gap-1">
                  <MapPin size={14} className="text-red-500" />
                  {post.internship_location}
                </p>

                <p className="text-sm text-gray-700 mt-3 line-clamp-3">
                  {post.internship_description}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {post.internship_duration}
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

                {post.internship_link && (
                  <a
                    href={post.internship_link}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full mt-5 py-2.5 bg-blue-900 text-white text-center rounded-lg font-semibold hover:bg-blue-800"
                  >
                    สมัครเลย
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default InternshipPost;