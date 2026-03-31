import AdminLayout from '../components/AdminLayout';
import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, Plus, ChevronDown, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Position {
  position_id: number;
  position_name: string;
}

export default function AdminPositionList() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/positions');
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบตำแหน่งงานนี้ใช่หรือไม่? (คำถามและสถิติที่เกี่ยวข้องจะถูกลบไปด้วย)')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/positions/${id}`);
      setPositions(prev => prev.filter(p => p.position_id !== id));
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const filteredPositions = positions.filter(p => 
    p.position_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const currentItems = filteredPositions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">Position Management</h1>
          <button
            className="flex items-center gap-2 bg-white text-blue-900 px-6 py-2.5 rounded-lg font-semibold text-base hover:bg-gray-100"
            onClick={() => navigate('/admin/positions/new')}
          >
            <Plus size={18} />
            เพิ่มตำแหน่งงานใหม่
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="ค้นหาตำแหน่ง"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
          <div className="px-6 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
            ชื่อตำแหน่ง
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : currentItems.length > 0 ? (
            currentItems.map((position) => (
              <div
                key={position.position_id}
                className="flex items-center justify-between px-6 py-4 text-base text-gray-800 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors duration-150 relative group"
              >
                <span className="font-medium cursor-pointer flex-grow" onClick={() => navigate(`/admin/positions/${position.position_id}`)}>
                  {position.position_name}
                </span>
                
                <div className="relative">
                  <button
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === position.position_id ? null : position.position_id);
                    }}
                  >
                    <MoreHorizontal size={18} className="text-gray-500" />
                  </button>

                  {openMenuId === position.position_id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 overflow-hidden">
                      <button
                        onClick={() => navigate(`/admin/positions/${position.position_id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={16} /> แก้ไขข้อมูล
                      </button>
                      <button
                        onClick={() => handleDelete(position.position_id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} /> ลบตำแหน่ง
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-20 text-gray-400 italic">ไม่พบข้อมูลตำแหน่งงาน</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>แสดงต่อหน้า :</span>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white flex items-center gap-2">
                {itemsPerPage}
                <ChevronDown size={14} className="text-gray-500" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button 
                className="px-2.5 py-1.5 border border-gray-300 rounded-l-lg bg-white disabled:opacity-40"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                «
              </button>
              <button 
                className="px-2.5 py-1.5 border border-gray-300 bg-white disabled:opacity-40"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    className={`px-3 py-1.5 border border-gray-300 ${
                      isActive ? 'bg-blue-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button 
                className="px-2.5 py-1.5 border border-gray-300 bg-white disabled:opacity-40"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={14} />
              </button>
              <button 
                className="px-2.5 py-1.5 border border-gray-300 rounded-r-lg bg-white disabled:opacity-40"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
