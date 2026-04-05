import AdminLayout from '../components/AdminLayout';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Search, MoreVertical, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { exportDataToExcel, parseExcelFile } from '../lib/exportExcel';

export default function AdminUserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Array<{
    admin_id?: number | null;
    account_id: number | null;
    username: string;
    account_status: number | null;
    student_id: number | null;
    student_name: string | null;
    student_faculty: string | null;
    student_major: string | null;
    internship_company_id: number | null;
    internship_company_name: string | null;
    role: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<'admin_id' | 'student_id' | 'name' | 'major' | 'company' | 'status' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'students' | 'admins'>('students');
  const [importExportOpen, setImportExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAdminView = viewMode === 'admins';
  const tableGridClass = isAdminView ? 'grid-cols-[1.2fr_2.5fr_1fr_56px]' : 'grid-cols-[1.2fr_2.5fr_1.5fr_1fr_1fr_56px]';

  const getUserKey = (u: (typeof users)[number]) =>
    typeof u.account_id === 'number' && Number.isFinite(u.account_id)
      ? `account-${u.account_id}`
      : `student-${u.student_id ?? 'unknown'}`;

  const getUserDetailTarget = (u: (typeof users)[number]) =>
    viewMode === 'admins'
      ? String(u.account_id ?? '')
      : String(u.student_id ?? u.account_id ?? '');

  const handleExportUsers = () => {
    if (filteredUsers.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    const exportRows = filteredUsers.map((u) => {
      if (isAdminView) {
        return {
          'Admin ID': u.admin_id ?? '-',
          'Name': u.username,
          'Role': 'Admin',
          'Status': (u.account_status ?? 1) === 1 ? 'Active' : 'Inactive',
        };
      }
      return {
        'Account ID': u.account_id ?? u.student_id ?? '-',
        'Role': (u as any).role || 'Student',
        'Status': (u.account_status ?? 1) === 1 ? 'Active' : 'Inactive',
        'Student ID': u.student_id ?? '-',
        'Name': u.student_name ?? '-',
        'Faculty': u.student_faculty ?? '-',
        'Major': u.student_major ?? '-',
        'Internship Company ID': u.internship_company_id ?? '-',
        'Internship Company Name': u.internship_company_name ?? '-',
      };
    });

    const columns = isAdminView
      ? [
          { header: 'Admin ID', key: 'Admin ID' },
          { header: 'Name', key: 'Name' },
          { header: 'Role', key: 'Role' },
          { header: 'Status', key: 'Status' },
        ]
      : [
          { header: 'Account ID', key: 'Account ID' },
          { header: 'Role', key: 'Role' },
          { header: 'Status', key: 'Status' },
          { header: 'Student ID', key: 'Student ID' },
          { header: 'Name', key: 'Name' },
          { header: 'Faculty', key: 'Faculty' },
          { header: 'Major', key: 'Major' },
          { header: 'Internship Company ID', key: 'Internship Company ID' },
          { header: 'Internship Company Name', key: 'Internship Company Name' },
        ];

    exportDataToExcel(exportRows, 'Users', columns);
  };

  const normalizeHeaderKey = (key: any) =>
    String(key || '')
      .trim()
      .toLowerCase()
      .replace(/[\W_]+/g, '');

  const parseNumber = (value: any, fallback = 0) => {
    if (typeof value === 'number') return value;
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const parseStatus = (value: any) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === '0' || normalized.includes('inactive') || normalized.includes('ปิด')) return 0;
    return 1;
  };

  const normalizeRole = (value: any) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized.includes('admin') || normalized.includes('ผู้ดูแล') || normalized.includes('แอดมิน')) return 'Admin';
    return 'Student';
  };

  const handleImportUsers = async (file: File) => {
    try {
      const rows = await parseExcelFile(file);
      const imported = rows.map((row: Record<string, any>) => {
        const normalizedRow: Record<string, any> = {};
        Object.entries(row).forEach(([key, value]) => {
          normalizedRow[normalizeHeaderKey(key)] = value;
        });

        const getValue = (...keys: string[]) => {
          for (const key of keys) {
            const normalizedKey = normalizeHeaderKey(key);
            if (normalizedRow[normalizedKey] !== undefined && normalizedRow[normalizedKey] !== null) {
              return normalizedRow[normalizedKey];
            }
          }

          const normalizedKeys = Object.keys(normalizedRow);
          for (const key of keys) {
            const normalizedKey = normalizeHeaderKey(key);
            const match = normalizedKeys.find(
              (rowKey) => rowKey.includes(normalizedKey) || normalizedKey.includes(rowKey)
            );
            if (match) {
              return normalizedRow[match];
            }
          }
          return '';
        };

        const name = String(getValue('Name', 'name', 'student_name', 'Username', 'username', 'ชื่อ-นามสกุล', 'ชื่อ') || '');
        const maybeRole = String(getValue('Role', 'role', 'บทบาท') || '').trim();
        const role = viewMode === 'admins'
          ? 'Admin'
          : maybeRole
            ? normalizeRole(maybeRole)
            : 'Student';

        return {
          account_id: parseNumber(getValue('Account ID', 'account_id', 'AccountId', 'accountid', 'รหัสบัญชี', 'รหัสผู้ใช้', 'ID')),
          username: String(getValue('Username', 'username', 'Name', 'name', 'student_name', 'ชื่อ-นามสกุล', 'ชื่อ') || name),
          account_status: parseStatus(getValue('Status', 'status')),
          student_id: parseNumber(getValue('Student ID', 'student_id')),
          student_name: name,
          student_faculty: String(getValue('Faculty', 'faculty', 'คณะ') || ''),
          student_major: String(getValue('Major', 'major', 'สาขา', 'Program', 'program') || ''),
          internship_company_id: parseNumber(getValue('Internship Company ID', 'internship_company_id', 'รหัสบริษัทฝึกงาน')),
          internship_company_name: String(getValue('Internship Company Name', 'internship_company_name', 'ชื่อบริษัทฝึกงาน') || ''),
          role,
        };
      });

      const roleFilter = viewMode === 'admins' ? 'Admin' : 'Student';
      const filteredImported = imported.filter((row: { role: string }) => row.role === roleFilter);
      if (filteredImported.length === 0) {
        alert(`ไม่พบข้อมูลผู้ใช้ประเภท ${viewMode === 'admins' ? 'Admin' : 'Student'} ในไฟล์ Excel`);
        return;
      }

      if (filteredImported.length < imported.length) {
        alert(`นำเข้าเฉพาะผู้ใช้ประเภท ${roleFilter} เท่านั้น; แยกข้อมูลประเภทอื่นออกแล้ว`);
      }

      const response = await axios.post('http://localhost:5000/api/users/import', filteredImported);
      const updatedCount = response.data?.updatedCount ?? 0;

      if (updatedCount === 0) {
        alert('นำเข้าไฟล์แล้ว แต่ไม่พบรายการใดที่ตรงกับฐานข้อมูล');
        return;
      }

      await refreshUsers();
      setPage(1);
      setImportExportOpen(false);
      alert(`นำเข้าไฟล์เรียบร้อยแล้ว ${updatedCount} รายการถูกบันทึกลงฐานข้อมูล`);
    } catch (error: any) {
      console.error('Error importing users:', error);
      const message = error?.response?.data?.message || error?.message || 'ไม่ทราบสาเหตุ';
      alert(`ไม่สามารถนำเข้าไฟล์ได้: ${message}`);
    }
  };

  const onUserFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

    await handleImportUsers(file);
    e.target.value = '';
  };

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/users?role=${viewMode}`, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      setUsers(res.data);
    } catch (e) {
      console.error('fetch users error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, [viewMode]);

  useEffect(() => {
    setSortKey(null);
    setSortDir('asc');
  }, [viewMode]);

  const toggleSort = (key: 'admin_id' | 'student_id' | 'name' | 'major' | 'company' | 'status') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const renderSortIcon = (key: 'admin_id' | 'student_id' | 'name' | 'major' | 'company' | 'status') => {
    if (sortKey !== key) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortDir === 'asc'
      ? <ArrowUp size={14} className="text-blue-700" />
      : <ArrowDown size={14} className="text-blue-700" />;
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const isAdminView = viewMode === 'admins';
    return users
      .filter((u) => {
        if (!q) return true;
        if (isAdminView) {
          return (
            (u.username || '').toLowerCase().includes(q) ||
            (u.role || '').toLowerCase().includes(q) ||
            String(u.account_id).includes(q)
          );
        }
        return (
          (u.student_name || '').toLowerCase().includes(q) ||
          (u.student_major || '').toLowerCase().includes(q) ||
          (u.student_id ? String(u.student_id).includes(q) : false)
        );
      })
      .filter((u) => {
        if (statusFilter === 'all') return true;
        const status = u.account_status ?? 1;
        return statusFilter === 'active' ? status === 1 : status === 0;
      });
  }, [users, searchTerm, statusFilter, viewMode]);

  const sortedUsers = useMemo(() => {
    if (!sortKey) return filteredUsers;

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredUsers].sort((a, b) => {
      if (sortKey === 'admin_id') {
        return ((a.admin_id ?? 0) - (b.admin_id ?? 0)) * dir;
      }
      if (sortKey === 'student_id') {
        return ((a.student_id ?? 0) - (b.student_id ?? 0)) * dir;
      }
      if (sortKey === 'status') {
        return ((a.account_status ?? 1) - (b.account_status ?? 1)) * dir;
      }

      const getText = (u: typeof users[number]) => {
        if (sortKey === 'name') return viewMode === 'admins' ? (u.username || '') : (u.student_name || '');
        if (sortKey === 'major') return u.student_major || '';
        if (sortKey === 'company') return u.internship_company_name || '';
        return '';
      };

      return getText(a).localeCompare(getText(b), 'th', { sensitivity: 'base' }) * dir;
    });
  }, [filteredUsers, sortKey, sortDir, viewMode, users]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const offset = (currentPage - 1) * pageSize;
    return sortedUsers.slice(offset, offset + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  const handleDelete = async (accountId: number) => {
    if (!confirm('ยืนยันการลบผู้ใช้นี้?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${accountId}`);
      setUsers((prev) => prev.filter((u) => {
        const targetId = u.account_id ?? u.student_id;
        return targetId !== accountId;
      }));
      setOpenMenuKey(null);
    } catch (e) {
      console.error(e);
      alert('ลบไม่สำเร็จ');
    }
  };

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold">User Management</h1>
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto px-4 py-8"
        onClick={() => {
          setOpenMenuKey(null);
          setImportExportOpen(false);
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสนักศึกษา"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <select
              className="h-[46px] border border-gray-300 rounded-lg px-3 text-base bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
            >
              <option value="all">สถานะ</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

          </div>

          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50"
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
                      handleExportUsers();
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
                onChange={onUserFileChange}
              />
            </div>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === 'admins'
                ? 'bg-blue-900 text-white border border-transparent'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => {
                setViewMode((mode) => (mode === 'students' ? 'admins' : 'students'));
                setPage(1);
              }}
            >
              {viewMode === 'students' ? 'แสดงบัญชี Admin' : 'แสดงบัญชี Student'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className={`grid ${tableGridClass} px-6 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border-b border-gray-200`}>
            {viewMode === 'admins' ? (
              <>
                <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('admin_id')}>
                  Admin ID {renderSortIcon('admin_id')}
                </button>
                <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('name')}>
                  ชื่อ-นามสกุล {renderSortIcon('name')}
                </button>
                <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('status')}>
                  สถานะ {renderSortIcon('status')}
                </button>
                <div></div>
              </>
            ) : (
              <>
                <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('student_id')}>
                  รหัสนักศึกษา {renderSortIcon('student_id')}
                </button>
                <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('name')}>
                  ชื่อ-นามสกุล {renderSortIcon('name')}
                </button>
                <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('major')}>
                  Program {renderSortIcon('major')}
                </button>
                <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('company')}>
                  สถานที่ฝึกงาน {renderSortIcon('company')}
                </button>
                <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('status')}>
                  สถานะ {renderSortIcon('status')}
                </button>
                <div></div>
              </>
            )}
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">กำลังโหลด...</div>
          ) : pageItems.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            pageItems.map((u, idx) => {
              const status = u.account_status ?? 1;
              const isMenuOpen = openMenuKey === getUserKey(u);
              const canOpenDetail = viewMode === 'admins'
                ? typeof u.account_id === 'number' && Number.isFinite(u.account_id)
                : typeof u.student_id === 'number' && Number.isFinite(u.student_id);
              const rowKey = viewMode === 'admins'
                ? `admin-${u.admin_id ?? u.account_id ?? idx}`
                : `student-${u.student_id ?? u.account_id ?? idx}`;
              const detailTarget = getUserDetailTarget(u);
              return (
                <div
                  key={rowKey}
                  className={`grid ${tableGridClass} px-6 py-4 text-base text-gray-800 items-center border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors duration-150`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canOpenDetail) {
                      navigate(`/admin/users/${detailTarget}`);
                    }
                  }}
                >
                  {viewMode === 'admins' ? (
                    <>
                      <div className="text-gray-700">{u.admin_id ?? '-'}</div>
                      <div className="font-medium">{u.username}</div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-700">{u.student_id ?? '-'}</div>
                      <div className="font-medium">{u.student_name || '-'}</div>
                      <div className="text-gray-700">{u.student_major || '-'}</div>
                      <div className="text-gray-700">{u.internship_company_name || '-'}</div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (!canOpenDetail) return;
                        setOpenMenuKey(isMenuOpen ? null : getUserKey(u));
                      }}
                      disabled={!canOpenDetail}
                      title="เมนู"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {isMenuOpen && canOpenDetail && (
                      <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
                          onClick={() => navigate(`/admin/users/${detailTarget}`)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete((viewMode === 'admins' ? u.account_id : u.student_id) as number)}
                        >
                          ลบผู้ใช้
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>แสดงต่อหน้า :</span>
                <select
                  className="h-9 border border-gray-300 rounded-lg px-3 bg-white"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setPage(1);
                  }}
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
