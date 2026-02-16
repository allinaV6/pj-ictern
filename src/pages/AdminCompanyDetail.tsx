import AdminLayout from '../components/AdminLayout';
import { ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminCompanyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-8 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">รายละเอียดบริษัท</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100"
              onClick={() => navigate('/admin/companies')}
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
          <p className="text-sm text-gray-400 mb-4">Company ID: {id}</p>

          <div className="grid grid-cols-1 md:grid-cols-[1.2fr,2fr] gap-8 mb-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                รูปบริษัท <span className="text-red-500">*</span>
              </p>
              <div className="w-40 h-40 rounded-xl bg-blue-900 flex items-center justify-center text-white text-sm font-semibold">
                Logo
              </div>
              <button className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800">
                เปลี่ยนรูป
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อบริษัท <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="SCG Innovate Co., Ltd."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="081-234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เว็บไซต์บริษัท <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="www.scg.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                    <span className="text-gray-700">กรุงเทพมหานคร</span>
                    <ChevronDown size={18} className="text-gray-400" />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    สถานะบริษัท <span className="text-red-500">*</span>
                  </label>
                  <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                    <span className="text-gray-700">เปิดรับสมัคร</span>
                    <ChevronDown size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    E-mail ติดต่อบริษัท
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="scg@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ประเภทของบริษัท <span className="text-red-500">*</span>
                  </label>
                  <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white">
                    <span className="text-gray-700">Industrial Conglor</span>
                    <ChevronDown size={18} className="text-gray-400" />
                  </button>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="ร่วมทำตลอดจนดูคุณภาพของทั้ง Web และ Mobile Application เพื่อให้งานมีคุณภาพชุดสอดตามมาตรฐานที่กำหนด ทำงานร่วมกับทีมพัฒนาและออกแบบเพื่อระบุปัญหา วิเคราะห์สาเหตุ และเสนอแนวทางแก้ไขก่อนนำไปใช้ในระบบ"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
