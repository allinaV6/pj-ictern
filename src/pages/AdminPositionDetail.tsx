import AdminLayout from '../components/AdminLayout';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminPositionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-8 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">เพิ่มตำแหน่งงาน</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100"
              onClick={() => navigate('/admin/positions')}
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
          <p className="text-sm text-gray-400 mb-4">Position ID: {id}</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อตำแหน่งงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="Data Analyst"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คำอธิบายตำแหน่งงาน <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="คือผู้เชี่ยวชาญที่มีหน้าที่รวบรวม, วิเคราะห์, และแปลความหมายของข้อมูลเพื่อสนับสนุนการตัดสินใจทางธุรกิจและการดำเนินงานในองค์กร"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                แนวทางการพัฒนาทักษะ <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="การเรียนรู้เทคนิคและเครื่องมือในการแสดงผลข้อมูลเพื่อสื่อสารผลการวิเคราะห์ให้ได้อย่างมีประสิทธิภาพ"
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="ศึกษาเครื่องมือใหม่ๆ เช่น Tableau, Power BI, Google Data Studio เพื่อเพิ่มประสิทธิภาพในการแสดงผลข้อมูล"
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="การฝึกฝนทักษะการสื่อสารเพื่อให้สามารถอธิบายผลการวิเคราะห์และข้อเสนอแนะได้อย่างชัดเจน"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ระบุข้อคำถาม 5 ข้อ <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="คุณชอบรวบรวมข้อมูลจากหลายแหล่งไหม?"
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="คุณสนใจการตรวจสอบและทำความสะอาดข้อมูลไหม?"
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="คุณชอบวิเคราะห์ข้อมูลเพื่อหาแนวโน้มหรือสรุปผลไหม?"
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="คุณชอบสร้างกราฟหรือแดชบอร์ดเพื่อแสดงผลการวิเคราะห์ไหม?"
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="คุณชอบนำเสนอหรืออธิบายผลการวิเคราะห์ให้ผู้อื่นเข้าใจไหม?"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

