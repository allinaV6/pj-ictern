import { Link, useParams, useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { ArrowLeft, Star } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function CompanyReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock company name (normally fetched)
  const companyName = "Creative Digital Agency Co., Ltd.";
  const jobTitle = "UX/UI Design Intern";
  const duration = "6 เดือน";

  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({
    work_challenge: 0,
    work_creativity: 0,
    work_growth: 0,
    work_tools: 0,
    life_culture: 0,
    life_atmosphere: 0,
    life_welfare: 0,
    life_hours: 0,
    social_relation: 0,
    social_help: 0,
    social_env: 0,
    social_vision: 0
  });

  const handleRating = (category: string, score: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: score
    }));
  };

  const averageRating = useMemo(() => {
    const values = Object.values(ratings);
    const sum = values.reduce((a, b) => a + b, 0);
    return values.length ? (sum / values.length).toFixed(1) : "0.0";
  }, [ratings]);

  const handleSubmit = () => {
    alert("บันทึกรีวิวเรียบร้อยแล้ว (Demo Mode)");
    navigate(`/company/${id}`);
  };

  const renderStars = (category: string) => (
      <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={20} 
                className={`cursor-pointer transition-colors ${ratings[category] >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                onClick={() => handleRating(category, star)}
              />
          ))}
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <Navbar />
      
      <div className="bg-blue-900 text-white py-8 px-8 mb-8">
          <div className="max-w-4xl mx-auto">
             <h1 className="text-2xl font-bold mb-2">เขียนรีวิวบริษัท {companyName}</h1>
             <div className="flex gap-6 text-sm text-blue-200">
                 <span>ตำแหน่งที่ฝึกงาน: {jobTitle}</span>
                 <span>ระยะเวลาฝึกงาน: {duration}</span>
             </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-xl font-bold text-blue-900">คะแนนภาพรวม</h2>
                <div className="text-3xl font-bold text-yellow-500 flex items-center gap-2">
                    {averageRating} <Star fill="currentColor" size={32} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Work Section */}
                <div className="border rounded p-4">
                    <h3 className="font-bold text-center mb-4">ด้านงาน (Work)</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span>ความท้าทายของงาน</span>
                            {renderStars('work_challenge')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>โอกาสสร้างสรรค์</span>
                            {renderStars('work_creativity')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>การเรียนรู้และการเติบโต</span>
                            {renderStars('work_growth')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>ระบบและเครื่องมือ</span>
                            {renderStars('work_tools')}
                        </div>
                    </div>
                </div>

                {/* Life Section */}
                <div className="border rounded p-4">
                    <h3 className="font-bold text-center mb-4">ด้านชีวิต (Life)</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span>วัฒนธรรมองค์กร</span>
                            {renderStars('life_culture')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>บรรยากาศ</span>
                            {renderStars('life_atmosphere')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>สวัสดิการ</span>
                            {renderStars('life_welfare')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>ชั่วโมงทำงาน</span>
                            {renderStars('life_hours')}
                        </div>
                    </div>
                </div>

                {/* Social Section */}
                <div className="border rounded p-4">
                    <h3 className="font-bold text-center mb-4">ด้านสังคม (Social)</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span>ความสัมพันธ์</span>
                            {renderStars('social_relation')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>การช่วยเหลือกันในทีม</span>
                            {renderStars('social_help')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>บรรยากาศการทำงาน</span>
                            {renderStars('social_env')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span>วิสัยทัศน์</span>
                            {renderStars('social_vision')}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-lg font-bold text-blue-900 mb-4">รีวิวประสบการณ์การฝึกงานกับบริษัทนี้</h2>
            <textarea 
                className="w-full border rounded-lg p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                placeholder="สิ่งที่คุณประทับใจหรือได้เรียนรู้จากการฝึกงาน..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            ></textarea>

            <div className="flex justify-end gap-4">
                <Link to={`/company/${id}`} className="px-6 py-2 border rounded-lg hover:bg-gray-50 text-gray-600">
                    ยกเลิก
                </Link>
                <button 
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800"
                >
                    ยืนยัน
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
