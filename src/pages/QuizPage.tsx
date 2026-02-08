import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Position {
  id: string;
  title: string;
  description: string;
}

// Mock questions
const QUESTIONS = [
  {
    id: 1,
    text: "ผม/ฉันชอบตรวจสอบความถูกต้องของระบบก่อนเปิดใช้งาน"
  },
  {
    id: 2,
    text: "ผม/ฉันชอบการออกแบบที่เน้นความสวยงามและใช้งานง่าย"
  },
  {
    id: 3,
    text: "ผม/ฉันสนใจในการจัดการข้อมูลจำนวนมากให้เป็นระบบ"
  },
  {
    id: 4,
    text: "ผม/ฉันชอบแก้ปัญหาทางเทคนิคที่ซับซ้อน"
  },
  {
    id: 5,
    text: "ผม/ฉันชอบทำงานร่วมกับผู้อื่นเพื่อระดมความคิดเห็น"
  }
];

// Mock answers
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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!selectedPositions || selectedPositions.length === 0) {
      navigate('/quiz');
    }
  }, [selectedPositions, navigate]);

  if (!selectedPositions || selectedPositions.length === 0) {
    return null;
  }

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [QUESTIONS[currentQuestionIndex].id]: value });
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
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
    // In a real app, calculate score here.
    // For demo, we just pass the positions to result page and it will randomize/mock the winner.
    navigate('/quiz/result', { state: { selectedPositions } });
  };

  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center md:text-left">
          <h1 className="text-3xl font-bold mb-3">แบบทดสอบรวมของตำแหน่งที่คุณเลือก</h1>
          <p className="text-blue-200">
            ตำแหน่งที่คุณเลือกคือ <span className="font-bold text-white">{selectedPositions.map(p => p.title).join(', ')}</span>
          </p>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 min-h-[400px] flex flex-col">
          <h2 className="text-xl font-bold text-blue-900 mb-8">
            {currentQuestionIndex + 1}. {currentQuestion.text}
          </h2>

          <div className="space-y-3 flex-grow">
            {CHOICES.map((choice) => (
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

        {/* Navigation Bar */}
        <div className="flex items-center justify-between mt-8">
            <button 
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg border bg-white ${currentQuestionIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
            >
               <ArrowLeft size={20} /> ก่อนหน้า
            </button>

            <div className="font-bold text-gray-700">
                คำถามที่ {currentQuestionIndex + 1}/{QUESTIONS.length}
            </div>

            <button 
              onClick={handleNext}
              disabled={!selectedAnswer}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white ${!selectedAnswer ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'}`}
            >
               {currentQuestionIndex === QUESTIONS.length - 1 ? 'ส่งคำตอบ' : 'ถัดไป'} 
               {currentQuestionIndex !== QUESTIONS.length - 1 && <ArrowRight size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
}