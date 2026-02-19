import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';

export default function AdminPositionForm() {
  const navigate = useNavigate();

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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อตำแหน่งงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ระบุตำแหน่งงาน"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คำอธิบายตำแหน่งงาน <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ระบุคำอธิบายตำแหน่งงาน"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                แนวทางการพัฒนาทักษะ <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {[1, 2, 3].map((index) => (
                  <input
                    key={index}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${index}.`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ระบุข้อคำถาม 5 ข้อ <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${index}.`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

