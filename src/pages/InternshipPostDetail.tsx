import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Heart, MapPin, Clock, Calendar, FileText, ArrowLeft } from 'lucide-react';

export default function InternshipPostDetail() {
  const { id } = useParams();

  // Mock data - normally fetched by ID
  const job = {
    id: id,
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
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <Navbar />
      
      {/* Content aligned with main user layout */}
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <Link to="/posts" className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-700 text-base">
          <ArrowLeft size={20} /> Back to posts
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-blue-900 mb-2">{job.title}</h1>
                <p className="text-gray-700 font-semibold text-lg">{job.company}</p>
              </div>
              <Heart className="text-gray-400 hover:text-red-500 cursor-pointer" size={24} />
            </div>

            <div className="flex flex-wrap gap-4 text-base text-gray-700 mb-8 border-b pb-6">
              <div className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                ✓ {job.status}
              </div>
              <div className="flex items-center gap-1"><FileText size={16}/> {job.type}</div>
              <div className="flex items-center gap-1"><MapPin size={16} className="text-red-500"/> {job.location}</div>
              <div className="flex items-center gap-1"><span className="font-bold text-green-600">฿</span> {job.allowance}</div>
              <div className="flex items-center gap-1"><Clock size={16}/> {job.duration}</div>
              <div className="flex items-center gap-1"><Calendar size={16}/> ประกาศเมื่อ: {job.posted}</div>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-bold text-blue-900 mb-3">รายละเอียดงาน</h3>
                <p className="text-gray-700 leading-relaxed text-base">
                  ร่วมออกแบบและพัฒนาประสบการณ์ผู้ใช้ (User Experience) และส่วนติดต่อผู้ใช้ (User Interface) 
                  สำหรับโปรเจกต์เว็บและโมบายแอปพลิเคชัน เพื่อให้ผลิตภัณฑ์ใช้งานง่าย สวยงาม และตอบโจทย์ธุรกิจ
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-blue-900 mb-3">หน้าที่และความรับผิดชอบ</h3>
                <ul className="list-disc list-inside text-gray-700 text-base space-y-1.5">
                  <li>จัดทำ User Flows, Wireframes และ Prototypes ระดับ High-fidelity</li>
                  <li>ทำ User Research และ Usability Testing เพื่อเก็บข้อมูลมาปรับปรุงดีไซน์</li>
                  <li>ทำงานร่วมกับทีม Developer และ Product Manager เพื่อให้มั่นใจว่าการออกแบบสามารถนำไปใช้งานได้จริง</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-blue-900 mb-3">คุณสมบัติที่ต้องการ</h3>
                <ul className="list-disc list-inside text-gray-700 text-base space-y-1.5">
                  <li>กำลังศึกษาอยู่ในระดับปริญญาตรีในสาขาที่เกี่ยวข้อง (Design, IT, Multimedia, Com Arts)</li>
                  <li>สามารถใช้เครื่องมือออกแบบหลัก เช่น Figma, Sketch หรือ Adobe XD ได้คล่องแคล่ว</li>
                  <li>มี Portfolio แสดงผลงานออกแบบ UX/UI หรือ Graphic Design ที่น่าสนใจ</li>
                </ul>
              </section>
            </div>

            <div className="flex gap-4 mt-10 pt-6 border-t">
              <Link to={`/company/${id}`} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50">
                ดูรายละเอียดบริษัท
              </Link>
              <button className="flex-grow px-6 py-2.5 bg-blue-900 text-white rounded-lg font-bold text-base hover:bg-blue-800">
                สมัครงาน
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
