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

  useEffect(() => {
    if (!selectedPositions || selectedPositions.length === 0) {
      navigate('/quiz');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const ids = selectedPositions.map(p => p.position_id).join(',');

        const res = await fetch(`http://localhost:5000/api/questions?positions=${ids}`);
        const data = await res.json();

        const shuffled = data.sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      } catch (err) {
        console.error(err);
      }
    };

    fetchQuestions();
  }, [selectedPositions, navigate]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">กำลังโหลดคำถาม...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    navigate('/quiz/result', { state: { answers, questions } });
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <Navbar />

      {/* 🔵 Header */}
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            แบบทดสอบรวมของตำแหน่งที่คุณเลือก
          </h1>
          <p className="text-blue-200 text-lg">
            {selectedPositions.map(p => p.title).join(', ')}
          </p>
        </div>
      </div>

      {/* 🟦 Question Card */}
      <div className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow-sm border p-10 min-h-[420px] flex flex-col">

          {/* 🔥 Progress bar */}
          <div className="w-full bg-gray-200 h-2 rounded mb-6">
            <div
              className="bg-blue-600 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 🔥 Question */}
          <h2 className="text-2xl font-bold text-blue-900 mb-8">
            {currentQuestionIndex + 1}. {currentQuestion.question_text}
          </h2>

          {/* 🔥 Choices */}
          <div className="space-y-3 flex-grow">
            {CHOICES.map(choice => (
              <button
                key={choice.value}
                onClick={() => handleAnswer(choice.value)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedAnswer === choice.value
                    ? 'bg-blue-100 border-blue-500 text-blue-900 font-bold'
                    : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700'
                }`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🔽 Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border ${
              currentQuestionIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft size={20} /> ก่อนหน้า
          </button>

          <div className="font-bold text-gray-700">
            คำถาม {currentQuestionIndex + 1}/{questions.length}
          </div>

          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white ${
              !selectedAnswer
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-900 hover:bg-blue-800'
            }`}
          >
            {currentQuestionIndex === questions.length - 1 ? 'ส่งคำตอบ' : 'ถัดไป'}
            {currentQuestionIndex !== questions.length - 1 && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}