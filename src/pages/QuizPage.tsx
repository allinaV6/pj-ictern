import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
  const { selectedPositions } = location.state as { selectedPositions: Position[] } || { selectedPositions: [] };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // ✅ user
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // =========================
  // ✅ check login
  // =========================
  useEffect(() => {
    if (!user?.student_id) {
      alert("กรุณา login ก่อน");
      navigate("/");
    }
  }, []);

  // =========================
  // ✅ fetch questions
  // =========================
  useEffect(() => {
    if (!selectedPositions || selectedPositions.length === 0) {
      navigate('/quiz');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const ids = selectedPositions.map(p => p.position_id).join(',');

        const res = await fetch(`http://localhost:5000/api/questions?positions=${ids}`);

        if (!res.ok) {
          throw new Error("โหลดคำถามไม่สำเร็จ");
        }

        const data = await res.json();

        const shuffled = data.sort(() => Math.random() - 0.5);
        setQuestions(shuffled);

      } catch (err) {
        console.error(err);
        alert("โหลดคำถามไม่สำเร็จ");
      }
    };

    fetchQuestions();
  }, [selectedPositions, navigate]);

  // =========================
  // ✅ loading
  // =========================
  if (questions.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        กำลังโหลดคำถาม...
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];

  // =========================
  // ✅ handle answer
  // =========================
  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  // =========================
  // ✅ next
  // =========================
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  // =========================
  // ✅ prev
  // =========================
  const handlePrev = () => {
    setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  };

  // =========================
  // ✅ submit
  // =========================
  const handleSubmit = async () => {
    try {
      if (!user?.student_id) {
        alert("กรุณา login ก่อน");
        navigate("/");
        return;
      }

      const answerList = questions.map(q => ({
        question_id: q.id,
        answer: answers[q.id] || 0   // ✅ กัน undefined
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

      if (!res.ok) {
        alert("บันทึกไม่สำเร็จ");
        return;
      }

      alert("บันทึกสำเร็จ ✅");

      navigate('/quiz/result');

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar />

      <div className="max-w-3xl mx-auto mt-10 bg-white p-10 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-6">
          {currentQuestionIndex + 1}. {currentQuestion.question_text}
        </h2>

        <div className="space-y-3">
          {CHOICES.map(choice => (
            <button
              key={choice.value}
              onClick={() => handleAnswer(choice.value)}
              className={`w-full p-4 border rounded ${
                selectedAnswer === choice.value
                  ? 'bg-blue-100 border-blue-500'
                  : ''
              }`}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button 
            onClick={handlePrev} 
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft size={18} />
            ก่อนหน้า
          </button>

          <button 
            onClick={handleNext} 
            disabled={!selectedAnswer}
            className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {currentQuestionIndex === questions.length - 1 ? 'ส่ง' : 'ถัดไป'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
