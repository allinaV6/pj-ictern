import AdminLayout from '../components/AdminLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPositionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    position_name: '',
    position_description: '',
    position_skill: '',
    questions: ['', '', '', '', '']
  });

  const normalizeQuestions = (rawQuestions: any[] = []) => {
    const questionTexts = rawQuestions
      .map((q) => (q?.quiz_question || '').toString().trim())
      .filter(Boolean)
      .slice(0, 5);

    while (questionTexts.length < 5) {
      questionTexts.push('');
    }

    return questionTexts;
  };

  useEffect(() => {
    if (id) fetchPosition();
  }, [id]);

  const fetchPosition = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/admin/positions/${id}`);
      const data = response.data;
      setForm({
        position_name: data.position_name || '',
        position_description: data.position_description || '',
        position_skill: data.position_skill || '',
        questions: normalizeQuestions(data.questions)
      });
    } catch (error) {
      console.error('Error fetching position:', error);
      alert('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };



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
      setSaving(true);
      await axios.put(`http://localhost:5000/api/admin/positions/${id}`, payload);
      alert('แก้ไขข้อมูลสำเร็จ');
      navigate('/admin/positions');
    } catch (error) {
      console.error('Error saving position:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm('คุณต้องการลบตำแหน่งงานนี้ใช่หรือไม่? (คำถามที่เกี่ยวข้องจะถูกลบไปด้วย)');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await axios.delete(`http://localhost:5000/api/admin/positions/${id}`);
      alert('ลบข้อมูลสำเร็จ');
      navigate('/admin/positions');
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen text-gray-500 italic">กำลังโหลดข้อมูล...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10 mb-8 sticky top-[81px] z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold">รายละเอียดตำแหน่งงาน</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/admin/positions')}
              disabled={saving}
            >
              ยกเลิก
            </button>
            <button
              className="px-6 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 font-semibold text-base hover:bg-red-100 transition-colors disabled:opacity-50"
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? 'กำลังลบ...' : 'ลบตำแหน่ง'}
            </button>
            <button 
              className="px-6 py-2.5 rounded-lg bg-blue-900 border border-white text-white font-semibold text-base hover:bg-blue-800 disabled:opacity-50 transition-colors"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-sm text-gray-400 mb-4 font-mono">Position ID: {id}</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อตำแหน่งงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.position_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
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

