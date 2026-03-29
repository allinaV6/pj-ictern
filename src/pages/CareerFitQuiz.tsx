import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Search, Info, Check } from 'lucide-react';

export default function CareerFitQuiz() {
  const navigate = useNavigate();

  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/positions'); // ✅ แก้แล้ว

        const data = await res.json();

        // ✅ ใช้ข้อมูลจาก backend ได้เลย
        const mapped = data.map((p: any) => ({
          id: p.id,
          position_id: p.position_id,
          title: p.title,
          description: p.description
        }));

        setPositions(mapped);
      } catch (err) {
        console.error('Error fetching positions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  const handleSelect = (id: string) => {
    if (selectedPositions.includes(id)) {
      setSelectedPositions(selectedPositions.filter(posId => posId !== id));
    } else {
      if (selectedPositions.length < 3) {
        setSelectedPositions([...selectedPositions, id]);
      }
    }
  };

  const filteredPositions = positions.filter(pos =>
    pos.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pos.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartQuiz = () => {
    if (selectedPositions.length === 3) {
      const selectedPositionObjects = positions.filter(p =>
        selectedPositions.includes(p.id)
      );

      navigate('/quiz/start', {
        state: { selectedPositions: selectedPositionObjects }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading positions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            แบบประเมินความสนใจในสายอาชีพ
          </h1>
          <p className="text-blue-200 mb-6 text-lg">
            เลือกตำแหน่งที่คุณสนใจได้{' '}
            <span className="font-bold text-white">สูงสุด 3 ตำแหน่ง</span>
          </p>

          <div className="flex flex-col md:flex-row gap-3 max-w-2xl">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="ค้นหาตำแหน่ง เช่น Backend, UX"
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className="px-5 py-2.5 bg-white text-gray-700 rounded-lg"
              onClick={() => navigate('/quiz/result')}
            >
              ดูผลล่าสุด
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <h2 className="text-gray-700 mb-4 text-lg">
          มีทั้งหมด {filteredPositions.length} ตำแหน่ง
        </h2>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredPositions.map((position) => {
            const isSelected = selectedPositions.includes(position.id);
            const isDisabled = !isSelected && selectedPositions.length >= 3;

            return (
              <div
                key={position.id}
                className={`p-6 border-b flex gap-4 ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                } ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}
                onClick={() => !isDisabled && handleSelect(position.id)}
              >
                <div
                  className={`w-6 h-6 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-blue-600' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check size={16} className="text-white" />}
                </div>

                <div>
                  <h3 className="font-bold text-xl">{position.title}</h3>
                  <p className="text-gray-500 flex gap-2 items-center">
                    {position.description}
                    <Info size={16} />
                  </p>
                </div>
              </div>
            );
          })}

          {filteredPositions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              ไม่พบข้อมูล
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>เลือกแล้ว {selectedPositions.length}/3</span>

          <button
            disabled={selectedPositions.length !== 3}
            onClick={handleStartQuiz}
            className={`px-6 py-2 rounded font-bold ${
              selectedPositions.length === 3
                ? 'bg-blue-900 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            เริ่มทำแบบทดสอบ
          </button>
        </div>
      </div>
    </div>
  );
}