import AdminLayout from '../components/AdminLayout';
import { useState } from 'react';
import { Search, ChevronDown, MoreHorizontal, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminCompanyList() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const companies = [
    {
      id: 1,
      name: 'Creative Digital Agency Co., Ltd.',
      type: 'IT',
      totalPosts: 1,
      createdAt: '28/10/2025',
    },
    {
      id: 2,
      name: 'Innovate Systems Co., Ltd.',
      type: 'IT',
      totalPosts: 3,
      createdAt: '01/11/2025',
    },
  ];

  const totalPages = 5;

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">Company</h1>
          <button
            className="flex items-center gap-2 bg-white text-blue-900 px-6 py-2.5 rounded-lg font-semibold text-base hover:bg-gray-100"
            onClick={() => navigate('/admin/companies/new')}
          >
            <Plus size={18} />
            เพิ่มบริษัท
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, บริษัท"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-base">
            สถานะ
            <ChevronDown size={16} />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr] px-6 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
            <div>บริษัท</div>
            <div>ประเภท</div>
            <div className="flex items-center gap-1">
              โพสต์ทั้งหมด
            </div>
            <div className="flex items-center gap-1">
              วันที่สร้าง
              <span className="text-gray-300">⋀</span>
            </div>
            <div className="text-right pr-6">Logo</div>
          </div>

          {companies.map((company) => (
            <div
              key={company.id}
              className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr] px-6 py-4 text-base text-gray-800 items-center border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-blue-50 transition-colors duration-150"
              onClick={() => navigate(`/admin/companies/${company.id}`)}
            >
              <div>{company.name}</div>
              <div>{company.type}</div>
              <div>{company.totalPosts}</div>
              <div>{company.createdAt}</div>
              <div className="flex items-center justify-end gap-3 pr-2">
                <div className="w-9 h-9 rounded-md bg-blue-900 flex items-center justify-center text-white text-xs font-semibold">
                  Logo
                </div>
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>แสดงต่อหน้า :</span>
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white flex items-center gap-2">
              10
              <ChevronDown size={14} className="text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1.5 border border-gray-300 rounded-l-lg bg-white disabled:opacity-40">
              «
            </button>
            <button className="px-2.5 py-1.5 border border-gray-300 bg-white disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              const isActive = page === currentPage;
              if (page > 3 && page < totalPages - 1) {
                if (page === 4) {
                  return (
                    <span key={page} className="px-2.5 py-1.5 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              }
              return (
                <button
                  key={page}
                  className={`px-3 py-1.5 border border-gray-300 ${
                    isActive ? 'bg-blue-900 text-white' : 'bg-white text-gray-700'
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button className="px-2.5 py-1.5 border border-gray-300 bg-white disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
            <button className="px-2.5 py-1.5 border border-gray-300 rounded-r-lg bg-white disabled:opacity-40">
              »
            </button>
            <div className="flex items-center gap-2 ml-4">
              <span>ไปหน้า :</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const value = Number(e.target.value) || 1;
                  setCurrentPage(Math.min(Math.max(1, value), totalPages));
                }}
                className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-center"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
