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
      
      {/* Background overlay simulation (as if it was a modal on top of previous page, 
          but here we just use a full page with a 'back' feel) */}
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <Link to="/posts" className="flex items-center gap-2 text-gray-500 mb-4 hover:text-gray-700">
          <ArrowLeft size={20} /> Back to posts
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-blue-900 mb-1">{job.title}</h1>
                <p className="text-gray-600 font-medium">{job.company}</p>
              </div>
              <Heart className="text-gray-400 hover:text-red-500 cursor-pointer" size={24} />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6 border-b pb-6">
              <div className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                ✓ {job.status}
              </div>
              <div className="flex items-center gap-1"><FileText size={16}/> {job.type}</div>
              <div className="flex items-center gap-1"><MapPin size={16} className="text-red-500"/> {job.location}</div>
              <div className="flex items-center gap-1"><span className="font-bold text-green-600">฿</span> {job.allowance}</div>
              <div className="flex items-center gap-1"><Clock size={16}/> {job.duration}</div>
              <div className="flex items-center gap-1"><Calendar size={16}/> ประกาศเมื่อ: {job.posted}</div>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-bold text-blue-900 mb-2">รายละเอียดงาน</h3>
                <p className="text-gray-700 leading-relaxed text-sm">
                  ร่วมออกแบบและพัฒนาประสบการณ์ผู้ใช้ (User Experience) และส่วนติดต่อผู้ใช้ (User Interface) 
                  สำหรับโปรเจกต์เว็บและโมบายแอปพลิเคชัน เพื่อให้ผลิตภัณฑ์ใช้งานง่าย สวยงาม และตอบโจทย์ธุรกิจ
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-blue-900 mb-2">หน้าที่และความรับผิดชอบ</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>จัดทำ User Flows, Wireframes และ Prototypes ระดับ High-fidelity</li>
                  <li>ทำ User Research และ Usability Testing เพื่อเก็บข้อมูลมาปรับปรุงดีไซน์</li>
                  <li>ทำงานร่วมกับทีม Developer และ Product Manager เพื่อให้มั่นใจว่าการออกแบบสามารถนำไปใช้งานได้จริง</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-blue-900 mb-2">คุณสมบัติที่ต้องการ</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>กำลังศึกษาอยู่ในระดับปริญญาตรีในสาขาที่เกี่ยวข้อง (Design, IT, Multimedia, Com Arts)</li>
                  <li>สามารถใช้เครื่องมือออกแบบหลัก เช่น Figma, Sketch หรือ Adobe XD ได้คล่องแคล่ว</li>
                  <li>มี Portfolio แสดงผลงานออกแบบ UX/UI หรือ Graphic Design ที่น่าสนใจ</li>
                </ul>
              </section>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t">
              <Link to={`/company/${id}`} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                ดูรายละเอียดบริษัท
              </Link>
              <button className="flex-grow px-6 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800">
                สมัครงาน
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
