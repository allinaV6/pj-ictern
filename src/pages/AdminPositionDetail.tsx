import AdminLayout from '../components/AdminLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPositionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    position_name: '',
    position_description: '',
    position_skill: '',
    questions: ['', '', '', '', '']
  });

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
        questions: data.questions?.map((q: any) => q.quiz_question) || ['', '', '', '', '']
      });
    } catch (error) {
      console.error('Error fetching position:', error);
      alert('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillChange = (index: number, value: string) => {
    const skills = form.position_skill.split('\n');
    skills[index] = value;
    setForm({ ...form, position_skill: skills.join('\n') });
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...form.questions];
    newQuestions[index] = value;
    setForm({ ...form, questions: newQuestions });
  };

  const handleSave = async () => {
    if (!form.position_name || !form.position_description) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (form.questions.some(q => !q.trim())) {
      alert('กรุณาระบุข้อคำถามให้ครบ 5 ข้อ');
      return;
    }

    try {
      setSaving(true);
      await axios.put(`http://localhost:5000/api/admin/positions/${id}`, form);
      alert('แก้ไขข้อมูลสำเร็จ');
      navigate('/admin/positions');
    } catch (error) {
      console.error('Error saving position:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
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
      <div className="bg-blue-900 text-white px-4 py-8 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">แก้ไขตำแหน่งงาน</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100"
              onClick={() => navigate('/admin/positions')}
              disabled={saving}
            >
              ยกเลิก
            </button>
            <button 
              className="px-6 py-2.5 rounded-lg bg-blue-900 border border-white text-white font-semibold text-base hover:bg-blue-800 disabled:opacity-50"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.position_name}
                onChange={(e) => setForm({ ...form, position_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คำอธิบายตำแหน่งงาน <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.position_description}
                onChange={(e) => setForm({ ...form, position_description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                แนวทางการพัฒนาทักษะ (ระบุเป็นข้อๆ) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${index + 1}.`}
                    value={form.position_skill.split('\n')[index] || ''}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ระบุข้อคำถาม 5 ข้อ <span className="text-red-500">*</span>
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

