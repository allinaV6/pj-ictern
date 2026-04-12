import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Star, Info } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

type ReviewEligibilityResponse = {
  canReview: boolean;
  internship_position_title?: string | null;
  reason?: string;
};

type CompanyResponse = {
  company_id: number;
  company_name: string;
};

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

  // ✅ ดึง user จาก localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [companyName, setCompanyName] = useState<string>('');
  const [internshipPositionTitle, setInternshipPositionTitle] = useState<string>('');

  const [comment, setComment] = useState<string>("");
  const [canReview, setCanReview] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [eligibilityReason, setEligibilityReason] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const loadReviewContext = async () => {
      try {
        const companyId = Number(id);
        const userId = user?.student_id || user?.admin_id || user?.user_id;
        const userType = user?.student_id ? 'student' : 'admin';

        if (!companyId || !userId) {
          setCanReview(false);
          setCheckingEligibility(false);
          return;
        }

        const [companyRes, eligibilityRes] = await Promise.all([
          fetch(`http://localhost:5000/api/company/${companyId}`),
          fetch(`http://localhost:5000/api/reviews/eligibility/${companyId}?student_id=${userId}&user_type=${userType}`)
        ]);

        if (companyRes.ok) {
          const companyData: CompanyResponse = await companyRes.json();
          setCompanyName(companyData.company_name || '');
        }

        const data: ReviewEligibilityResponse = await eligibilityRes.json();
        setCanReview(Boolean(data?.canReview));
        setInternshipPositionTitle(data?.internship_position_title || '');
        setEligibilityReason(data?.reason || '');
      } catch (err) {
        console.error(err);
        setCanReview(false);
        setEligibilityReason('');
      } finally {
        setCheckingEligibility(false);
      }
    };

    loadReviewContext();
  }, [id]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const companyId = Number(id);

      if (!companyId) {
        alert("company_id ไม่ถูกต้อง");
        return;
      }

      // ✅ เช็ค user login - รองรับทั้ง student และ admin
      const userId = user?.student_id || user?.admin_id || user?.user_id;
      const userRole = user?.role || (user?.student_id ? 'student' : 'admin');
      
      if (!userId) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        navigate("/");
        return;
      }

      if (userRole !== 'student') {
        alert('เฉพาะนักศึกษาที่เคยฝึกงานกับบริษัทนี้เท่านั้นที่สามารถรีวิวได้');
        navigate(`/company/${companyId}`);
        return;
      }

      if (!canReview) {
        alert('คุณไม่มีสิทธิ์รีวิวบริษัทนี้');
        navigate(`/company/${companyId}`);
        return;
      }

      const payload = {
        company_id: companyId,
        student_id: userId,
        user_type: userRole,
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
    } finally {
      setIsSubmitting(false);
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

  const renderInfoSection = () => (
    <div className="border-t border-gray-200 pt-6 mt-8 mb-4">
      <div className="flex items-center gap-2 mb-4 relative group">
        <h3 className="text-2xl font-bold text-blue-900">
          รีวิวประสบการณ์การฝึกงานกับบริษัทนี้
        </h3>
        <button
          type="button"
          className="text-blue-500 hover:text-blue-700"
          aria-label="ข้อมูลเพิ่มเติมเกี่ยวกับการรีวิว"
        >
          <Info size={18} />
        </button>

        <div className="absolute left-72 top-1/2 -translate-y-1/2 hidden group-hover:block z-20 w-72 rounded-lg bg-[#0f172a] text-white shadow-2xl px-4 py-3 text-sm leading-relaxed">
          สามารถรีวิวได้เพียง 1 ครั้งต่อ 1 ตำแหน่งฝึกงาน หากเปลี่ยนตำแหน่งในบริษัทเดิมจะรีวิวใหม่ได้อีกครั้ง
        </div>
      </div>

      <textarea
        className="w-full border border-gray-200 rounded-xl p-4 min-h-[150px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        placeholder="สิ่งที่คุณประทับใจหรือได้เรียนรู้จากการฝึกงาน..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
    </div>
  );

  return (
    <>
      {checkingEligibility ? (
        <div className="min-h-screen bg-gray-50 font-sans pb-10">
          <Navbar />
          <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-600">
            กำลังตรวจสอบสิทธิ์รีวิว...
          </div>
        </div>
      ) : !canReview ? (
        <div className="min-h-screen bg-gray-50 font-sans pb-10">
          <Navbar />
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-blue-900 mb-3">ไม่มีสิทธิ์เขียนรีวิว</h1>
            <p className="text-gray-600 mb-6">เฉพาะนักศึกษาที่เคยฝึกงานกับบริษัทนี้เท่านั้นที่สามารถเขียนรีวิวได้</p>
            {eligibilityReason ? (
              <p className="mb-6 inline-block rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
                {eligibilityReason === 'already reviewed this position'
                  ? 'คุณได้รีวิวตำแหน่งนี้ไปแล้ว'
                  : 'ระบบไม่พบตำแหน่งฝึกงานปัจจุบันของคุณสำหรับบริษัทนี้'}
              </p>
            ) : null}
            <Link to={`/company/${id}`} className="inline-block bg-blue-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800">กลับไปหน้าบริษัท</Link>
          </div>
        </div>
      ) : (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <Navbar />
      
      <div className="bg-blue-900 text-white py-10 px-4 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-3">
            เขียนรีวิวบริษัท {companyName || '-'}
          </h1>
          <div className="flex gap-6 text-base text-blue-200">
            <span>ตำแหน่ง: {internshipPositionTitle || '-'}</span>
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
            <div className="border rounded p-4">
              <h3 className="font-bold text-center mb-4">ด้านงาน</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span>ความท้าทาย</span>{renderStars('work_challenge')}</div>
                <div className="flex justify-between"><span>ความคิดสร้างสรรค์</span>{renderStars('work_creativity')}</div>
                <div className="flex justify-between"><span>การเติบโต</span>{renderStars('work_growth')}</div>
                <div className="flex justify-between"><span>เครื่องมือ</span>{renderStars('work_tools')}</div>
              </div>
            </div>

            <div className="border rounded p-4">
              <h3 className="font-bold text-center mb-4">ด้านชีวิต</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span>วัฒนธรรม</span>{renderStars('life_culture')}</div>
                <div className="flex justify-between"><span>บรรยากาศ</span>{renderStars('life_atmosphere')}</div>
                <div className="flex justify-between"><span>สวัสดิการ</span>{renderStars('life_welfare')}</div>
                <div className="flex justify-between"><span>ชั่วโมง</span>{renderStars('life_hours')}</div>
              </div>
            </div>

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
          {renderInfoSection()}

          <div className="flex justify-end gap-4 mt-4">
            <Link to={`/company/${id}`} className="border px-4 py-2 rounded">
              ยกเลิก
            </Link>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-blue-900 text-white px-6 py-2 rounded font-bold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังส่ง...' : 'ยืนยัน'}
            </button>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirmModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-center text-xl font-bold text-gray-900">ยืนยันการส่งความคิดเห็น</h3>
            <p className="mt-3 text-center text-sm text-gray-600">
              เมื่อกดยืนยัน ระบบจะส่งรีวิวของคุณและจะไม่สามารถแก้ไขภายหลังได้
            </p>
            <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
              <p className="font-semibold">โปรดตรวจสอบก่อนยืนยัน</p>
              <p className="mt-1 text-slate-200">
                คุณสามารถเขียนรีวิวได้เพียง 1 ครั้งต่อตำแหน่งฝึกงาน และไม่สามารถแก้ไขได้
              </p>
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                type="button"
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
                onClick={async () => {
                  setShowConfirmModal(false);
                  await handleSubmit();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังส่ง...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </>
  );
}