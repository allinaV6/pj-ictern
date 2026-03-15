import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { MapPin, Phone, Mail, Globe, ArrowLeft, Star, Info } from 'lucide-react';
import axios from 'axios';

interface CompanyData {
  company_id: number;
  company_name: string;
  company_description: string;
  company_address: string;
  company_phone_num: string;
  company_email: string;
  company_link: string;
  company_logo: string;
  company_type: string;
}

interface JobData {
  post_id: number;
  internship_title: string;
  internship_location: string;
  internship_duration: string | number;
  internship_compensation: string;
  internship_expired_date: string;
}

export default function DetailCompany() {
  const { id } = useParams();
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [activeJobs, setActiveJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id || id === 'undefined') {
        setError("ไม่พบรหัสบริษัท");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Fetching data for company ID: ${id}`);
        
        const [companyRes, postsRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/company/${id}`),
          axios.get(`http://localhost:5001/api/posts/company/${id}`)
        ]);
        
        setCompany(companyRes.data);
        setActiveJobs(postsRes.data);
        setError("");
      } catch (err) {
        console.error("Error fetching company data:", err);
        setError("ไม่สามารถโหลดข้อมูลบริษัทได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const reviews: any[] = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-xl text-gray-600">กำลังโหลดข้อมูลบริษัท...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="max-w-6xl mx-auto mt-10 px-4 text-center">
          <p className="text-xl text-red-500 mb-4">{error || "ไม่พบข้อมูลบริษัท"}</p>
          <Link to="/posts" className="text-blue-900 font-bold hover:underline">
            กลับไปหน้าค้นหา
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans pb-10">
      <Navbar />

      {/* Dark Blue Header Banner */}
      <div className="bg-blue-900 text-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
             <h1 className="text-4xl font-bold">รายละเอียดบริษัท {company.company_name}</h1>
          </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 mt-10">
        {/* Company Info Section */}
        <div className="mb-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white overflow-hidden flex-shrink-0">
              {company.company_logo && company.company_logo !== "-" ? (
                <img src={`/logos/${company.company_logo}`} alt={company.company_name} className="w-full h-full object-cover" />
              ) : (
                <Globe size={24} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-blue-900">{company.company_name}</h2>
                <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                  ★ 4.5 <span className="text-gray-400 font-normal ml-1">(4 Reviews)</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-6 leading-relaxed max-w-4xl">
            {company.company_description}
          </p>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-red-500"/> 
              {company.company_address || 'ไม่ระบุ'}
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={14} className="text-green-600"/> 
              {company.company_phone_num || 'ไม่ระบุ'}
            </div>
            <div className="flex items-center gap-1.5">
              <Mail size={14} className="text-gray-500"/> 
              {company.company_email || 'ไม่ระบุ'}
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={14} className="text-blue-500"/> 
              {company.company_link && company.company_link !== '-' ? (
                <a href={company.company_link} target="_blank" rel="noreferrer" className="hover:underline text-blue-600">
                  {company.company_link.replace('https://', '').replace('http://', '')}
                </a>
              ) : 'ไม่ระบุ'}
            </div>
          </div>
        </div>

        {/* Active Jobs Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-4">
            ประกาศรับสมัครงาน({activeJobs.length})
          </h2>
          <div className="space-y-4">
            {activeJobs.length > 0 ? activeJobs.map(job => (
              <div key={job.post_id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-2 mb-4">
                  <h3 className="text-blue-900 font-bold text-lg">{job.internship_title}</h3>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>ค่าตอบแทน: {job.internship_compensation || 'N/A'}</span>
                    <span className="text-gray-300">|</span>
                    <span>ระยะเวลา: {job.internship_duration} เดือนขึ้นไป</span>
                    <span className="text-gray-300">|</span>
                    <span>ประกาศเมื่อ: 28/10/2025</span>
                  </div>
                </div>
                <Link
                  to={`/posts/${job.post_id}`}
                  className="inline-block bg-[#1a3a8a] text-white px-8 py-2 rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors shadow-sm"
                >
                  ดูรายละเอียด
                </Link>
              </div>
            )) : (
              <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                ขณะนี้ยังไม่มีประกาศรับสมัครงาน
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
               รีวิวการฝึกงาน ({reviews.length}) 
               <div className="relative">
                 <Info 
                   size={16} 
                   className="text-blue-400 cursor-pointer hover:text-blue-600 transition-colors"
                   onClick={() => setShowDefinitions(!showDefinitions)}
                 />
                 {showDefinitions && (
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 w-[320px] bg-[#05101c] text-white p-5 rounded-xl shadow-2xl z-50 text-[13px] border border-gray-800">
                      {/* Left Arrow Pointer */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-[#05101c]"></div>
                      
                      <div className="space-y-4">
                        <div>
                           <h4 className="font-bold text-white mb-1">ด้านสังคม (Social):</h4>
                           <p className="text-gray-300 font-light leading-relaxed">มุ่งเน้นไปที่ความสัมพันธ์กับเพื่อนร่วมงาน บรรยากาศและการช่วยเหลือกันภายในทีม</p>
                        </div>
                        <div>
                           <h4 className="font-bold text-white mb-1">ด้านชีวิต (Life):</h4>
                           <p className="text-gray-300 font-light leading-relaxed">มุ่งเน้นไปที่ความสมดุลระหว่างชีวิตและการทำงาน รวมถึงวัฒนธรรมองค์กร และสภาพแวดล้อมของที่ทำงาน</p>
                        </div>
                        <div>
                           <h4 className="font-bold text-white mb-1">ด้านงาน (Work):</h4>
                           <p className="text-gray-300 font-light leading-relaxed">มุ่งเน้นไปที่ประสบการณ์การทำงานโดยตรง รวมถึงความท้าทายของงาน โอกาสในการเรียนรู้ และความพร้อมของเครื่องมือที่ใช้</p>
                        </div>
                      </div>
                    </div>
                 )}
               </div>
             </h2>
             <Link to={`/company/${id}/review`} className="bg-[#cccccc] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-400 transition-colors">
               เขียนรีวิวของคุณ
             </Link>
          </div>

          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
                  {/* ... existing review content ... */}
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-xl border border-dashed border-gray-200 text-center flex flex-col items-center justify-center text-gray-400">
                <p className="text-sm">ยังไม่มีข้อมูลรีวิวในขณะนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
