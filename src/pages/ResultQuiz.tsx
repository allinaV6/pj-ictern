import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, RotateCcw } from 'lucide-react';

interface Position {
  id: string;
  title: string;
  description: string;
}

// Mock recommendations data
const RECOMMENDATIONS: Record<string, string[]> = {
  'ai-ml': [
    'ศึกษาคณิตศาสตร์และสถิติเบื้องต้น',
    'เรียนรู้ Python และ Library เช่น TensorFlow, PyTorch',
    'ทำโปรเจกต์วิเคราะห์ข้อมูลจริง'
  ],
  'backend': [
    'เรียนรู้ภาษาเช่น Java, Go, Node.js',
    'ฝึกออกแบบ Database และ API',
    'ศึกษาเรื่อง Server และ Cloud Deployment'
  ],
  'devops': [
    'ศึกษา Linux และ Command Line',
    'เรียนรู้เครื่องมือ CI/CD เช่น Jenkins, GitLab CI',
    'ฝึกใช้ Docker และ Kubernetes'
  ],
  'fullstack': [
    'เรียนรู้ทั้ง Frontend และ Backend',
    'ฝึกทำโปรเจกต์แบบ End-to-End',
    'ศึกษาเรื่อง Deployment และ Architecture'
  ],
  'uxui': [
    'เรียนรู้เครื่องมือ Figma ขั้นสูง',
    'ทำ Case Study การออกแบบเชิงลึก',
    'ฝึกฝนการทำ Usability Testing'
  ],
  'data-eng': [
    'เรียนรู้ SQL และ NoSQL',
    'ศึกษาเรื่อง ETL Pipeline',
    'ฝึกใช้ Cloud Data Services'
  ],
  // Fallback for others
  'default': [
    'ศึกษาพื้นฐานที่เกี่ยวข้อง',
    'หาคอร์สเรียนออนไลน์เพิ่มเติม',
    'ฝึกทำโปรเจกต์จริง'
  ]
};

export default function ResultQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPositions } = location.state as { selectedPositions: Position[] } || { selectedPositions: [] };

  useEffect(() => {
    if (!selectedPositions || selectedPositions.length === 0) {
      navigate('/quiz');
    }
  }, [selectedPositions, navigate]);

  if (!selectedPositions || selectedPositions.length === 0) {
    return null;
  }

  // Mock scores for demo (ensure winner is clear)
  const results = selectedPositions.map((pos, index) => {
    let score;
    if (index === 0) score = 95; // Winner
    else if (index === 1) score = 60;
    else score = 20;
    
    return { ...pos, score };
  }).sort((a, b) => b.score - a.score); // Sort by score descending

  const winner = results[0];
  const recommendations = RECOMMENDATIONS[winner.id] || RECOMMENDATIONS['default'];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center md:text-left">
          <h1 className="text-3xl font-bold mb-3">ตำแหน่งฝึกงานที่แนะนำจากผลการประเมินความสนใจในสายอาชีพ</h1>
          <p className="text-blue-200">
            เลือกตำแหน่งที่คุณสนใจได้ <span className="font-bold text-white">สูงสุด 3 ตำแหน่ง</span> เพื่อเริ่มทำแบบทดสอบที่เหมาะกับคุณ
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
            
            {/* Winner Section */}
            <div className="text-center mb-12">
                <h2 className="text-xl text-blue-900 font-bold mb-8">
                    ผลลัพธ์ตำแหน่งอันดับ 1 ของคุณคือ <span className="text-blue-600">{winner.title}</span>
                </h2>
                
                <h3 className="text-lg font-bold text-blue-900 mb-6">ภาพรวมผลการประเมินทักษะทั้ง 3 ตำแหน่ง</h3>
                
                {/* Bar Chart */}
                <div className="flex justify-center items-end gap-8 h-64 max-w-lg mx-auto mb-4">
                    {/* Render bars sorted by original selection order or score? 
                        Screenshot shows: Yellow (60%), Green (95%), Blue (20%). 
                        So it seems to be in specific order, with the winner in the middle/highlighted.
                        Let's try to match the screenshot layout: Bar 2 is winner.
                    */}
                    
                    {/* Re-ordering for display: [Runner-up, Winner, Last] */}
                    {[results[1], results[0], results[2]].filter(Boolean).map((item, index) => {
                        // Colors based on score/position in display
                        const isWinner = item.id === winner.id;
                        let barColor = 'bg-blue-400'; // Default low
                        if (isWinner) barColor = 'bg-green-600';
                        else if (item.score > 40) barColor = 'bg-yellow-400';
                        
                        return (
                            <div key={item.id} className="flex flex-col items-center gap-2 w-24">
                                <span className="font-bold text-gray-700">{item.score}%</span>
                                <div 
                                    className={`w-full rounded-t-lg transition-all duration-1000 ${barColor}`} 
                                    style={{ height: `${item.score * 2}px` }}
                                ></div>
                                <span className="text-sm font-bold text-blue-900 text-center leading-tight">{item.title}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="text-center text-gray-400 text-sm">ทำแบบทดสอบครั้งล่าสุดวันที่ 31/10/2568</div>
            </div>

            <hr className="border-gray-200 mb-8" />

            {/* Recommendations */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-blue-900 mb-4">แนวทางการพัฒนาทักษะ {winner.title}</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    {recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                    ))}
                </ul>
            </div>
            
            <hr className="border-gray-200 mb-8" />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                <Link to="/quiz" className="flex items-center gap-2 px-6 py-2 border rounded-lg hover:bg-gray-50 text-gray-600 font-bold">
                    ทำแบบทดสอบใหม่อีกครั้ง
                </Link>
                <Link to="/posts" className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800">
                    ค้นหาสถานที่ฝึกงาน
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}