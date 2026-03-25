import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, Info, Check } from 'lucide-react';

const POSITIONS = [
  {
    id: 'ai-ml',
    position_id: 1,
    title: 'AI / Machine Learning',
    description: 'ออกแบบและพัฒนาโมเดลที่เรียนรู้จากข้อมูล เพื่อช่วยให้ระบบตัดสินใจได้อย่างชาญฉลาด'
  },
  {
    id: 'backend',
    position_id: 2,
    title: 'Backend Developer',
    description: 'พัฒนาโครงสร้างหลังบ้าน เช่น ระบบฐานข้อมูลและ API เพื่อให้เว็บ/แอปทำงานได้อย่างราบรื่น'
  },
  {
    id: 'devops',
    position_id: 3,
    title: 'DevOps Engineer',
    description: 'ดูแลให้ระบบพัฒนาและการปล่อยงานทำงานอัตโนมัติ มีประสิทธิภาพ และเสถียรอยู่เสมอ'
  },
  {
    id: 'fullstack',
    position_id: 4,
    title: 'Fullstack Developer',
    description: 'พัฒนาเว็บหรือแอปทั้งฝั่งหน้าและหลัง ครอบคลุมตั้งแต่การออกแบบจนถึงการ deploy'
  },
  {
    id: 'uxui',
    position_id: 5,
    title: 'UX/UI Designer',
    description: 'ออกแบบประสบการณ์และหน้าตาเว็บ/แอปให้ใช้งานง่าย ดึงดูด และตอบโจทย์ผู้ใช้'
  },
  {
    id: 'data-eng',
    position_id: 6,
    title: 'Data Engineering',
    description: 'สร้างและดูแลโครงสร้างข้อมูล ให้ทีมสามารถนำข้อมูลไปวิเคราะห์และใช้งานได้อย่างมีประสิทธิภาพ'
  },
  {
    id: 'cloud',
    position_id: 7,
    title: 'Cloud Engineering',
    description: 'ดูแลโครงสร้างระบบบนคลาวด์ให้ปลอดภัย มีเสถียรภาพ และรองรับการขยายตัวของระบบ'
  },
  {
    id: 'frontend',
    position_id: 8,
    title: 'Frontend Developer',
    description: 'พัฒนาและปรับปรุงส่วนติดต่อผู้ใช้ (UI) ให้ใช้งานง่าย ตอบสนองไว และสวยงามบนทุกอุปกรณ์'
  },
  {
    id: 'iot',
    position_id: 9,
    title: 'IoT Developer',
    description: 'พัฒนาอุปกรณ์และระบบที่เชื่อมต่อกับอินเทอร์เน็ต เพื่อสร้างนวัตกรรมที่เชื่อมโยงโลกจริงกับดิจิทัล'
  },
  {
    id: 'data-science',
    position_id: 10,
    title: 'Data Science',
    description: 'วิเคราะห์ข้อมูลเพื่อหาแนวโน้มหรือคำตอบเชิงธุรกิจ'
  },
  {
    id: 'qa',
    position_id: 11,
    title: 'QA Engineer (Quality Assurance)',
    description: 'ทดสอบ ตรวจสอบ และรับรองคุณภาพของซอฟต์แวร์ให้ทำงานถูกต้องและปราศจากบั๊ก'
  },
  {
    id: 'ba',
    position_id: 12,
    title: 'Business Analyst',
    description: 'ทำความเข้าใจความต้องการของธุรกิจ วิเคราะห์ปัญหา และแนะนำแนวทางปรับปรุงด้วยเทคโนโลยี'
  },
  {
    id: 'cybersecurity',
    position_id: 13,
    title: 'Cybersecurity',
    description: 'ปกป้องระบบและข้อมูลจากภัยคุกคามออนไลน์ ตรวจจับและจัดการความเสี่ยงด้านความปลอดภัย'
  },
  {
    id: 'data-analyst',
    position_id: 14,
    title: 'Data Analyst',
    description: 'วิเคราะห์และตีความข้อมูล เพื่อช่วยให้ทีมเข้าใจแนวโน้มและตัดสินใจได้ดีขึ้น เหมาะกับคนชอบตัวเลขและการหาความหมายจากข้อมูล'
  }
];

export default function CareerFitQuiz() {
  const navigate = useNavigate();
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (id: string) => {
    if (selectedPositions.includes(id)) {
      setSelectedPositions(selectedPositions.filter(posId => posId !== id));
    } else {
      if (selectedPositions.length < 3) {
        setSelectedPositions([...selectedPositions, id]);
      }
    }
  };

  const filteredPositions = POSITIONS.filter(pos => 
    pos.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pos.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartQuiz = () => {
    if (selectedPositions.length === 3) {
      // Find full position objects
      const selectedPositionObjects = POSITIONS.filter(p => selectedPositions.includes(p.id));
      navigate('/quiz/start', { state: { selectedPositions: selectedPositionObjects } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">แบบประเมินความสนใจในสายอาชีพ</h1>
          <p className="text-blue-200 mb-6 text-lg">เลือกตำแหน่งที่คุณสนใจได้ <span className="font-bold text-white">สูงสุด 3 ตำแหน่ง</span> เพื่อเริ่มทำแบบทดสอบที่เหมาะกับคุณ</p>
          
          <div className="flex flex-col md:flex-row gap-3 max-w-2xl">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาตำแหน่งที่สนใจ เช่น UX, Backend" 
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="px-5 py-2.5 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm text-base"
              onClick={() => navigate('/quiz/result')}
>
  ดูผลลัพธ์ครั้งล่าสุด
</button>
          </div>
        </div>
      </div>

      {/* Position List */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <h2 className="text-gray-700 mb-4 text-lg">รายการตำแหน่งงานที่มีทั้งหมด {filteredPositions.length} ตำแหน่ง</h2>
        
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredPositions.map((position, index) => {
            const isSelected = selectedPositions.includes(position.id);
            const isDisabled = !isSelected && selectedPositions.length >= 3;

            return (
              <div 
                key={position.id} 
                className={`p-6 border-b last:border-b-0 flex items-start gap-4 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !isDisabled && handleSelect(position.id)}
              >
                <div className={`w-6 h-6 rounded border flex-shrink-0 flex items-center justify-center mt-1 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  {isSelected && <Check size={16} className="text-white" />}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-xl ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{position.title}</h3>
                  </div>
                  <div className="text-gray-500 text-base flex items-center gap-2">
                    {position.description}
                    <Info size={16} className="text-blue-400" />
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredPositions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              ไม่พบตำแหน่งงานที่ค้นหา
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 text-base">
             <span className="font-bold text-gray-800">เลือกแล้ว {selectedPositions.length}/3 ตำแหน่ง</span>
             <span className="text-gray-300">|</span>
             <button 
               className="text-blue-600 hover:underline"
               onClick={() => setSelectedPositions([])}
             >
               ล้างการเลือกทั้งหมด
             </button>
          </div>
          
          <button 
            className={`px-7 py-2.5 rounded-lg font-bold text-base transition-colors ${selectedPositions.length === 3 ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={selectedPositions.length !== 3}
            onClick={handleStartQuiz}
          >
            {selectedPositions.length === 3 ? 'เริ่มทำแบบทดสอบ' : 'เลือกให้ครบ 3 ตำแหน่ง'}
          </button>
        </div>
      </div>
    </div>
  );
}
