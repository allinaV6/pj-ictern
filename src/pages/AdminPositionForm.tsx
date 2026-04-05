import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function AdminPositionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    position_name: '',
    position_description: '',
    position_skill: '',
    questions: ['', '', '', '', '']
  });



  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...form.questions];
    newQuestions[index] = value;
    setForm({ ...form, questions: newQuestions });
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    const missingFields: string[] = [];

    if (!form.position_name.trim()) {
      nextErrors.position_name = 'กรุณาระบุชื่อตำแหน่งงาน';
      missingFields.push('ชื่อตำแหน่งงาน');
    }

    setErrors(nextErrors);

    if (missingFields.length > 0) {
      alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน: ${missingFields.join(', ')}`);
      return;
    }

    const payload = {
      ...form,
      position_name: form.position_name.trim(),
      position_description: form.position_description.trim(),
      position_skill: form.position_skill.trim(),
      questions: form.questions.map((q) => q.trim())
    };

    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/admin/positions', payload);
      alert('เพิ่มตำแหน่งงานสำเร็จ');
      navigate('/admin/positions');
    } catch (error: any) {
      console.error('Error saving position:', error);
      const errorMsg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10 mb-8 sticky top-[81px] z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold">เพิ่มตำแหน่งงาน</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/admin/positions')}
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              className="px-6 py-2.5 rounded-lg bg-blue-900 border border-white text-white font-semibold text-base hover:bg-blue-800 disabled:opacity-50 transition-colors"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
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
                className={`w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.position_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="ระบุตำแหน่งงาน"
                value={form.position_name}
                onChange={(e) => setForm({ ...form, position_name: e.target.value })}
              />
              {errors.position_name && <p className="mt-1 text-sm text-red-600">{errors.position_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คำอธิบายตำแหน่งงาน
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ระบุคำอธิบายตำแหน่งงาน"
                value={form.position_description}
                onChange={(e) => setForm({ ...form, position_description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                แนวทางการพัฒนาทักษะ
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ระบุแนวทางการพัฒนาทักษะ"
                value={form.position_skill}
                onChange={(e) => setForm({ ...form, position_skill: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ระบุข้อคำถาม 5 ข้อ
              </label>
              <div className="space-y-3">
                {form.questions.map((q, index) => (
                  <input
                    key={index}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`คำถามข้อที่ ${index + 1}`}
                    value={q}
                    onChange={(e) => handleQuestionChange(index, e.target.value)}
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

