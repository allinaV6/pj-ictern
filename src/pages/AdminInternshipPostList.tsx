import AdminLayout from '../components/AdminLayout';
import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Search, Plus, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { exportDataToExcel, parseExcelFile } from '../lib/exportExcel';

interface Post {
  post_id: number;
  company_id: number;
  internship_title: string;
  internship_location: string;
  internship_duration: string;
  internship_description: string;
  internship_responsibilities: string;
  internship_requirements: string;
  internship_compensation: string;
  internship_working_method: string;
  internship_link: string;
  internship_create_date: string;
  internship_expired_date: string;
  internship_status: number;
  mou: number;
  company_name: string;
}

export default function AdminInternshipPostList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<'internship_title' | 'company_name' | 'internship_create_date' | 'internship_expired_date' | 'internship_status'>('internship_create_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [importExportOpen, setImportExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportPosts = () => {
    if (sortedPosts.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    const exportRows = sortedPosts.map((post) => ({
      'Post ID': post.post_id,
      'Company ID': post.company_id,
      'Company Name': post.company_name,
      'Title': post.internship_title,
      'Location': post.internship_location,
      'Duration': post.internship_duration,
      'Description': post.internship_description,
      'Responsibilities': post.internship_responsibilities,
      'Requirements': post.internship_requirements,
      'Compensation': post.internship_compensation,
      'Working Method': post.internship_working_method,
      'Link': post.internship_link,
      'Created Date': post.internship_create_date
        ? new Date(post.internship_create_date).toLocaleDateString('th-TH')
        : '',
      'Expired Date': post.internship_expired_date
        ? new Date(post.internship_expired_date).toLocaleDateString('th-TH')
        : '',
      'Status': (post.internship_status ?? 1) === 1 ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร',
      'MOU': post.mou === 1 ? 'Yes' : 'No',
    }));

    exportDataToExcel(exportRows, 'Internship_Posts', [
      { header: 'Post ID', key: 'Post ID' },
      { header: 'Company ID', key: 'Company ID' },
      { header: 'Company Name', key: 'Company Name' },
      { header: 'Title', key: 'Title' },
      { header: 'Location', key: 'Location' },
      { header: 'Duration', key: 'Duration' },
      { header: 'Description', key: 'Description' },
      { header: 'Responsibilities', key: 'Responsibilities' },
      { header: 'Requirements', key: 'Requirements' },
      { header: 'Compensation', key: 'Compensation' },
      { header: 'Working Method', key: 'Working Method' },
      { header: 'Link', key: 'Link' },
      { header: 'Created Date', key: 'Created Date' },
      { header: 'Expired Date', key: 'Expired Date' },
      { header: 'Status', key: 'Status' },
      { header: 'MOU', key: 'MOU' },
    ]);
  };

  const parseNumber = (value: any, fallback = 0) => {
    if (typeof value === 'number') return value;
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const parseStatus = (value: any) => {
    const normalized = String(value).toLowerCase();
    if (normalized.includes('ปิด') || normalized.includes('inactive') || normalized === '0') return 0;
    return 1;
  };

  const parseYesNo = (value: any) => {
    const normalized = String(value).toLowerCase();
    return normalized === 'yes' || normalized === 'y' || normalized === 'true' || normalized.includes('ใช่') ? 1 : 0;
  };

  const parseDateValue = (value: any) => {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return String(value);
  };

  const handleImportPosts = async (file: File) => {
    try {
      const rows = await parseExcelFile(file);
      const imported = rows.map((row) => ({
        post_id: parseNumber(row['Post ID']),
        company_id: parseNumber(row['Company ID']),
        internship_title: String(row['Title'] || row['Internship Title'] || ''),
        internship_location: String(row['Location'] || ''),
        internship_duration: String(row['Duration'] || ''),
        internship_description: String(row['Description'] || ''),
        internship_responsibilities: String(row['Responsibilities'] || ''),
        internship_requirements: String(row['Requirements'] || ''),
        internship_compensation: String(row['Compensation'] || ''),
        internship_working_method: String(row['Working Method'] || ''),
        internship_link: String(row['Link'] || ''),
        internship_create_date: parseDateValue(row['Created Date'] || ''),
        internship_expired_date: parseDateValue(row['Expired Date'] || ''),
        internship_status: parseStatus(row['Status']),
        mou: parseYesNo(row['MOU']),
        company_name: String(row['Company Name'] || ''),
      }));

      setPosts(imported);
      setPage(1);
      setImportExportOpen(false);
      alert('นำเข้าไฟล์เรียบร้อยแล้ว ข้อมูลตารางจะถูกแทนที่ด้วยข้อมูลจากไฟล์ Excel');
    } catch (error) {
      console.error('Error importing posts:', error);
      alert('ไม่สามารถนำเข้าไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์ Excel');
    }
  };

  const onPostFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert('ไฟล์ไม่ถูกต้อง');
      e.target.value = '';
      return;
    }

    await handleImportPosts(file);
    e.target.value = '';
  };


  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) {
      try {
        await axios.delete(`http://localhost:5000/api/posts/${id}`);
        setPosts((prev) => prev.filter(post => post.post_id !== id));
        setOpenMenuPostId(null);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('เกิดข้อผิดพลาดในการลบโพสต์');
      }
    }
  };

  const filteredPosts = posts
    .filter((post) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        post.internship_title.toLowerCase().includes(q) ||
        post.company_name.toLowerCase().includes(q)
      );
    })
    .filter((post) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'open') return (post.internship_status ?? 1) === 1;
      return (post.internship_status ?? 1) === 0;
    });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;

    if (sortKey === 'internship_create_date') {
      const at = a.internship_create_date ? new Date(a.internship_create_date).getTime() : 0;
      const bt = b.internship_create_date ? new Date(b.internship_create_date).getTime() : 0;
      return (at - bt) * dir;
    }

    if (sortKey === 'internship_expired_date') {
      const at = a.internship_expired_date ? new Date(a.internship_expired_date).getTime() : 0;
      const bt = b.internship_expired_date ? new Date(b.internship_expired_date).getTime() : 0;
      return (at - bt) * dir;
    }

    if (sortKey === 'internship_status') {
      const av = a.internship_status ?? 1;
      const bv = b.internship_status ?? 1;
      return (av - bv) * dir;
    }

    const av = (a[sortKey] || '').toString().toLowerCase();
    const bv = (b[sortKey] || '').toString().toLowerCase();
    return av.localeCompare(bv) * dir;
  });

  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = sortedPosts.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize, sortKey, sortDir]);

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold">Internship Post Management</h1>
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto px-4 py-8"
        onClick={() => {
          setOpenMenuPostId(null);
          setImportExportOpen(false);
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่อ, บริษัท"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <select
              className="h-[46px] border border-gray-300 rounded-lg px-3 text-base bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
            >
              <option value="all">สถานะ</option>
              <option value="open">เปิดรับสมัคร</option>
              <option value="closed">ปิดรับสมัคร</option>
            </select>
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
                      handleExportPosts();
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
                onChange={onPostFileChange}
              />
            </div>
            <button
              className="flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg font-semibold text-base hover:bg-blue-800"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/admin/internship-posts/new');
              }}
            >
              <Plus size={18} />
              เพิ่มโพสต์
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_56px] px-6 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
            <button
              className="flex items-center gap-2 text-left"
              onClick={(e) => {
                e.stopPropagation();
                toggleSort('internship_title');
              }}
            >
              ชื่อ
              <span className="group inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-200/60 transition-colors">
                {sortKey === 'internship_title' ? (
                  sortDir === 'asc'
                    ? <ArrowUp size={14} className="text-gray-500 group-hover:text-gray-700" />
                    : <ArrowDown size={14} className="text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </span>
            </button>
            <button
              className="flex items-center gap-2 text-left"
              onClick={(e) => {
                e.stopPropagation();
                toggleSort('company_name');
              }}
            >
              บริษัท
              <span className="group inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-200/60 transition-colors">
                {sortKey === 'company_name' ? (
                  sortDir === 'asc'
                    ? <ArrowUp size={14} className="text-gray-500 group-hover:text-gray-700" />
                    : <ArrowDown size={14} className="text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </span>
            </button>
            <button
              className="flex items-center gap-2 text-left"
              onClick={(e) => {
                e.stopPropagation();
                toggleSort('internship_create_date');
              }}
            >
              วันที่สร้าง
              <span className="group inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-200/60 transition-colors">
                {sortKey === 'internship_create_date' ? (
                  sortDir === 'asc'
                    ? <ArrowUp size={14} className="text-gray-500 group-hover:text-gray-700" />
                    : <ArrowDown size={14} className="text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </span>
            </button>
            <button
              className="flex items-center gap-2 text-left"
              onClick={(e) => {
                e.stopPropagation();
                toggleSort('internship_expired_date');
              }}
            >
              วันที่ปิดรับสมัคร
              <span className="group inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-200/60 transition-colors">
                {sortKey === 'internship_expired_date' ? (
                  sortDir === 'asc'
                    ? <ArrowUp size={14} className="text-gray-500 group-hover:text-gray-700" />
                    : <ArrowDown size={14} className="text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </span>
            </button>
            <button
              className="flex items-center gap-2 text-left"
              onClick={(e) => {
                e.stopPropagation();
                toggleSort('internship_status');
              }}
            >
              สถานะ
              <span className="group inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-200/60 transition-colors">
                {sortKey === 'internship_status' ? (
                  sortDir === 'asc'
                    ? <ArrowUp size={14} className="text-gray-500 group-hover:text-gray-700" />
                    : <ArrowDown size={14} className="text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </span>
            </button>
            <div></div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">กำลังโหลด...</div>
          ) : sortedPosts.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            pageItems.map((post) => {
              const createdDate = post.internship_create_date
                ? new Date(post.internship_create_date).toLocaleDateString('th-TH')
                : '-';
              const expiredDate = post.internship_expired_date
                ? new Date(post.internship_expired_date).toLocaleDateString('th-TH')
                : '-';
              const status = post.internship_status ?? 1;
              const isMenuOpen = openMenuPostId === post.post_id;

              return (
                <div
                  key={post.post_id}
                  className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_56px] px-6 py-4 text-base text-gray-800 items-center border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/internship-posts/${post.post_id}`);
                  }}
                >
                  <div className="font-medium">{post.internship_title}</div>
                  <div className="text-gray-700">{post.company_name}</div>
                  <div className="text-gray-500 text-sm">{createdDate}</div>
                  <div className="text-gray-500 text-sm">{expiredDate}</div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {status === 1 ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                    </span>
                  </div>
                  <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      onClick={() => setOpenMenuPostId(isMenuOpen ? null : post.post_id)}
                      title="เมนู"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
                          onClick={() => navigate(`/admin/internship-posts/${post.post_id}`)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(post.post_id)}
                        >
                          ลบโพสต์
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {!loading && sortedPosts.length > 0 && (
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>แสดงต่อหน้า :</span>
                <select
                  className="h-9 border border-gray-300 rounded-lg px-3 bg-white"
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage(1);
                  }}
                >
                  «
                </button>
                <button
                  className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 10) return true;
                    if (p === 1 || p === totalPages) return true;
                    return Math.abs(p - currentPage) <= 2;
                  })
                  .reduce<number[]>((acc, p) => {
                    if (acc.length === 0) return [p];
                    const last = acc[acc.length - 1];
                    if (p - last > 1) acc.push(-1);
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) => {
                    if (p === -1) {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                          …
                        </span>
                      );
                    }

                    const isActive = p === currentPage;
                    return (
                      <button
                        key={p}
                        className={`w-9 h-9 rounded-lg border text-sm font-semibold ${
                          isActive
                            ? 'bg-blue-900 border-blue-900 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPage(p);
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}

                <button
                  className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                >
                  ›
                </button>
                <button
                  className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage(totalPages);
                  }}
                >
                  »
                </button>

                <div className="flex items-center gap-2 ml-4 text-sm text-gray-600">
                  <span>ไปหน้า :</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setPage(parseInt(e.target.value || '1'))}
                    className="w-16 h-9 border border-gray-300 rounded-lg px-2 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
