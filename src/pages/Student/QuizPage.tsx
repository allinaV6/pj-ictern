import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';

interface Position {
  id: string;
  position_id: number;
  title: string;
  description: string;
}

interface Question {
  id: number;
  question_text: string;
  position_id: number;
}

const CHOICES = [
  { label: "A. มากที่สุด", value: 5 },
  { label: "B. มาก", value: 4 },
  { label: "C. ปานกลาง", value: 3 },
  { label: "D. น้อย", value: 2 },
  { label: "E. น้อยที่สุด", value: 1 }
];

export default function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as { selectedPositions?: Position[] }) || {};
  const selectedPositions = Array.isArray(state.selectedPositions) ? state.selectedPositions : [];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const getQuizAccessMessage = () => {
    const roleStr = String(localStorage.getItem('role') || user?.role || '').trim().toLowerCase();
    const isAdmin = roleStr.includes('admin') || (Boolean(user?.admin_id) && !Boolean(user?.student_id));

    if (!user) return 'กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบ';
    if (isAdmin || !user?.student_id) return 'บัญชีนี้ไม่มีสิทธิ์ทำแบบทดสอบ กรุณาใช้บัญชี Student';
    return '';
  };

  const selectedPositionTitles = useMemo(
    () => selectedPositions.map((p) => String(p.title || '').trim()).filter(Boolean),
    [selectedPositions]
  );

  useEffect(() => {
    const accessMessage = getQuizAccessMessage();
    if (accessMessage) {
      alert(accessMessage);
      navigate("/");
      return;
    }

    if (!selectedPositions.length) {
      alert("ไม่พบข้อมูลตำแหน่งที่เลือก กรุณาเลือกตำแหน่งใหม่อีกครั้ง");
      navigate('/quiz');
    }
  }, [navigate, selectedPositions.length]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (!selectedPositions.length) return;

        setLoading(true);
        const orderedPositionIds = selectedPositions.map((p) => Number(p.position_id));
        const ids = orderedPositionIds.join(',');

        const res = await fetch(`http://localhost:5000/api/questions?positions=${ids}`);

        if (!res.ok) {
          throw new Error("โหลดคำถามไม่สำเร็จ");
        }

        const data: Question[] = await res.json();

        // Keep the position order selected by the user so question flow is predictable.
        const orderedQuestions = orderedPositionIds.flatMap((pid) =>
          data.filter((q) => Number(q.position_id) === pid)
        );

        const hasEnoughQuestions = orderedPositionIds.every(
          (pid) => orderedQuestions.filter((q) => Number(q.position_id) === pid).length >= 5
        );

        if (!hasEnoughQuestions || orderedQuestions.length === 0) {
          alert('ข้อมูลคำถามของบางตำแหน่งไม่ครบ 5 ข้อ กรุณาติดต่อผู้ดูแลระบบ');
          navigate('/quiz');
          return;
        }

        setQuestions(orderedQuestions);

      } catch (err) {
        console.error(err);
        alert("โหลดคำถามไม่สำเร็จ");
        navigate('/quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedPositions, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] pb-24">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-500">
          กำลังโหลดคำถาม...
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] pb-24">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-500">
          ไม่พบคำถามสำหรับแบบทดสอบนี้
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];
  const totalQuestions = questions.length;

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      alert("กรุณาเลือกคำตอบ");
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await handleSubmit();
    }
  };

  const handlePrev = () => {
    setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      const accessMessage = getQuizAccessMessage();
      if (accessMessage) {
        alert(accessMessage);
        navigate("/");
        return;
      }

      const hasUnanswered = questions.some((q) => !answers[q.id]);
      if (hasUnanswered) {
        alert('กรุณาตอบคำถามให้ครบทุกข้อก่อนส่ง');
        return;
      }

      setIsSubmitting(true);

      const answerList = questions.map(q => ({
        question_id: q.id,
        answer: answers[q.id] || 0
      }));

      const payload = {
        student_id: user.student_id,
        positions: selectedPositions.map(p => p.position_id),
        answers: answerList
      };

      const res = await fetch("http://localhost:5000/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "บันทึกไม่สำเร็จ");
        return;
      }

      alert("บันทึกสำเร็จ ✅");

      navigate('/quiz/result');

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24">
      <Navbar />

      <section className="bg-blue-900 text-white py-7 px-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-[2rem] font-bold leading-tight">
            แบบทดสอบรวมของตำแหน่งที่คุณเลือก
          </h1>
          <p className="mt-2 text-base md:text-xl font-semibold text-blue-100 leading-snug">
            ตำแหน่งที่คุณเลือกคือ {selectedPositionTitles.join(', ')}
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pt-5 md:pt-6">
        <div className="mx-auto w-full max-w-[760px] bg-white border border-gray-300 shadow-sm rounded-sm px-5 py-6 md:px-7 md:py-7">
          <h2 className="text-xl md:text-2xl font-extrabold text-[#123a7a] leading-tight">
            {currentQuestionIndex + 1}. {currentQuestion.question_text}
          </h2>

          <div className="mt-6 space-y-2.5">
            {CHOICES.map((choice) => {
              const isActive = selectedAnswer === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => handleAnswer(choice.value)}
                  className={[
                    'w-full text-left px-4 py-3.5 md:px-5 md:py-3.5 rounded-sm border text-lg md:text-xl font-semibold transition-colors',
                    isActive
                      ? 'bg-[#dbeafe] border-[#2563eb] text-[#1e3a8a]'
                      : 'bg-[#d1d5db] border-[#d1d5db] text-[#374151] hover:bg-[#c7ccd3]'
                  ].join(' ')}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-4 py-2.5 md:py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            className="min-w-[120px] px-4 py-2 border border-gray-400 rounded-lg text-sm md:text-base font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            ก่อนหน้า
          </button>

          <div className="text-base md:text-xl font-bold text-gray-800">
            คำถามที่ {currentQuestionIndex + 1}/{totalQuestions}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="min-w-[120px] px-4 py-2 rounded-lg text-sm md:text-base font-semibold bg-[#1e3a8a] text-white hover:bg-[#1d3579] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {currentQuestionIndex === totalQuestions - 1
              ? (isSubmitting ? 'กำลังส่ง...' : 'ส่งคำตอบ')
              : 'ถัดไป'}
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
