import AdminLayout from '../components/AdminLayout';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';

type CompanyApiItem = {
  company_id: number;
  company_name: string;
};

type CompanyPostApiItem = {
  internship_title: string;
};

type UserApiResponse = {
  admin_id: number | null;
  account_id: number;
  username: string;
  role: string;
  account_status: number | null;
  student_id: number | null;
  student_name: string | null;
  email: string | null;
  student_faculty: string | null;
  student_major: string | null;
  internship_position_title: string | null;
  internship_company_id: number | null;
};

export default function AdminUserDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyApiItem[]>([]);
  const [companyPosts, setCompanyPosts] = useState<CompanyPostApiItem[]>([]);
  const [userRole, setUserRole] = useState<string>('Student');
  const [companySearch, setCompanySearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPostSuggestions, setShowPostSuggestions] = useState(false);
  const [adminId, setAdminId] = useState<string>('');
  const [form, setForm] = useState({
    student_id: '',
    username: '',
    student_name: '',
    email: '',
    student_faculty: '',
    student_major: '',
    internship_position_title: '',
    internship_company_id: '' as '' | number,
    account_status: 1
  });

  const loadCompanyPosts = async (companyId: number, selectedTitle = '') => {
    try {
      const res = await axios.get<CompanyPostApiItem[]>(`http://localhost:5000/api/posts/company/${companyId}/titles`);
      const posts = Array.isArray(res.data) ? res.data : [];
      setCompanyPosts(posts);

      const normalizedSelectedTitle = selectedTitle.trim();
      setPostSearch(normalizedSelectedTitle);

      if (normalizedSelectedTitle && !posts.some((post) => post.internship_title === normalizedSelectedTitle)) {
        setForm((prev) => ({ ...prev, internship_position_title: '' }));
        setPostSearch('');
      }
    } catch (error) {
      console.error('fetch company posts error:', error);
      setCompanyPosts([]);
      setPostSearch('');
    }
  };

  useEffect(() => {
    Promise.all([
      axios.get<UserApiResponse>(`http://localhost:5000/api/users/${id}`),
      axios.get<CompanyApiItem[]>('http://localhost:5000/api/companies')
    ])
      .then(([userRes, companiesRes]) => {
        const u = userRes.data;
        const comps = Array.isArray(companiesRes.data) ? companiesRes.data : [];
        setCompanies(comps);
        setUserRole(u.role || 'Student');
        setAdminId(typeof u.admin_id === 'number' ? String(u.admin_id) : '');
        
        // Find company name for initial search value
        const currentComp = comps.find(c => c.company_id === u.internship_company_id);
        setCompanySearch(currentComp ? currentComp.company_name : '');

        setForm({
          student_id: u.student_id ? String(u.student_id) : '',
          username: u.username || '',
          student_name: u.role !== 'Student' ? (u.student_name || u.username || '') : (u.student_name || ''),
          email: u.email || '',
          student_faculty: u.student_faculty || '',
          student_major: u.student_major || '',
          internship_position_title: u.internship_position_title || '',
          internship_company_id: typeof u.internship_company_id === 'number' ? u.internship_company_id : '',
          account_status: typeof u.account_status === 'number' ? u.account_status : 1
        });

        if (typeof u.internship_company_id === 'number') {
          void loadCompanyPosts(u.internship_company_id, u.internship_position_title || '');
        } else {
          setCompanyPosts([]);
          setPostSearch('');
        }
      })
      .catch((e) => {
        console.error(e);
        alert('ไม่พบข้อมูลผู้ใช้นี้');
        navigate('/admin/users');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    const isAdmin = userRole !== 'Student';
    if (!form.username && !form.student_name) {
      alert('กรุณากรอก Username');
      return;
    }
    try {
      const payload: {
        username: string;
        account_status: number;
        student_name: string;
        email?: string;
        student_faculty: string;
        student_major: string;
        internship_position_title?: string | null;
        internship_company_id?: number;
      } = {
        username: isAdmin ? form.student_name || form.username : form.username,
        account_status: form.account_status,
        student_name: form.student_name,
        student_faculty: form.student_faculty,
        student_major: form.student_major,
        internship_position_title: form.internship_position_title || null
      };
      if (form.email.trim()) {
        payload.email = form.email.trim();
      }
      if (typeof form.internship_company_id === 'number') {
        payload.internship_company_id = form.internship_company_id;
      }
      await axios.put(`http://localhost:5000/api/users/${id}`, payload);
      alert('บันทึกข้อมูลสำเร็จ');
      navigate('/admin/users');
    } catch (e) {
      console.error(e);
      if (axios.isAxiosError(e)) {
        alert(e.response?.data?.message || e.message || 'บันทึกไม่สำเร็จ');
      } else {
        alert('บันทึกไม่สำเร็จ');
      }
    }
  };

  const handleSelectCompany = (c: CompanyApiItem) => {
    setForm({ ...form, internship_company_id: c.company_id, internship_position_title: '' });
    setCompanySearch(c.company_name);
    setPostSearch('');
    setShowSuggestions(false);
    void loadCompanyPosts(c.company_id);
  };

  const handleSelectPost = (post: CompanyPostApiItem) => {
    setForm({ ...form, internship_position_title: post.internship_title });
    setPostSearch(post.internship_title);
    setShowPostSuggestions(false);
  };

  const filteredCompanies = companies.filter(c =>
    c.company_name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredPosts = companyPosts.filter((post) =>
    post.internship_title.toLowerCase().includes(postSearch.toLowerCase())
  );

  const handleDelete = async () => {
    if (!confirm('ยืนยันการลบผู้ใช้นี้?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      alert('ลบผู้ใช้สำเร็จ');
      navigate('/admin/users');
    } catch (e) {
      console.error(e);
      alert('ลบไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-10 text-center">กำลังโหลด...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10 mb-8 sticky top-[81px] z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold">รายละเอียดผู้ใช้</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/admin/users')}
            >
              ยกเลิก
            </button>
            <button
              className="px-6 py-2.5 rounded-lg bg-red-600 border border-white text-white font-semibold text-base hover:bg-red-700 transition-colors"
              onClick={handleDelete}
            >
              ลบผู้ใช้
            </button>
            <button
              className="px-6 py-2.5 rounded-lg bg-blue-900 border border-white text-white font-semibold text-base hover:bg-blue-800 transition-colors"
              onClick={handleSave}
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-sm text-gray-400 mb-4 font-mono">Account ID: {id}</p>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {userRole === 'Student' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสนักศึกษา</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base bg-gray-50 text-gray-700"
                        value={form.student_id}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Program</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.student_major}
                        onChange={(e) => setForm({ ...form, student_major: e.target.value })}
                        placeholder="เช่น DST / ICT"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Admin ID</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base bg-gray-50 text-gray-700"
                        value={adminId || '-'}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base bg-gray-50 text-gray-700"
                        value="Admin"
                        readOnly
                      />
                    </div>
                  </>
                )}

                {userRole === 'Student' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">สถานที่ฝึกงาน</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                          placeholder="เลือกหรือค้นหาชื่อบริษัท"
                          value={companySearch}
                          onChange={(e) => {
                            setCompanySearch(e.target.value);
                            setForm({ ...form, internship_company_id: '' });
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => {
                            // Delay hiding to allow clicking suggestion
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          onClick={() => setShowSuggestions(!showSuggestions)}
                        />
                        <ChevronDown
                          size={18}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
                        />
                      </div>
                      {showSuggestions && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                          <div
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-500 border-b italic text-sm"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setForm({ ...form, internship_company_id: '' });
                              setCompanySearch('');
                              setShowSuggestions(false);
                            }}
                          >
                            -- ไม่ระบุ --
                          </div>
                          {filteredCompanies.length > 0 ? (
                            filteredCompanies.map(c => (
                              <div
                                key={c.company_id}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 border-b last:border-none text-base"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectCompany(c);
                                }}
                              >
                                {c.company_name}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-400 italic text-sm text-center py-4">ไม่พบบริษัทที่ค้นหา</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ตำแหน่งฝึกงาน</label>
                      {typeof form.internship_company_id === 'number' ? (
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                            placeholder={companyPosts.length > 0 ? 'เลือกหรือค้นหาชื่อตำแหน่งจากโพสต์ของบริษัทนี้' : 'บริษัทนี้ยังไม่มีโพสต์เปิดรับตำแหน่ง'}
                            value={postSearch}
                            onChange={(e) => {
                              setPostSearch(e.target.value);
                              setForm({ ...form, internship_position_title: '' });
                              setShowPostSuggestions(true);
                            }}
                            onFocus={() => setShowPostSuggestions(true)}
                            onBlur={() => {
                              setTimeout(() => setShowPostSuggestions(false), 200);
                            }}
                            onClick={() => setShowPostSuggestions(!showPostSuggestions)}
                            disabled={companyPosts.length === 0}
                          />
                          <ChevronDown
                            size={18}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${showPostSuggestions ? 'rotate-180' : ''}`}
                          />
                          {showPostSuggestions && companyPosts.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                              <div
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-500 border-b italic text-sm"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setForm({ ...form, internship_position_title: '' });
                                  setPostSearch('');
                                  setShowPostSuggestions(false);
                                }}
                              >
                                -- ไม่ระบุ --
                              </div>
                              {filteredPosts.length > 0 ? (
                                filteredPosts.map((post, index) => (
                                  <div
                                    key={`${post.internship_title}-${index}`}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 border-b last:border-none text-base"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleSelectPost(post);
                                    }}
                                  >
                                    {post.internship_title}
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-gray-400 italic text-sm text-center py-4">ไม่พบตำแหน่งที่ค้นหา</div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-400">
                          เลือกสถานที่ฝึกงานก่อน แล้วตำแหน่งฝึกงานจะแสดงจากโพสต์ของบริษัทนั้น
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.student_name}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        student_name: nextValue,
                        ...(userRole !== 'Student' ? { username: nextValue } : {})
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@domain.com"
                  />
                </div>

                {userRole === 'Student' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base bg-gray-50 text-gray-700"
                      value="Student"
                      readOnly
                    />
                  </div>
                )}

                {userRole === 'Student' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">คณะ</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.student_faculty}
                      onChange={(e) => setForm({ ...form, student_faculty: e.target.value })}
                    />
                  </div>
                )}

              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                สถานะบัญชี <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.account_status}
                onChange={(e) => setForm({ ...form, account_status: parseInt(e.target.value) })}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
