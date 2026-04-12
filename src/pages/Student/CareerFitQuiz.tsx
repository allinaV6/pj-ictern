import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Search, Info, Check } from 'lucide-react';

export default function CareerFitQuiz() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const getQuizAccessMessage = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const roleStr = String(localStorage.getItem('role') || user?.role || '').trim().toLowerCase();
    const isAdmin = roleStr.includes('admin') || (Boolean(user?.admin_id) && !Boolean(user?.student_id));

    if (!user) return 'กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบ';
    if (isAdmin || !user?.student_id) return 'บัญชีนี้ไม่มีสิทธิ์ทำแบบทดสอบ กรุณาใช้บัญชี Student';
    return '';
  };

  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasLatestResult, setHasLatestResult] = useState(false);
  const [checkingLatestResult, setCheckingLatestResult] = useState(true);

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

  useEffect(() => {
    const checkLatestResult = async () => {
      const accessMessage = getQuizAccessMessage();
      if (accessMessage) {
        setHasLatestResult(false);
        setCheckingLatestResult(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/quiz/result/${user.student_id}`);
        if (!res.ok) {
          setHasLatestResult(false);
          return;
        }

        const data = await res.json();
        setHasLatestResult(Boolean(data && (data.position1 || data.position2 || data.position3)));
      } catch (err) {
        console.error('Error checking latest result:', err);
        setHasLatestResult(false);
      } finally {
        setCheckingLatestResult(false);
      }
    };

    checkLatestResult();
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
    String(pos.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(pos.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewLatestResult = () => {
    const accessMessage = getQuizAccessMessage();
    if (accessMessage) {
      alert(accessMessage);
      return;
    }

    if (!hasLatestResult) {
      alert('ยังไม่มีผลลัพธ์แบบทดสอบล่าสุด กรุณาเริ่มทำแบบทดสอบก่อน');
      return;
    }

    navigate('/quiz/result');
  };

  const handleStartQuiz = () => {
    const accessMessage = getQuizAccessMessage();
    if (accessMessage) {
      alert(accessMessage);
      return;
    }

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
      <div className="bg-blue-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            แบบประเมินความสนใจในสายอาชีพ
          </h1>
          <p className="text-blue-100 mb-7 text-lg md:text-xl">
            เลือกตำแหน่งที่คุณสนใจได้{' '}
            <span className="font-bold text-white">3 ตำแหน่ง</span>
          </p>

          <div className="flex flex-col md:flex-row gap-3 max-w-3xl">
            <div className="relative flex-grow min-w-[260px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="ค้นหาตำแหน่ง เช่น Backend, UX"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-gray-900 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className={`px-5 py-3 rounded-xl font-semibold border ${hasLatestResult
                ? 'bg-white text-gray-700 border-white hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
              onClick={handleViewLatestResult}
              disabled={checkingLatestResult || !hasLatestResult}
            >
              ดูผลลัพธ์ครั้งล่าสุด
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-6xl mx-auto px-4 mt-8 pb-24">
        <h2 className="text-gray-700 mb-3 text-base md:text-lg font-semibold">
          รายการตำแหน่งงานมีทั้งหมด {filteredPositions.length} ตำแหน่ง
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-200">
          {filteredPositions.map((position) => {
            const isSelected = selectedPositions.includes(position.id);
            const isDisabled = !isSelected && selectedPositions.length >= 3;

            return (
              <div
                key={position.id}
                className={`px-6 py-5 flex gap-4 ${
                  isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                } ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}
                onClick={() => !isDisabled && handleSelect(position.id)}
              >
                <div
                  className={`w-6 h-6 rounded-md border mt-1 flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && <Check size={16} className="text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl md:text-2xl leading-tight text-gray-800">{position.title}</h3>
                  <p className="text-gray-500 flex gap-2 items-center mt-2">
                    {position.description}
                    <Info size={16} className="text-blue-500 shrink-0" />
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="text-gray-700 text-lg">
            เลือกแล้ว {selectedPositions.length}/3 ตำแหน่ง
            {selectedPositions.length > 0 && (
              <button
                onClick={() => setSelectedPositions([])}
                className="ml-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                ล้างการเลือกทั้งหมด
              </button>
            )}
          </div>

          <button
            disabled={selectedPositions.length !== 3}
            onClick={handleStartQuiz}
            className={`px-10 py-3 rounded-xl font-bold text-lg ${
              selectedPositions.length === 3
                ? 'bg-blue-900 text-white hover:bg-blue-800'
                : 'bg-gray-300 text-gray-100 cursor-not-allowed'
            }`}
          >
            เริ่มทำแบบทดสอบ
          </button>
        </div>
      </div>
    </div>
  );
}