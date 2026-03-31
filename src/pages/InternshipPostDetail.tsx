import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { MapPin, Clock, Calendar, FileText, Building2 } from "lucide-react";

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
  internship_link?: string;
  internship_expired_date: string;

  // 🔥 เพิ่ม
  rating?: number;
  review_count?: number;
}

function InternshipPostDetail() {

  const { id } = useParams();

  const [post, setPost] = useState<InternshipPostType | null>(null);
  const [loading, setLoading] = useState(true);

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

            <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
              ⭐ {post.rating ? post.rating.toFixed(1) : "0.0"}
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

            <div className="text-green-600 font-semibold">
              ค่าตอบแทน: {post.internship_compensation} บาท/เดือน
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={16}/>
              หมดเขต: {new Date(post.internship_expired_date).toLocaleDateString()}
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
              <a
                href={post.internship_link}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
              >
                สมัครฝึกงาน
              </a>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default InternshipPostDetail;