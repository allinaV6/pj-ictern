import AdminLayout from '../components/AdminLayout';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Search, Plus, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { exportDataToExcel, parseExcelFile } from '../lib/exportExcel';

export default function AdminCompanyList() {
  const navigate = useNavigate();
  const toLogoUrl = (value: string) => {
    if (!value) return '';
    return value.startsWith('http://') || value.startsWith('https://')
      ? value
      : `http://localhost:5000${value}`;
  };
  const [companies, setCompanies] = useState<Array<{
    company_id: number;
    company_name: string;
    company_address?: string;
    company_type?: string;
    company_email?: string;
    company_phone_num?: string;
    company_link?: string;
    company_description?: string;
    company_logo?: string | null;
    company_status?: number;
    company_create_date?: string;
    admin_id?: number;
    account_id?: number;
    total_posts?: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [openMenuCompanyId, setOpenMenuCompanyId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<'company_name' | 'company_type' | 'company_create_date' | 'total_posts'>('company_create_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [importExportOpen, setImportExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportCompanies = () => {
    if (sorted.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    const exportRows = sorted.map((company) => ({
      'Company ID': company.company_id,
      'Company Name': company.company_name,
      'Address': company.company_address || '-',
      'Type': company.company_type || '-',
      'Email': company.company_email || '-',
      'Phone': company.company_phone_num || '-',
      'Link': company.company_link || '-',
      'Description': company.company_description || '-',
      'Logo URL': company.company_logo ? toLogoUrl(company.company_logo) : '-',
      'Status': (company.company_status ?? 1) === 1 ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร',
      'Created Date': company.company_create_date ? new Date(company.company_create_date).toLocaleDateString('th-TH') : '-',
      'Admin ID': company.admin_id ?? '-',
      'Account ID': company.account_id ?? '-',
      'Total Posts': company.total_posts ?? 0,
    }));

    exportDataToExcel(exportRows, 'Companies', [
      { header: 'Company ID', key: 'Company ID' },
      { header: 'Company Name', key: 'Company Name' },
      { header: 'Address', key: 'Address' },
      { header: 'Type', key: 'Type' },
      { header: 'Email', key: 'Email' },
      { header: 'Phone', key: 'Phone' },
      { header: 'Link', key: 'Link' },
      { header: 'Description', key: 'Description' },
      { header: 'Logo URL', key: 'Logo URL' },
      { header: 'Status', key: 'Status' },
      { header: 'Created Date', key: 'Created Date' },
      { header: 'Admin ID', key: 'Admin ID' },
      { header: 'Account ID', key: 'Account ID' },
      { header: 'Total Posts', key: 'Total Posts' },
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

  const parseDateValue = (value: any) => {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return String(value);
  };

  const normalizeLogoUrl = (value: any) => {
    if (!value) return '';
    const text = String(value).trim();
    return text.replace(/^https?:\/\/[^/]+/, '');
  };

  const handleImportCompanies = async (file: File) => {
    try {
      const rows = await parseExcelFile(file);
      const imported = rows.map((row) => ({
        company_id: parseNumber(row['Company ID']),
        company_name: String(row['Company Name'] || ''),
        company_address: String(row['Address'] || ''),
        company_type: String(row['Type'] || ''),
        company_email: String(row['Email'] || ''),
        company_phone_num: String(row['Phone'] || ''),
        company_link: String(row['Link'] || ''),
        company_description: String(row['Description'] || ''),
        company_logo: normalizeLogoUrl(row['Logo URL'] || row['company_logo'] || ''),
        company_status: parseStatus(row['Status']),
        company_create_date: parseDateValue(row['Created Date'] || ''),
        admin_id: parseNumber(row['Admin ID']),
        account_id: parseNumber(row['Account ID']),
        total_posts: parseNumber(row['Total Posts']),
      }));

      setCompanies(imported);
      setCurrentPage(1);
      setImportExportOpen(false);
      alert('นำเข้าไฟล์เรียบร้อยแล้ว ข้อมูลตารางจะถูกแทนที่ด้วยข้อมูลจากไฟล์ Excel');
    } catch (error) {
      console.error('Error importing companies:', error);
      alert('ไม่สามารถนำเข้าไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์ Excel');
    }
  };

  const onCompanyFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImportCompanies(file);
    e.target.value = '';
  };

  useEffect(() => {
    axios.get('http://localhost:5000/api/companies')
      .then((res) => setCompanies(res.data))
      .catch((e) => console.error('fetch companies error:', e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return companies.filter(c => {
      if (!q) return true;
      return (c.company_name?.toLowerCase().includes(q) || c.company_type?.toLowerCase().includes(q));
    }).filter(c => {
      if (typeFilter === 'all') return true;
      return (c.company_type || '').toLowerCase() === typeFilter.toLowerCase();
    });
  }, [companies, searchTerm, typeFilter]);

  const companyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => {
      if (c.company_type) set.add(c.company_type);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      if (sortKey === 'total_posts') {
        return ((a.total_posts || 0) - (b.total_posts || 0)) * dir;
      }
      if (sortKey === 'company_create_date') {
        const at = a.company_create_date ? new Date(a.company_create_date).getTime() : 0;
        const bt = b.company_create_date ? new Date(b.company_create_date).getTime() : 0;
        return (at - bt) * dir;
      }
      const av = (a[sortKey] || '').toString().toLowerCase();
      const bv = (b[sortKey] || '').toString().toLowerCase();
      return av.localeCompare(bv) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const pageItems = useMemo(() => {
    const offset = (effectivePage - 1) * pageSize;
    return sorted.slice(offset, offset + pageSize);
  }, [sorted, effectivePage, pageSize]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold">Company Management</h1>
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto px-4 py-8"
        onClick={() => {
          setOpenMenuCompanyId(null);
          setImportExportOpen(false);
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่อบริษัท หรือประเภท"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <select
              className="h-[46px] border border-gray-300 rounded-lg px-3 text-base bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">ประเภท</option>
              {companyTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
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
                      handleExportCompanies();
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
                onChange={onCompanyFileChange}
              />
            </div>
            <button
              className="flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg font-semibold text-base hover:bg-blue-800"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/admin/companies/new');
              }}
            >
              <Plus size={18} />
              เพิ่มบริษัท
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr_56px] px-6 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
            <button className="flex items-center gap-2 text-left" onClick={() => toggleSort('company_name')}>
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
            <button className="flex items-center gap-2 text-left" onClick={() => toggleSort('company_type')}>
              ประเภท
              <span className="group inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-200/60 transition-colors">
                {sortKey === 'company_type' ? (
                  sortDir === 'asc'
                    ? <ArrowUp size={14} className="text-gray-500 group-hover:text-gray-700" />
                    : <ArrowDown size={14} className="text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </span>
            </button>
            <button className="flex items-center gap-2 text-left" onClick={() => toggleSort('total_posts')}>
              โพสต์ทั้งหมด
              <span className="group inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-200/60 transition-colors">
                {sortKey === 'total_posts' ? (
                  sortDir === 'asc'
                    ? <ArrowUp size={14} className="text-gray-500 group-hover:text-gray-700" />
                    : <ArrowDown size={14} className="text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </span>
            </button>
            <div>สถานะ</div>
            <button className="flex items-center gap-2 text-left" onClick={() => toggleSort('company_create_date')}>
              วันที่สร้าง
              <span className="group inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-200/60 transition-colors">
                {sortKey === 'company_create_date' ? (
                  sortDir === 'asc'
                    ? <ArrowUp size={14} className="text-gray-500 group-hover:text-gray-700" />
                    : <ArrowDown size={14} className="text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
              </span>
            </button>
            <div className="text-right pr-2">Logo</div>
            <div></div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">กำลังโหลด...</div>
          ) : pageItems.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : pageItems.map((company) => (
            <div
              key={company.company_id}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr_56px] px-6 py-4 text-base text-gray-800 items-center border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/companies/${company.company_id}`);
              }}
            >
              <div className="font-medium">{company.company_name}</div>
              <div>{company.company_type || '-'}</div>
              <div>{company.total_posts ?? 0}</div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  (company.company_status ?? 1) === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {(company.company_status ?? 1) === 1 ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                </span>
              </div>
              <div className="text-gray-500 text-sm">{company.company_create_date ? new Date(company.company_create_date).toLocaleDateString('th-TH') : '-'}</div>
              <div className="flex items-center justify-end pr-2">
                {company.company_logo ? (
                  <img src={toLogoUrl(company.company_logo)} alt="logo" className="w-9 h-9 object-cover rounded-md border border-gray-200" />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-blue-900 flex items-center justify-center text-white text-xs font-semibold">
                    Logo
                  </div>
                )}
              </div>
              <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  onClick={() => setOpenMenuCompanyId(openMenuCompanyId === company.company_id ? null : company.company_id)}
                  title="เมนู"
                >
                  <MoreVertical size={18} />
                </button>
                {openMenuCompanyId === company.company_id && (
                  <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
                      onClick={() => navigate(`/admin/companies/${company.company_id}`)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm('ยืนยันการลบบริษัทนี้?')) return;
                        try {
                          await axios.delete(`http://localhost:5000/api/companies/${company.company_id}`);
                          // Refresh list quickly
                          const res = await axios.get('http://localhost:5000/api/companies');
                          setCompanies(res.data);
                          setOpenMenuCompanyId(null);
                        } catch (e) {
                          console.error(e);
                          alert('ลบไม่สำเร็จ (อาจมีการอ้างอิงในโพสต์)');
                        }
                      }}
                    >
                      ลบบริษัท
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {!loading && sorted.length > 0 && (
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
                  disabled={effectivePage === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(1);
                  }}
                >
                  «
                </button>
                <button
                  className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={effectivePage === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 10) return true;
                    if (p === 1 || p === totalPages) return true;
                    return Math.abs(p - effectivePage) <= 2;
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

                    const isActive = p === effectivePage;
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
                          setCurrentPage(p);
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}

                <button
                  className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={effectivePage === totalPages}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                >
                  ›
                </button>
                <button
                  className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={effectivePage === totalPages}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(totalPages);
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
                    value={effectivePage}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setCurrentPage(parseInt(e.target.value || '1'))}
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
