import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ResultQuiz() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizDate, setQuizDate] = useState<string>("");

  useEffect(() => {
    if (!user?.student_id) {
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

  // ซ้าย(3) กลาง(1) ขวา(2)
  const display = [results[2], results[0], results[1]].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar />

      <div className="max-w-4xl mx-auto mt-10 bg-white p-10 rounded-lg shadow">

        {/* 🔥 อันดับ 1 */}
        <p className="text-blue-900 font-bold text-lg mb-4 border-b pb-2">
          ผลลัพธ์ตำแหน่งอันดับ 1 ของคุณคือ {results[0].name}
        </p>

        {/* 🔥 TITLE */}
        <h2 className="text-2xl font-bold text-center mb-10 text-blue-900">
          ภาพรวมผลการประเมินทักษะทั้ง 3 ตำแหน่ง
        </h2>

        {/* 🔥 GRAPH */}
        <div className="flex justify-center items-end gap-10 h-64 mb-10">

          {display.map((item, index) => {
            const isWinner = index === 1;

            return (
              <div key={index} className="flex flex-col items-center">

                <div className="mb-2 font-bold text-lg text-blue-900">
                  {item.percent}%
                </div>

                <div
                  className={`w-20 rounded-t transition-all duration-500 ${
                    isWinner
                      ? "bg-green-600"
                      : index === 0
                      ? "bg-yellow-400"
                      : "bg-blue-500"
                  }`}
                  style={{ height: `${item.percent * 2}px` }}
                />

                <div className="mt-3 text-center font-bold text-blue-900">
                  {item.name}
                </div>

              </div>
            );
          })}

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
            onClick={() => navigate('/posts')}
            className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            ค้นหาสถานที่ฝึกงาน
          </button>

        </div>

      </div>
    </div>
  );
}
