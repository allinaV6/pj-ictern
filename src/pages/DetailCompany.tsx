import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { MapPin, Phone, Mail, Globe, ArrowLeft, Star, Info } from 'lucide-react';

export default function DetailCompany() {
  const { id } = useParams();
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [showDefinitions, setShowDefinitions] = useState(false);

  // Mock company data
  const company = {
    id: id,
    name: "Creative Digital Agency Co., Ltd.",
    rating: 4.5,
    reviews: 4,
    description: "Creative Digital Agency Co., Ltd. เป็นเอเจนซี่ด้านดิจิทัลที่เน้นการออกแบบประสบการณ์ผู้ใช้ (UX) และส่วนติดต่อผู้ใช้ (UI) เราสร้างสรรค์โซลูชันที่สวยงาม ใช้งานง่าย และขับเคลื่อนผลลัพธ์ทางธุรกิจ",
    location: "ทองหล่อ, สุขุมวิท",
    phone: "02-987-6543",
    email: "contact@cda.co.th",
    website: "creative-digital.com"
  };

  const activeJobs = [
    {
      id: 1,
      title: "UX/UI Design Intern",
      salary: "N/A",
      duration: "6 เดือนขึ้นไป",
      posted: "28/10/2025"
    }
  ];

  const reviews = [
    {
      id: 1,
      name: "Chonthicha.pre",
      position: "UX/UI Design Intern",
      duration: "ฝึกงาน 6 เดือน | 28/11/2025",
      comment: "การฝึกงานที่นี่ได้โอกาสเรียนรู้เรื่อง UX/UI มากมาย ได้ทำงานร่วมกับพี่ๆ และได้หาประสบการณ์ใหม่ๆ เป็นอย่างดี",
      ratings: { work: 4.8, social: 4.8, life: 4.8, total: 4.8 },
      scores: [
          { label: "งาน", score: 4.8 },
          { label: "สังคม", score: 4.8 },
          { label: "ชีวิต", score: 4.8 },
      ]
    },
    {
      id: 2,
      name: "Napat S.",
      position: "UX Design Intern",
      duration: "ฝึกงาน 4 เดือน | 10/09/2025",
      comment: "ได้เรียนรู้เรื่อง Design System และ User Testing จริงจัง สังคมดีมากครับ",
      ratings: { total: 5.0 },
      scores: []
    },
    {
      id: 3,
      name: "Punyaphat W.",
      position: "Design Researcher",
      duration: "ฝึกงาน 6 เดือน | 01/08/2025",
      comment: "สถานที่ทำงานสวยงามทันสมัย มีพื้นที่ให้ผ่อนคลายเยอะ แต่บางครั้งงานค่อนข้างหนักและต้องทำโอทีบ้างเพื่อส่งมอบงานให้ทันเดดไลน์ แต่โดยรวมแล้วคุ้มค่ากับประสบการณ์ที่ได้รับ หัวหน้าทีม UX ให้คำแนะนำที่เป็นประโยชน์มาก ทำให้เข้าใจกระบวนการ Research ได้ลึกซึ้งขึ้นเยอะเลยค่ะ",
      ratings: { total: 4.5 },
      scores: []
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <Navbar />

      {/* Blue Banner Header */}
      <div className="bg-blue-900 text-white py-12 px-8 mb-8">
          <div className="max-w-6xl mx-auto">
             <h1 className="text-3xl font-bold">รายละเอียดบริษัท {company.name}</h1>
          </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-8 px-8">
        <Link to={`/posts/${id}`} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-700">
          <ArrowLeft size={20} /> Back to job details
        </Link>

        {/* Company Header */}
        <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              Logo
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-blue-900">{company.name}</h1>
                <span className="text-yellow-500 font-bold flex items-center gap-1">
                  ★ {company.rating} <span className="text-gray-400 font-normal text-sm">({company.reviews} Reviews)</span>
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{company.description}</p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><MapPin size={14} className="text-red-500"/> {company.location}</div>
                <div className="flex items-center gap-2"><Phone size={14} className="text-green-600"/> {company.phone}</div>
                <div className="flex items-center gap-2"><Mail size={14} className="text-gray-500"/> {company.email}</div>
                <div className="flex items-center gap-2"><Globe size={14} className="text-blue-500"/> {company.website}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Jobs Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-4">ประกาศรับสมัครงาน ({activeJobs.length})</h2>
          <div className="space-y-4">
            {activeJobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center">
                <div>
                  <h3 className="text-blue-900 font-bold mb-1">{job.title}</h3>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>ค่าตอบแทน: {job.salary}</span>
                    <span>|</span>
                    <span>ระยะเวลา: {job.duration}</span>
                    <span>|</span>
                    <span>ประกาศเมื่อ: {job.posted}</span>
                  </div>
                </div>
                <button className="bg-blue-900 text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-800">
                  ดูรายละเอียด
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
               รีวิวการฝึกงาน ({reviews.length}) 
               <div className="relative">
                 <Info 
                   size={16} 
                   className="text-gray-400 cursor-pointer hover:text-blue-600"
                   onClick={() => setShowDefinitions(!showDefinitions)}
                 />
                 {showDefinitions && (
                    <div className="absolute left-6 top-0 w-80 bg-gray-900 text-white p-4 rounded-lg shadow-xl z-20 text-xs text-left font-normal">
                      {/* Triangle pointing left */}
                      <div className="absolute -left-2 top-1.5 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-900"></div>
                      
                      <div className="mb-3">
                         <h4 className="font-bold text-white mb-1">ด้านสังคม (Social):</h4>
                         <p className="text-gray-300 font-light leading-relaxed">มุ่งเน้นไปที่ความสัมพันธ์กับเพื่อนร่วมงาน บรรยากาศและการช่วยเหลือกันในทีม</p>
                      </div>
                      <div className="mb-3">
                         <h4 className="font-bold text-white mb-1">ด้านชีวิต (Life):</h4>
                         <p className="text-gray-300 font-light leading-relaxed">มุ่งเน้นไปที่ความสมดุลระหว่างชีวิตและการทำงาน รวมถึงวัฒนธรรมองค์กร และสภาพแวดล้อมของที่ทำงาน</p>
                      </div>
                      <div>
                         <h4 className="font-bold text-white mb-1">ด้านงาน (Work):</h4>
                         <p className="text-gray-300 font-light leading-relaxed">มุ่งเน้นไปที่ประสบการณ์การทำงานโดยตรง รวมถึงความท้าทายของงาน โอกาสในการเรียนรู้ และความพร้อมของเครื่องมือที่ใช้</p>
                      </div>
                    </div>
                 )}
               </div>
             </h2>
             <Link to={`/company/${id}/review`} className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-bold hover:bg-gray-300">
               เขียนรีวิวของคุณ
             </Link>
          </div>

          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-blue-900 font-bold text-sm">{review.name} <span className="text-gray-500 font-normal ml-2">{review.position}</span></h3>
                    <p className="text-xs text-gray-400">{review.duration}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                    <div className="relative">
                      <Info 
                        size={14} 
                        className="text-blue-400 mr-1 cursor-pointer hover:text-blue-600"
                        onClick={() => setActiveTooltip(activeTooltip === review.id ? null : review.id)}
                      />
                      {activeTooltip === review.id && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-6 w-48 bg-gray-900 text-white p-3 rounded-lg shadow-xl z-10 text-xs cursor-auto text-left font-normal">
                          {/* Triangle */}
                          <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-gray-900"></div>
                          
                          <div className="space-y-2">
                             {review.scores.length > 0 ? review.scores.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className="text-gray-300">{s.label}</span>
                                  <span className="text-yellow-400 font-bold flex items-center gap-1">{s.score} ★</span>
                                </div>
                             )) : (
                                <div className="text-gray-500 text-center">No detailed scores</div>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                    <span>ภาพรวม {review.ratings.total} ★</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
