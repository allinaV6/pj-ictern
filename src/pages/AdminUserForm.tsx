import AdminLayout from '../components/AdminLayout';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminUserForm() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-8 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">เพิ่มผู้ใช้</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100"
              onClick={() => navigate('/admin/users')}
            >
              ยกเลิก
            </button>
            <button className="px-6 py-2.5 rounded-lg bg-blue-900 border border-white text-white font-semibold text-base hover:bg-blue-800">
              บันทึก
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รหัสนักศึกษา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกรหัสนักศึกษา"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E-mail ติดต่อบริษัท <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอก Email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Program <span className="text-red-500">*</span>
                </label>
                <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                  <span className="text-gray-500">เลือกสาขา</span>
                  <ChevronDown size={18} className="text-gray-400" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  สถานที่ฝึกงาน <span className="text-red-500">*</span>
                </label>
                <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                  <span className="text-gray-500">เลือกสถานะบัญชี</span>
                  <ChevronDown size={18} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกรหัสผ่าน"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  สถานะบัญชี <span className="text-red-500">*</span>
                </label>
                <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                  <span className="text-gray-500">เลือกสถานะบัญชี</span>
                  <ChevronDown size={18} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

