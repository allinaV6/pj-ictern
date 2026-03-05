import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, Heart, MapPin, Clock, Calendar, FileText } from 'lucide-react';

export default function InternshipPosts() {
  const jobs = [
    {
      id: 1,
      title: "UX/UI Design Intern",
      company: "Creative Digital Agency Co., Ltd.",
      rating: 4.5,
      reviews: 4,
      status: "เปิดรับสมัคร",
      location: "กรุงเทพ",
      duration: "ฝึกงาน 6 เดือนขึ้นไป",
      allowance: "N/A",
      posted: "28/10/2025",
      type: "Onsite"
    },
    {
      id: 2,
      title: "Backend Dev Intern",
      company: "Innovate Systems Co., Ltd.",
      rating: 4.2,
      reviews: 13,
      status: "เปิดรับสมัคร",
      location: "กรุงเทพ",
      duration: "ฝึกงาน 4 เดือนขึ้นไป",
      allowance: "5,000 THB/Month",
      posted: "01/11/2025",
      type: "Online"
    },
    {
      id: 3,
      title: "QA Tester Intern",
      company: "SCG Innovate Co., Ltd.",
      rating: 4.0,
      reviews: 12,
      status: "เปิดรับสมัคร",
      location: "นครปฐม",
      duration: "ฝึกงาน 6 เดือนขึ้นไป",
      allowance: "10,000 THB/Month",
      posted: "15/11/2025",
      type: "Hybrid"
    }
  ];

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
                <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                  {job.title}
                  <img
                    src="/mou-logo.png"
                    alt="MOU"
                    className="w-8 h-8 object-contain mt-1"
                  />
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
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
