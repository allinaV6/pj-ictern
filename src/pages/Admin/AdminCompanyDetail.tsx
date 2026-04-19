import AdminLayout from '../../components/AdminLayout';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

type CompanyItem = {
  company_id: number;
  company_name: string;
};

const SIMILARITY_THRESHOLD = 0.8;

export default function AdminCompanyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const normalizePhone = (value: string) => value.replace(/[\s()-]/g, '').trim();
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isValidPhone = (value: string) => /^(?:0\d{8,9}|\+66\d{8,9})$/.test(normalizePhone(value));
  const toLogoUrl = (value: string) => {
    if (!value) return '';
    return value.startsWith('http://') || value.startsWith('https://')
      ? value
      : `http://localhost:5000${value}`;
  };
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingCompanies, setExistingCompanies] = useState<CompanyItem[]>([]);
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

  function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const b64 = await fileToBase64(file);
      const resp = await axios.post('http://localhost:5000/api/uploads/logo', {
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

  useEffect(() => {
    Promise.all([
      axios.get(`http://localhost:5000/api/companies/${id}`),
      axios.get<CompanyItem[]>('http://localhost:5000/api/companies')
    ])
      .then(([companyRes, listRes]) => {
        const c = companyRes.data;
        setForm({
          company_name: c.company_name || '',
          company_address: c.company_address || '',
          company_type: c.company_type || '',
          company_email: c.company_email || '',
          company_phone_num: c.company_phone_num || '',
          company_link: c.company_link || '',
          company_description: c.company_description || '',
          company_logo: c.company_logo || '',
          company_status: typeof c.company_status === 'number' ? c.company_status : 1
        });
        setExistingCompanies(Array.isArray(listRes.data) ? listRes.data : []);
      })
      .catch((e) => console.error('fetch company error', e))
      .finally(() => setLoading(false));
  }, [id]);

  const normalizeCompanyName = (value: string) =>
    String(value || '')
      .toLowerCase()
      .replace(/บริษัท|company|co\.?|ltd\.?|limited|จำกัด/g, ' ')
      .replace(/[^\u0E00-\u0E7Fa-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const similarityScore = (a: string, b: string) => {
    if (!a || !b) return 0;
    if (a === b) return 1;

    const aChars = Array.from(a);
    const bChars = Array.from(b);
    const matrix = Array.from({ length: aChars.length + 1 }, () => Array<number>(bChars.length + 1).fill(0));

    for (let i = 0; i <= aChars.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= bChars.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= aChars.length; i++) {
      for (let j = 1; j <= bChars.length; j++) {
        const cost = aChars[i - 1] === bChars[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[aChars.length][bChars.length];
    const maxLen = Math.max(aChars.length, bChars.length);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  };

  const similarCompanyNames = useMemo(() => {
    const currentName = form.company_name.trim();
    if (!currentName) return [] as Array<{ name: string; score: number }>;

    const normalizedCurrent = normalizeCompanyName(currentName);
    if (!normalizedCurrent) return [] as Array<{ name: string; score: number }>;

    const currentId = Number(id);
    const matches = existingCompanies
      .filter((c) => Number(c.company_id) !== currentId)
      .map((c) => c.company_name)
      .filter(Boolean)
      .map((name) => {
        const normalizedExisting = normalizeCompanyName(name);
        if (!normalizedExisting) return null;
        return {
          name,
          score: similarityScore(normalizedCurrent, normalizedExisting),
        };
      })
      .filter((item): item is { name: string; score: number } => Boolean(item))
      .filter((item) => item.score >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    const deduped = Array.from(new Map(matches.map((item) => [item.name, item])).values());
    return deduped.slice(0, 3);
  }, [existingCompanies, form.company_name, id]);

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    const missingFields: string[] = [];

    const requiredFields = [
      { key: 'company_name', label: 'ชื่อบริษัท', value: form.company_name },
      { key: 'company_link', label: 'เว็บไซต์บริษัท', value: form.company_link },
      { key: 'company_address', label: 'จังหวัด', value: form.company_address },
      { key: 'company_type', label: 'ประเภทของบริษัท', value: form.company_type },
      { key: 'company_description', label: 'คำอธิบายบริษัท', value: form.company_description }
    ];

    requiredFields.forEach((field) => {
      if (!String(field.value).trim()) {
        nextErrors[field.key] = `กรุณากรอก${field.label}`;
        missingFields.push(field.label);
      }
    });

    if (form.company_phone_num.trim() && !isValidPhone(form.company_phone_num)) {
      nextErrors.company_phone_num = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    if (form.company_email.trim() && !isValidEmail(form.company_email)) {
      nextErrors.company_email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    const normalizedCurrentName = normalizeCompanyName(form.company_name);
    const currentId = Number(id);
    const hasExactDuplicateName = existingCompanies.some(
      (company) => Number(company.company_id) !== currentId
        && normalizeCompanyName(company.company_name) === normalizedCurrentName
    );

    if (normalizedCurrentName && hasExactDuplicateName) {
      nextErrors.company_name = 'ชื่อบริษัทนี้มีอยู่แล้วในระบบ';
    }

    setErrors(nextErrors);

    if (missingFields.length > 0 || nextErrors.company_phone_num || nextErrors.company_email || nextErrors.company_name) {
      const invalidFormats: string[] = [];
      if (nextErrors.company_phone_num) invalidFormats.push('เบอร์โทรศัพท์');
      if (nextErrors.company_email) invalidFormats.push('อีเมล');

      if (missingFields.length > 0 && invalidFormats.length > 0) {
        alert(`กรุณาตรวจสอบข้อมูล: ช่องที่ต้องกรอก ${missingFields.join(', ')} และรูปแบบ ${invalidFormats.join(', ')}`);
      } else if (missingFields.length > 0) {
        alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน: ${missingFields.join(', ')}`);
      } else {
        alert(`รูปแบบข้อมูลไม่ถูกต้อง: ${invalidFormats.join(', ')}`);
      }
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/companies/${id}`, form);
      alert('บันทึกข้อมูลสำเร็จ');
      navigate('/admin/companies');
    } catch (e) {
      console.error(e);
      if (axios.isAxiosError(e)) {
        const message = String(e.response?.data?.message || 'บันทึกไม่สำเร็จ');
        if (e.response?.status === 409) {
          setErrors((prev) => ({ ...prev, company_name: message }));
        }
        alert(message);
      } else {
        alert('บันทึกไม่สำเร็จ');
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('ยืนยันการลบบริษัทนี้?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/companies/${id}`);
      alert('ลบข้อมูลสำเร็จ');
      navigate('/admin/companies');
    } catch (e) {
      console.error(e);
      alert('ลบไม่สำเร็จ (อาจมีการอ้างอิงในโพสต์)');
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
      <div className="bg-blue-900 text-white px-4 py-10 mb-8 sticky top-[81px] z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold">รายละเอียดบริษัท</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/admin/companies')}
            >
              ยกเลิก
            </button>
            <button
              className="px-6 py-2.5 rounded-lg bg-red-600 border border-white text-white font-semibold text-base hover:bg-red-700 transition-colors"
              onClick={handleDelete}
            >
              ลบบริษัท
            </button>
            <button
              className="px-6 py-2.5 rounded-lg bg-blue-900 border border-white text-white font-semibold text-base hover:bg-blue-800 transition-colors"
              onClick={handleSave}
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-sm text-gray-400 mb-4 font-mono">Company ID: {id}</p>
          <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr,2fr] gap-8 mb-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                รูปบริษัท
              </p>
              {form.company_logo ? (
                <img
                  src={toLogoUrl(form.company_logo)}
                  className={`w-40 h-40 rounded-xl object-cover border ${errors.company_logo ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                />
              ) : (
                <div className={`w-40 h-40 rounded-xl bg-blue-900 flex items-center justify-center text-white text-sm font-semibold ${errors.company_logo ? 'ring-2 ring-red-300' : ''}`}>
                  Logo
                </div>
              )}
              <label className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer">
                {uploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูป'}
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
                placeholder="URL รูปโลโก้"
                className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.company_logo ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                value={form.company_logo}
                onChange={(e) => setForm({ ...form, company_logo: e.target.value })}
              />
              {errors.company_logo && <p className="mt-1 text-sm text-red-600">{errors.company_logo}</p>}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อบริษัท <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.company_name ? 'border-red-500 focus:ring-red-500' : similarCompanyNames.length > 0 ? 'border-amber-400 focus:ring-amber-400' : 'border-gray-300 focus:ring-blue-500'}`}
                  value={form.company_name}
                  onChange={(e)=>setForm({...form, company_name: e.target.value})}
                />
                {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>}
                {!errors.company_name && similarCompanyNames.length > 0 && (
                  <p className="mt-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    มีบริษัทที่ชื่อคล้ายกันอยู่แล้วในระบบ: {similarCompanyNames.map((item) => `'${item.name}'`).join(', ')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.company_phone_num ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    value={form.company_phone_num}
                    onChange={(e)=>setForm({...form, company_phone_num: normalizePhone(e.target.value)})}
                  />
                  {errors.company_phone_num && <p className="mt-1 text-sm text-red-600">{errors.company_phone_num}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เว็บไซต์บริษัท <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.company_link ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    value={form.company_link}
                    onChange={(e)=>setForm({...form, company_link: e.target.value})}
                  />
                  {errors.company_link && <p className="mt-1 text-sm text-red-600">{errors.company_link}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.company_address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    value={form.company_address}
                    onChange={(e)=>setForm({...form, company_address: e.target.value})}
                  />
                  {errors.company_address && <p className="mt-1 text-sm text-red-600">{errors.company_address}</p>}
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
                    className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.company_email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    value={form.company_email}
                    onChange={(e)=>setForm({...form, company_email: e.target.value})}
                  />
                  {errors.company_email && <p className="mt-1 text-sm text-red-600">{errors.company_email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ประเภทของบริษัท <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 ${errors.company_type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    value={form.company_type}
                    onChange={(e)=>setForm({...form, company_type: e.target.value})}
                  />
                  {errors.company_type && <p className="mt-1 text-sm text-red-600">{errors.company_type}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คำอธิบายบริษัท <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`w-full border rounded-lg px-4 py-2.5 text-base h-40 resize-none focus:outline-none focus:ring-2 ${errors.company_description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                value={form.company_description}
                onChange={(e)=>setForm({...form, company_description: e.target.value})}
              />
              {errors.company_description && <p className="mt-1 text-sm text-red-600">{errors.company_description}</p>}
            </div>
          </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
