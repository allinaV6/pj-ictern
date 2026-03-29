import AdminLayout from '../components/AdminLayout';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

type CompanyApiItem = {
  company_id: number;
  company_name: string;
};

type UserApiResponse = {
  account_id: number;
  username: string;
  role: string;
  account_status: number | null;
  student_id: number | null;
  student_name: string | null;
  student_faculty: string | null;
  student_major: string | null;
  internship_company_id: number | null;
};

export default function AdminUserDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyApiItem[]>([]);
  const [userRole, setUserRole] = useState<string>('Student');
  const [form, setForm] = useState({
    student_id: '',
    username: '',
    student_name: '',
    student_faculty: '',
    student_major: '',
    internship_company_id: '' as '' | number,
    account_status: 1
  });

  useEffect(() => {
    Promise.all([
      axios.get<UserApiResponse>(`http://localhost:5000/api/users/${id}`),
      axios.get<CompanyApiItem[]>('http://localhost:5000/api/companies')
    ])
      .then(([userRes, companiesRes]) => {
        const u = userRes.data;
        setUserRole(u.role || 'Student');
        setForm({
          student_id: u.student_id ? String(u.student_id) : '',
          username: u.username || '',
          student_name: u.role !== 'Student' ? (u.student_name || u.username || '') : (u.student_name || ''),
          student_faculty: u.student_faculty || '',
          student_major: u.student_major || '',
          internship_company_id: typeof u.internship_company_id === 'number' ? u.internship_company_id : '',
          account_status: typeof u.account_status === 'number' ? u.account_status : 1
        });
        setCompanies(
          Array.isArray(companiesRes.data) ? companiesRes.data : []
        );
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
        student_faculty: string;
        student_major: string;
        internship_company_id?: number;
      } = {
        username: isAdmin ? form.student_name || form.username : form.username,
        account_status: form.account_status,
        student_name: form.student_name,
        student_faculty: form.student_faculty,
        student_major: form.student_major
      };
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-gray-800">รายละเอียดผู้ใช้</h1>
              <div className="text-xs text-gray-400 mt-1">Account ID: {id}</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-50"
                onClick={() => navigate('/admin/users')}
              >
                ยกเลิก
              </button>
              <button
                className="px-6 py-2.5 rounded-lg border border-red-200 bg-white text-red-600 font-semibold text-base hover:bg-red-50"
                onClick={handleDelete}
              >
                ลบผู้ใช้
              </button>
              <button
                className="px-7 py-2.5 rounded-lg bg-blue-900 text-white font-semibold text-base hover:bg-blue-800"
                onClick={handleSave}
              >
                บันทึก
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">สถานที่ฝึกงาน</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={form.internship_company_id === '' ? '' : String(form.internship_company_id)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        internship_company_id: e.target.value ? parseInt(e.target.value) : ''
                      })
                    }
                  >
                    <option value="">ไม่ระบุ</option>
                    {companies.map((c) => (
                      <option key={c.company_id} value={c.company_id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base bg-gray-50 text-gray-700"
                    value={userRole === 'Student' ? 'Student' : 'Admin'}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">คณะ</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.student_faculty}
                    onChange={(e) => setForm({ ...form, student_faculty: e.target.value })}
                  />
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
        </div>
      </div>
    </AdminLayout>
  );
}
