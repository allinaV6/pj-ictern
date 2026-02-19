import AdminLayout from '../components/AdminLayout';
import { Calendar, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminInternshipPostForm() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-8 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">เพิ่มโพสต์ประกาศรับสมัครนักศึกษาฝึกงาน</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100"
              onClick={() => navigate('/admin/internship-posts')}
            >
              ยกเลิก
            </button>
            <button className="px-6 py-2.5 rounded-lg bg-blue-900 border border-white text-white font-semibold text-base hover:bg-blue-800">
              บันทึก
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อโพสต์ประกาศ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ตั้งชื่อโพสต์ประกาศของคุณ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  บริษัท <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ค้นหาบริษัท"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รูปแบบการฝึกงาน <span className="text-red-500">*</span>
                </label>
                <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                  <span className="text-gray-500">เลือกรูปแบบการฝึกงาน</span>
                  <ChevronDown size={18} className="text-gray-400" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ระยะเวลาฝึกงาน (เดือน) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ระบุระยะเวลาฝึกงาน"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  จังหวัด <span className="text-red-500">*</span>
                </label>
                <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                  <span className="text-gray-500">เลือกจังหวัด</span>
                  <ChevronDown size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-[2fr,1fr] gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ค่าตอบแทน
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ระบุค่าตอบแทน"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 invisible">
                    หน่วย
                  </label>
                  <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                    <span className="text-gray-700">ต่อเดือน</span>
                    <ChevronDown size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[2fr,2fr] gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    วันที่เปิดรับสมัคร
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-gray-500">01/01/2025 - 01/01/2025</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    สถานะการเปิดรับสมัคร <span className="text-red-500">*</span>
                  </label>
                  <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                    <span className="text-gray-500">เลือกสถานะการเปิดรับสมัคร</span>
                    <ChevronDown size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                รายละเอียดงาน <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ใส่รายละเอียดงาน..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                หน้าที่และความรับผิดชอบ <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ใส่หน้าที่และความรับผิดชอบ..."
              />
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              คุณสมบัติของผู้สมัคร <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ใส่คุณสมบัติของผู้สมัคร..."
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
