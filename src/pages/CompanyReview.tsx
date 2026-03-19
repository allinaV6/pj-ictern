import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Star } from 'lucide-react';
import { useState, useMemo } from 'react';

type RatingKey =
  | "work_challenge"
  | "work_creativity"
  | "work_growth"
  | "work_tools"
  | "life_culture"
  | "life_atmosphere"
  | "life_welfare"
  | "life_hours"
  | "social_relation"
  | "social_help"
  | "social_env"
  | "social_vision";

export default function CompanyReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const companyName = "Creative Digital Agency Co., Ltd.";
  const jobTitle = "UX/UI Design Intern";
  const duration = "6 เดือน";

  const [comment, setComment] = useState<string>("");

  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
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

  const handleRating = (category: RatingKey, score: number) => {
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

  const getCategoryAvg = (keys: RatingKey[]) => {
    const vals = keys.map(k => ratings[k]);
    return vals.reduce((a, b) => a + b, 0) / keys.length;
  };

  const handleSubmit = async () => {
    try {
      const companyId = Number(id);

      if (!companyId) {
        alert("company_id ไม่ถูกต้อง");
        return;
      }

      const payload = {
        company_id: companyId,
        student_id: 6587019,
        review_sum_rating: parseFloat(averageRating),
        review_work_rating: getCategoryAvg([
          "work_challenge","work_creativity","work_growth","work_tools"
        ]),
        review_life_rating: getCategoryAvg([
          "life_culture","life_atmosphere","life_welfare","life_hours"
        ]),
        review_commu_rating: getCategoryAvg([
          "social_relation","social_help","social_env","social_vision"
        ]),
        review_comment: comment
      };

      const res = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert("บันทึกรีวิวสำเร็จ ✅");
        navigate(`/company/${companyId}`);
      } else {
        alert(data.message || "บันทึกไม่สำเร็จ");
      }

    } catch (err) {
      console.error(err);
      alert("เชื่อมต่อ server ไม่ได้");
    }
  };

  const renderStars = (category: RatingKey) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          size={20} 
          className={`cursor-pointer transition-colors ${
            ratings[category] >= star 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300 hover:text-yellow-400'
          }`}
          onClick={() => handleRating(category, star)}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <Navbar />
      
      <div className="bg-blue-900 text-white py-10 px-4 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-3">
            เขียนรีวิวบริษัท {companyName}
          </h1>
          <div className="flex gap-6 text-base text-blue-200">
            <span>ตำแหน่ง: {jobTitle}</span>
            <span>ระยะเวลา: {duration}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-10 mb-8">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h2 className="text-2xl font-bold text-blue-900">
              คะแนนภาพรวม
            </h2>
            <div className="text-4xl font-bold text-yellow-500 flex items-center gap-2">
              {averageRating} <Star fill="currentColor" size={32} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Work */}
            <div className="border rounded p-4">
              <h3 className="font-bold text-center mb-4">ด้านงาน</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span>ความท้าทาย</span>{renderStars('work_challenge')}</div>
                <div className="flex justify-between"><span>ความคิดสร้างสรรค์</span>{renderStars('work_creativity')}</div>
                <div className="flex justify-between"><span>การเติบโต</span>{renderStars('work_growth')}</div>
                <div className="flex justify-between"><span>เครื่องมือ</span>{renderStars('work_tools')}</div>
              </div>
            </div>

            {/* Life */}
            <div className="border rounded p-4">
              <h3 className="font-bold text-center mb-4">ด้านชีวิต</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span>วัฒนธรรม</span>{renderStars('life_culture')}</div>
                <div className="flex justify-between"><span>บรรยากาศ</span>{renderStars('life_atmosphere')}</div>
                <div className="flex justify-between"><span>สวัสดิการ</span>{renderStars('life_welfare')}</div>
                <div className="flex justify-between"><span>ชั่วโมง</span>{renderStars('life_hours')}</div>
              </div>
            </div>

            {/* Social */}
            <div className="border rounded p-4">
              <h3 className="font-bold text-center mb-4">ด้านสังคม</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span>ความสัมพันธ์</span>{renderStars('social_relation')}</div>
                <div className="flex justify-between"><span>ช่วยเหลือ</span>{renderStars('social_help')}</div>
                <div className="flex justify-between"><span>สภาพแวดล้อม</span>{renderStars('social_env')}</div>
                <div className="flex justify-between"><span>วิสัยทัศน์</span>{renderStars('social_vision')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-10">
          <textarea
            className="w-full border rounded-lg p-4 min-h-[150px]"
            placeholder="เขียนรีวิว..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex justify-end gap-4 mt-4">
            <Link to={`/company/${id}`} className="border px-4 py-2 rounded">
              ยกเลิก
            </Link>

            <button
              onClick={handleSubmit}
              className="bg-blue-900 text-white px-6 py-2 rounded font-bold hover:bg-blue-800"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}