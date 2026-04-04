import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { MapPin, Clock, Calendar, FileText, Building2, Mail, Star } from "lucide-react";

interface InternshipPostType {
  post_id: number;
  company_id: number;
  internship_title: string;
  company_name: string;
  internship_location: string;
  internship_duration: string;
  internship_description: string;
  internship_responsibilities: string;
  internship_requirements: string;
  internship_compensation: string;
  internship_working_method: string;
  internship_create_date: string;
  internship_link?: string;
  internship_apply_type?: string;
  internship_poster?: string;
  internship_expired_date: string;

  // 🔥 เพิ่ม
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

function InternshipPostDetail() {

  const { id } = useParams();

  const [post, setPost] = useState<InternshipPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/posts/detail/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("POST DETAIL:", data);
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

  }, [id]);

  if (loading) {
    return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;
  }

  if (!post) {
    return <div className="p-10 text-center">ไม่พบข้อมูลโพสต์</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="bg-white p-8 rounded-xl shadow-sm border">

          {/* Title */}
          <h1 className="text-3xl font-bold text-blue-900">
            {post.internship_title}
          </h1>

          {/* 🔥 Company + Rating */}
          <div className="flex items-center gap-4 text-gray-600 mt-2">

            <div className="flex items-center gap-2">
              <Building2 size={16}/>
              {post.company_name}
            </div>

            <div className={`flex items-center gap-1 font-bold text-sm ${post.review_count ? 'text-yellow-500' : 'text-gray-400'}`}>
              <Star size={16} className="fill-current" /> {post.rating ? post.rating.toFixed(1) : "0.0"}
              <span className="text-gray-400 font-normal ml-1">
                ({post.review_count || 0} Reviews)
              </span>
            </div>

          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 mt-3">
            <MapPin size={16}/>
            {post.internship_location}
          </div>

          {/* Info */}
          <div className="grid md:grid-cols-2 gap-4 mt-6 text-sm">

            <div className="flex items-center gap-2">
              <Clock size={16}/>
              ระยะเวลา: {post.internship_duration} เดือน
            </div>

            <div className="flex items-center gap-2">
              <FileText size={16}/>
              รูปแบบงาน: {post.internship_working_method}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">ค่าตอบแทน:</span>
              <span className="text-green-600 font-bold">
                {renderCompensation(post.internship_compensation)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16}/>
              วันเปิดรับสมัคร: {formatDateOnly(post.internship_create_date)}
            </div>

            <div className="flex items-center gap-2 text-red-600 font-medium">
              <Calendar size={16}/>
              วันปิดรับสมัคร: {formatDateOnly(post.internship_expired_date)}
            </div>

          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2">รายละเอียดงาน</h2>
            <p className="text-gray-700 leading-relaxed">
              {post.internship_description}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Responsibilities</h2>
            <p className="text-gray-700">
              {post.internship_responsibilities}
            </p>
          </div>

          {/* Requirements */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Requirements</h2>
            <p className="text-gray-700">
              {post.internship_requirements}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">

            <Link
              to={`/company/${post.company_id}`}
              className="px-6 py-3 border border-blue-900 text-blue-900 rounded-lg hover:bg-blue-50"
            >
              ดูข้อมูลบริษัท
            </Link>

            {post.internship_link && (
              <button
                onClick={() => {
                  const applyType = post.internship_apply_type;
                  const applyLink = post.internship_link || '';
                  if (applyType === 'email' || applyLink.includes('@')) {
                    setIsEmailModalOpen(true);
                  } else if (applyLink) {
                    const finalLink = applyLink.startsWith('http') ? applyLink : `https://${applyLink}`;
                    window.open(finalLink, '_blank');
                  }
                }}
                className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
              >
                สมัครฝึกงาน
              </button>
            )}

          </div>

        </div>

      </div>

      {/* Email Application Modal */}
      {isEmailModalOpen && post && (
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
                {post.internship_link || 'ไม่ระบุอีเมล'}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  window.location.href = `mailto:${post.internship_link}`;
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

export default InternshipPostDetail;
