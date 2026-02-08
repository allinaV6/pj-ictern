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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      {/* Banner */}
      <div className="bg-blue-900 text-white py-12 px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">ค้นหาตำแหน่งฝึกงานที่เหมาะกับคุณ</h1>
          <p className="mb-6 text-blue-100">แนะนำตำแหน่งฝึกงานที่ตรงกับทักษะและความถนัดของคุณ เพื่อเริ่มต้นเส้นทางอาชีพที่ใช่</p>
          <Link to="/quiz" className="bg-white text-blue-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition">
            เริ่มทำแบบประเมินความสนใจในสายอาชีพ
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Search & Filter */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div className="relative flex-grow max-w-xl">
            <input 
              type="text" 
              placeholder="ค้นหาตำแหน่งฝึกงาน, บริษัท, ทักษะ" 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <div className="flex gap-4 items-center text-sm text-gray-600">
             <button className="px-4 py-2 border rounded bg-white hover:bg-gray-50">ดูตำแหน่งฝึกงานที่แนะนำ</button>
             <button className="px-4 py-2 border rounded bg-white hover:bg-gray-50 flex items-center gap-2">
                <Heart size={16} /> แสดงรายการโปรด
             </button>
             <div className="flex items-center gap-1 font-medium cursor-pointer">
                sort by <span className="text-xs">▼</span>
             </div>
             <div className="flex items-center gap-1 font-medium cursor-pointer">
                Location <span className="text-xs">▼</span>
             </div>
          </div>
        </div>

        <p className="mb-4 text-gray-600 font-medium">? ตำแหน่งงานแนะนำสำหรับคุณ</p>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-blue-900 flex items-center gap-1">
                  {job.title} 
                  <span className="text-blue-500 text-xs">✓</span>
                </h2>
                <Heart className="text-gray-400 hover:text-red-500 cursor-pointer" size={20} />
              </div>
              
              <p className="text-gray-500 text-sm mb-3">{job.company}</p>
              
              <div className="flex items-center gap-4 text-sm text-yellow-500 mb-4">
                 <span className="font-bold">★ {job.rating}</span>
                 <span className="text-gray-400">({job.reviews} Reviews)</span>
                 <span className="text-green-500 text-xs border border-green-500 px-1 rounded ml-auto">✓ {job.status}</span>
              </div>
              
              <p className="text-xs text-gray-500 mb-4 line-clamp-3">
                ร่วมออกแบบและพัฒนาประสบการณ์ผู้ใช้ (User Experience) และส่วนติดต่อผู้ใช้ (User Interface) สำหรับโปรเจกต์เว็บและโมบายแอปพลิเคชัน เพื่อให้...
              </p>

              <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-600 mb-4">
                <div className="flex items-center gap-1"><MapPin size={12} className="text-red-500"/> {job.location}</div>
                <div className="flex items-center gap-1"><Clock size={12}/> {job.duration}</div>
                <div className="flex items-center gap-1 text-green-600 font-medium">฿ {job.allowance}</div>
                <div className="flex items-center gap-1"><Calendar size={12}/> ประกาศเมื่อ: {job.posted}</div>
                <div className="flex items-center gap-1"><FileText size={12}/> {job.type}</div>
                <div className="flex items-center gap-1 underline text-blue-600 cursor-pointer">รายละเอียดเพิ่มเติม</div>
              </div>
              
              <Link to={`/posts/${job.id}`} className="block w-full py-2 bg-blue-900 text-white text-center rounded-lg font-medium hover:bg-blue-800">
                ดูรายละเอียด
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
