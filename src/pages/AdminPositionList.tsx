import AdminLayout from '../components/AdminLayout';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Search, MoreHorizontal, Plus, ChevronDown, ChevronLeft, ChevronRight, Trash2, Edit, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { exportDataToExcel, parseExcelFile } from '../lib/exportExcel';

interface Position {
  position_id: number;
  position_name: string;
  position_description?: string;
  position_skill?: string;
}

interface PositionDetail extends Position {
  questions?: Array<{ quiz_question: string }>;
}

export default function AdminPositionList() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'position_name' | 'position_description'>('position_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const parseNumber = (value: any, fallback = 0) => {
    if (typeof value === 'number') return value;
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const handleExportPositions = async () => {
    if (filteredPositions.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    try {
      const detailedPositions: PositionDetail[] = await Promise.all(
        filteredPositions.map(async (position) => {
          const response = await axios.get(`http://localhost:5000/api/admin/positions/${position.position_id}`);
          return response.data;
        })
      );

      const exportRows = detailedPositions.map((position) => {
        const questions = Array.isArray(position.questions) ? position.questions : [];
        return {
          'Position ID': position.position_id,
          'Position Name': position.position_name,
          'Description': position.position_description || '',
          'Skill Guide': position.position_skill || '',
          'Question 1': questions[0]?.quiz_question || '',
          'Question 2': questions[1]?.quiz_question || '',
          'Question 3': questions[2]?.quiz_question || '',
          'Question 4': questions[3]?.quiz_question || '',
          'Question 5': questions[4]?.quiz_question || '',
        };
      });

      exportDataToExcel(exportRows, 'Positions', [
        { header: 'Position ID', key: 'Position ID' },
        { header: 'Position Name', key: 'Position Name' },
        { header: 'Description', key: 'Description' },
        { header: 'Skill Guide', key: 'Skill Guide' },
        { header: 'Question 1', key: 'Question 1' },
        { header: 'Question 2', key: 'Question 2' },
        { header: 'Question 3', key: 'Question 3' },
        { header: 'Question 4', key: 'Question 4' },
        { header: 'Question 5', key: 'Question 5' },
      ]);
    } catch (error) {
      console.error('Error exporting positions:', error);
      alert('ไม่สามารถส่งออกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleImportPositions = async (file: File) => {
    try {
      const rows = await parseExcelFile(file);
      const imported = rows.map((row) => ({
        position_id: parseNumber(row['Position ID']),
        position_name: String(row['Position Name'] || row['position_name'] || ''),
        position_description: String(row['Description'] || row['position_description'] || ''),
        position_skill: String(row['Skill Guide'] || row['position_skill'] || ''),
        questions: [
          String(row['Question 1'] || row['question1'] || row['Question1'] || '').trim(),
          String(row['Question 2'] || row['question2'] || row['Question2'] || '').trim(),
          String(row['Question 3'] || row['question3'] || row['Question3'] || '').trim(),
          String(row['Question 4'] || row['question4'] || row['Question4'] || '').trim(),
          String(row['Question 5'] || row['question5'] || row['Question5'] || '').trim(),
        ],
      }));

      await axios.post('http://localhost:5000/api/admin/positions/import', imported);
      await fetchPositions();
      setCurrentPage(1);
      setImportExportOpen(false);
      alert('นำเข้าข้อมูลสำเร็จ และอัปเดตลงฐานข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error importing positions:', error);
      alert('ไม่สามารถนำเข้าไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์หรือข้อมูลในไฟล์ Excel');
    }
  };

  const onPositionFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert('ไฟล์ไม่ถูกต้อง');
      e.target.value = '';
      return;
    }

    await handleImportPositions(file);
    e.target.value = '';
  };

  const filteredPositions = useMemo(() => {
    return positions.filter(p =>
      p.position_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [positions, searchTerm]);

  const toggleSort = (key: 'position_name' | 'position_description') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const renderSortIcon = (key: 'position_name' | 'position_description') => {
    if (sortKey !== key) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortDir === 'asc'
      ? <ArrowUp size={14} className="text-blue-700" />
      : <ArrowDown size={14} className="text-blue-700" />;
  };

  const sortedPositions = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredPositions].sort((a, b) => {
      const aText = String(a[sortKey] || '');
      const bText = String(b[sortKey] || '');
      return aText.localeCompare(bText, 'th', { sensitivity: 'base' }) * dir;
    });
  }, [filteredPositions, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedPositions.length / itemsPerPage);
  const currentItems = sortedPositions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold">Position Management</h1>
          <button
            className="flex items-center gap-2 bg-white text-blue-900 px-6 py-2.5 rounded-lg font-semibold text-base hover:bg-gray-100 transition-colors shadow-sm"
            onClick={() => navigate('/admin/positions/new')}
          >
            <Plus size={18} />
            เพิ่มตำแหน่งงานใหม่
          </button>
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto px-4 py-8"
        onClick={() => {
          setOpenMenuId(null);
          setImportExportOpen(false);
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative max-w-md flex-1">
            <input
              type="text"
              placeholder="ค้นหาตำแหน่ง"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <button
                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg font-semibold text-base hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setImportExportOpen((prev) => !prev);
                }}
              >
                <Download size={18} />
                Import/Export
              </button>
              {importExportOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Import from Excel
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportPositions();
                      setImportExportOpen(false);
                    }}
                  >
                    Export to Excel
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onPositionFileChange}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
          <div className="grid grid-cols-[1.4fr_2.6fr_56px] px-6 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 gap-4">
            <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('position_name')}>
              ชื่อตำแหน่ง {renderSortIcon('position_name')}
            </button>
            <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('position_description')}>
              คำอธิบายตำแหน่งงาน {renderSortIcon('position_description')}
            </button>
            <div></div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : currentItems.length > 0 ? (
            currentItems.map((position) => (
              <div
                key={position.position_id}
                className="grid grid-cols-[1.4fr_2.6fr_56px] items-center px-6 py-4 text-base text-gray-800 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors duration-150 relative group gap-4"
              >
                <span className="font-medium cursor-pointer min-w-0 truncate" onClick={() => navigate(`/admin/positions/${position.position_id}`)} title={position.position_name}>
                  {position.position_name}
                </span>

                <span className="text-gray-500 text-sm min-w-0 truncate" title={position.position_description || ''}>
                  {position.position_description || '-'}
                </span>
                
                <div className="relative justify-self-end">
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
            <div className="flex items-center justify-center py-20 text-gray-400 italic">ไม่พบข้อมูล</div>
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
