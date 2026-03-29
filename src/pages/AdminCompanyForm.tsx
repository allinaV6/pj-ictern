import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function AdminCompanyForm() {
  const navigate = useNavigate();
  const toLogoUrl = (value: string) => {
    if (!value) return '';
    return value.startsWith('http://') || value.startsWith('https://')
      ? value
      : `http://localhost:5002${value}`;
  };
  const [form, setForm] = useState({
    company_name: '',
    company_address: '',
    company_type: '',
    company_email: '',
    company_phone_num: '',
    company_link: '',
    company_description: '',
    company_logo: '',
    company_status: 1
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const b64 = await fileToBase64(file);
      const resp = await axios.post('http://localhost:5002/api/uploads/logo', {
        filename: file.name,
        data: b64,
      });
      setForm((prev) => ({ ...prev, company_logo: resp.data.url }));
    } catch (e) {
      console.error(e);
      if (axios.isAxiosError(e)) {
        alert(e.response?.data?.message || e.message || 'อัปโหลดรูปไม่สำเร็จ');
      } else {
        alert('อัปโหลดรูปไม่สำเร็จ');
      }
    } finally {
      setUploading(false);
    }
  };

  function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleSave = async () => {
    if (!form.company_name) {
      alert('กรุณากรอกชื่อบริษัท');
      return;
    }
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const account_id = user?.id;
      await axios.post('http://localhost:5002/api/companies', { ...form, account_id });
      alert('บันทึกข้อมูลบริษัทสำเร็จ');
      navigate('/admin/companies');
    } catch (e) {
      console.error(e);
      alert('บันทึกไม่สำเร็จ');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold text-gray-800">เพิ่มบริษัท</h1>
            <div className="flex items-center gap-3">
              <button
                className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-50"
                onClick={() => navigate('/admin/companies')}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                className="px-7 py-2.5 rounded-lg bg-blue-900 text-white font-semibold text-base hover:bg-blue-800"
              >
                บันทึก
              </button>
            </div>
          </div>

          <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr,2fr] gap-8 mb-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                รูปบริษัท <span className="text-red-500">*</span>
              </p>
              {form.company_logo ? (
                <img
                  src={toLogoUrl(form.company_logo)}
                  className="w-40 h-40 rounded-xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-40 h-40 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 text-sm">
                  <span>เลือกรูป</span>
                  <span className="text-xs text-gray-400 mt-1">อัปโหลดรูปภาพ .jpg หรือ .png ขนาดไม่เกิน 10 MB</span>
                </div>
              )}
              <label className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer">
                {uploading ? 'กำลังอัปโหลด...' : '+ เพิ่มไฟล์รูป'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  disabled={uploading}
                />
              </label>
              <input
                type="text"
                placeholder="หรือใส่ URL รูปโลโก้"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                value={form.company_logo}
                onChange={(e) => setForm({ ...form, company_logo: e.target.value })}
              />
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อบริษัท <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกชื่อบริษัท"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    value={form.company_phone_num}
                    onChange={(e) => setForm({ ...form, company_phone_num: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เว็บไซต์บริษัท <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="กรอก website บริษัท"
                    value={form.company_link}
                    onChange={(e) => setForm({ ...form, company_link: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="กรอกที่อยู่ (จังหวัด/เขต)"
                    value={form.company_address}
                    onChange={(e) => setForm({ ...form, company_address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                  สถานะบริษัท <span className="text-red-500">*</span>
                  </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.company_status}
                  onChange={(e) => setForm({ ...form, company_status: parseInt(e.target.value) })}
                >
                  <option value={1}>เปิดรับสมัคร</option>
                  <option value={0}>ปิดรับสมัคร</option>
                </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    E-mail ติดต่อบริษัท
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="กรอกอีเมล"
                    value={form.company_email}
                    onChange={(e) => setForm({ ...form, company_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ประเภทของบริษัท <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="กรอกประเภทของบริษัท"
                    value={form.company_type}
                    onChange={(e) => setForm({ ...form, company_type: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                ช่องทางการสมัครงาน <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2 text-base text-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="apply_channel" className="w-4 h-4" defaultChecked />
                  <span>สมัครผ่านเว็บไซต์หรือแบบฟอร์มออนไลน์</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="apply_channel" className="w-4 h-4" />
                  <span>สมัครผ่านอีเมล</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คำอธิบายบริษัท <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ใส่คำอธิบายเกี่ยวกับบริษัท..."
                value={form.company_description}
                onChange={(e) => setForm({ ...form, company_description: e.target.value })}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
