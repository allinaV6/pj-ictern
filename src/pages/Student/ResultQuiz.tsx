import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function ResultQuiz() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const getQuizAccessMessage = () => {
    const roleStr = String(localStorage.getItem('role') || user?.role || '').trim().toLowerCase();
    const isAdmin = roleStr.includes('admin') || (Boolean(user?.admin_id) && !Boolean(user?.student_id));

    if (!user) return 'กรุณาเข้าสู่ระบบก่อนดูผลแบบทดสอบ';
    if (isAdmin || !user?.student_id) return 'บัญชีนี้ไม่มีสิทธิ์ดูผลแบบทดสอบ กรุณาใช้บัญชี Student';
    return '';
  };

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizDate, setQuizDate] = useState<string>("");

  useEffect(() => {
    const accessMessage = getQuizAccessMessage();
    if (accessMessage) {
      alert(accessMessage);
      navigate("/");
      return;
    }

    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/quiz/result/${user.student_id}`);
      const data = await res.json();

      // ✅ คำนวณ % ต่อสายงาน
      const MAX_SCORE = 25;

      const percent = [
        {
          position_id: Number(data.position1),
          score: data.score1,
          percent: Math.round((data.score1 / MAX_SCORE) * 100)
        },
        {
          position_id: Number(data.position2),
          score: data.score2,
          percent: Math.round((data.score2 / MAX_SCORE) * 100)
        },
        {
          position_id: Number(data.position3),
          score: data.score3,
          percent: Math.round((data.score3 / MAX_SCORE) * 100)
        }
      ];

      // sort ranking
      percent.sort((a, b) => b.percent - a.percent);

      // ดึงข้อมูล position
      const ids = percent.map(p => p.position_id).join(',');

      const res2 = await fetch(`http://localhost:5000/api/positions/by-ids?ids=${ids}`);
      const posData = await res2.json();

      const map: any = {};
      posData.forEach((p: any) => {
        map[p.position_id] = p;
      });

      const final = percent.map(p => ({
        ...p,
        name: map[p.position_id]?.position_name || "Unknown",
        skill: map[p.position_id]?.position_skill || ""
      }));

      setResults(final);
      setQuizDate(data.quiz_date);

    } catch (err) {
      console.error(err);
      alert("โหลดผลลัพธ์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">กำลังโหลดผลลัพธ์...</div>;
  }

  if (results.length === 0) {
    return <div className="p-10 text-center">ยังไม่มีผลลัพธ์</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar />

      <div className="max-w-4xl mx-auto mt-10 bg-white p-10 rounded-lg shadow">

        {/* 🔥 อันดับ 1 (swapped content) */}
        <p className="text-blue-900 font-bold text-2xl mb-4 border-b pb-2">
          อันดับสายงานที่เหมาะสมกับคุณ
        </p>

        {/* 🔥 TITLE (swapped content) */}
        <h2 className="text-lg font-bold text-left mb-10 text-blue-900">
          ผลลัพธ์ตำแหน่งอันดับ 1 ของคุณคือ {results[0].name}
        </h2>

        {/* 🔥 RANKING TABLE */}
        <div className="mb-10">
          <div className="space-y-4">
            {results.map((item, index) => {
              const rankNumber = index + 1;
              const getRankColor = (rank: number) => {
                switch(rank) {
                  case 1: return "bg-green-100 border-l-4 border-green-600";
                  case 2: return "bg-blue-100 border-l-4 border-blue-600";
                  case 3: return "bg-gray-100 border-l-4 border-gray-600";
                  default: return "bg-gray-100";
                }
              };

              const getRankBadgeColor = (rank: number) => {
                switch(rank) {
                  case 1: return "bg-green-600 text-white";
                  case 2: return "bg-blue-600 text-white";
                  case 3: return "bg-gray-600 text-white";
                  default: return "bg-gray-600 text-white";
                }
              };

              return (
                <div key={index} className={`p-4 rounded-lg ${getRankColor(rankNumber)} transition-all hover:shadow-md`}>
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className={`w-12 h-12 rounded-full ${getRankBadgeColor(rankNumber)} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                      {rankNumber}
                    </div>

                    {/* Position Name & Score */}
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg text-gray-800">
                        {item.name}
                      </h3>
                    </div>

                    {/* Percentage & Progress Bar */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-2xl text-blue-900">
                          {item.percent}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.score}/25
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 bg-gray-300 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        rankNumber === 1
                          ? "bg-green-600"
                          : rankNumber === 2
                          ? "bg-blue-600"
                          : "bg-gray-600"
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🔥 DATE */}
        <p className="text-center text-gray-500 mb-6">
          ทำแบบทดสอบครั้งล่าสุดวันที่{" "}
          {quizDate
            ? new Date(quizDate).toLocaleDateString('th-TH')
            : "-"}
        </p>

        <hr className="my-6" />

        {/* 🔥 SKILL */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-blue-900 mb-3">
            แนวทางการพัฒนาทักษะ {results[0].name}
          </h3>

          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            {results[0].skill
              ? results[0].skill.split('\n').map((line: string, i: number) => (
                  <li key={i}>{line}</li>
                ))
              : <li>ยังไม่มีข้อมูล</li>}
          </ul>
        </div>

        <hr className="my-6" />

        {/* 🔥 BUTTONS */}
        <div className="flex justify-end gap-4 mt-6">

          <button
            onClick={() => navigate('/quiz')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            ทำแบบทดสอบใหม่อีกครั้ง
          </button>

          <button
            onClick={() => {
              const topPositionName = results[0]?.name || '';
              navigate(`/posts?search=${encodeURIComponent(topPositionName)}`);
            }}
            className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            ค้นหาสถานที่ฝึกงาน
          </button>

        </div>

      </div>
    </div>
  );
}
