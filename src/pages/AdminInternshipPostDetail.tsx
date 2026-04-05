import AdminLayout from '../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';

type Company = {
  company_id: number;
  company_name: string;
};

type PostResponse = {
  internship_title?: string;
  company_id?: number;
  company_name?: string;
  internship_working_method?: string;
  internship_duration?: string | number;
  internship_location?: string;
  internship_compensation?: string;
  internship_description?: string;
  internship_responsibilities?: string;
  internship_requirements?: string;
  internship_expired_date?: string;
  internship_link?: string;
  internship_poster?: string;
  internship_status?: number;
  mou?: number;
};

const PROVINCES = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท',
  'ชัยภูมิ','ชุมพร','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช',
  'นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี',
  'พระนครศรีอยุธยา','พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต',
  'มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี',
  'ลำปาง','ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร',
  'สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง',
  'อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี','เชียงราย','เชียงใหม่'
];

const COMP_UNITS = ['ต่อเดือน', 'ต่อวัน'];

export default function AdminInternshipPostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isValidHttpUrl = (value: string) => {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [compensationAmount, setCompensationAmount] = useState('');
  const [compensationUnit, setCompensationUnit] = useState(COMP_UNITS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    internship_title: '',
    company_id: '',
    internship_working_method: '',
    internship_duration: '',
    internship_location: '',
    internship_compensation: '',
    internship_description: '',
    internship_responsibilities: '',
    internship_requirements: '',
    internship_expired_date: '',
    internship_link: '',
    internship_apply_type: 'link',
    internship_poster: '',
    internship_status: 1,
    mou: 0
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const response = await axios.post('http://localhost:5000/api/uploads/poster', {
          filename: file.name,
          data: reader.result
        });
        setFormData(prev => ({ ...prev, internship_poster: response.data.url }));
      } catch (error) {
        console.error('Error uploading poster:', error);
        alert('อัปโหลดรูปภาพไม่สำเร็จ');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postRes, companiesRes] = await Promise.all([
          axios.get<PostResponse>(`http://localhost:5000/api/posts/${id}`),
          axios.get<Company[]>('http://localhost:5000/api/companies')
        ]);

        const post = postRes.data;
        const comp = (post.internship_compensation || '').trim();
        const matchedUnit = COMP_UNITS.find((u) => comp.endsWith(u));
        const derivedUnit = matchedUnit || COMP_UNITS[0];
        const derivedAmount = matchedUnit ? comp.slice(0, comp.length - matchedUnit.length).trim() : comp;
        setCompensationUnit(derivedUnit);
        setCompensationAmount(derivedAmount);

        setFormData({
          internship_title: post.internship_title || '',
          company_id: post.company_id ? String(post.company_id) : '',
          internship_working_method: post.internship_working_method || '',
          internship_duration: post.internship_duration ? String(post.internship_duration) : '',
          internship_location: post.internship_location || '',
          internship_compensation: post.internship_compensation || '',
          internship_description: post.internship_description || '',
          internship_responsibilities: post.internship_responsibilities || '',
          internship_requirements: post.internship_requirements || '',
          internship_expired_date: post.internship_expired_date ? post.internship_expired_date.split('T')[0] : '',
          internship_link: post.internship_link || '',
          internship_apply_type: (post as any).internship_apply_type || 'link',
          internship_poster: post.internship_poster || '',
          internship_status: post.internship_status ?? 1,
          mou: post.mou ?? 0
        });
        setCompanySearch(post.company_name || '');
        setCompanies(companiesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('ไม่พบข้อมูลโพสต์นี้');
        navigate('/admin/internship-posts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const filteredCompanies = companies.filter(c => 
    c.company_name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleSelectCompany = (company: Company) => {
    setFormData({ ...formData, company_id: String(company.company_id) });
    setCompanySearch(company.company_name);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    const exactCompany = companies.find(
      (c) => c.company_name.toLowerCase() === companySearch.trim().toLowerCase()
    );
    const company_id = formData.company_id || (exactCompany ? String(exactCompany.company_id) : '');
    const internship_compensation = compensationAmount.trim()
      ? [compensationAmount.trim(), compensationUnit].filter(Boolean).join(' ')
      : '';

    const nextErrors: Record<string, string> = {};
    const missingFields: string[] = [];
    const requiredFields = [
      { key: 'internship_title', label: 'ชื่อโพสต์ประกาศ', value: formData.internship_title },
      { key: 'company_id', label: 'บริษัท', value: company_id },
      { key: 'internship_working_method', label: 'รูปแบบการฝึกงาน', value: formData.internship_working_method },
      { key: 'internship_location', label: 'จังหวัด', value: formData.internship_location },
      { key: 'internship_duration', label: 'ระยะเวลาฝึกงาน', value: formData.internship_duration },
      { key: 'internship_expired_date', label: 'วันที่ปิดรับสมัคร', value: formData.internship_expired_date },
      { key: 'internship_link', label: 'ช่องทางการสมัครงาน', value: formData.internship_link },
      { key: 'internship_description', label: 'รายละเอียดงาน', value: formData.internship_description },
      { key: 'internship_responsibilities', label: 'หน้าที่และความรับผิดชอบ', value: formData.internship_responsibilities },
      { key: 'internship_requirements', label: 'คุณสมบัติผู้สมัคร', value: formData.internship_requirements }
    ];

    requiredFields.forEach((field) => {
      if (!String(field.value).trim()) {
        nextErrors[field.key] = `กรุณากรอก${field.label}`;
        missingFields.push(field.label);
      }
    });

    const applyLink = formData.internship_link.trim();
    if (applyLink) {
      if (formData.internship_apply_type === 'email' && !isValidEmail(applyLink)) {
        nextErrors.internship_link = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
      if (formData.internship_apply_type !== 'email' && !isValidHttpUrl(applyLink)) {
        nextErrors.internship_link = 'ลิงก์สมัครงานต้องขึ้นต้นด้วย http:// หรือ https://';
      }
    }

    setErrors(nextErrors);

    if (missingFields.length > 0 || nextErrors.internship_link) {
      if (missingFields.length > 0 && nextErrors.internship_link) {
        alert(`กรุณาตรวจสอบข้อมูล: ช่องที่ต้องกรอก ${missingFields.join(', ')} และรูปแบบช่องทางการสมัครงาน`);
      } else if (missingFields.length > 0) {
        alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน: ${missingFields.join(', ')}`);
      } else {
        alert(nextErrors.internship_link);
      }
      return;
    }

    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const account_id = user?.id;

      await axios.put(`http://localhost:5000/api/posts/${id}`, { ...formData, company_id, account_id, internship_compensation });
      alert('แก้ไขข้อมูลสำเร็จ');
      navigate('/admin/internship-posts');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) {
      try {
        await axios.delete(`http://localhost:5000/api/posts/${id}`);
        alert('ลบโพสต์สำเร็จ');
        navigate('/admin/internship-posts');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  if (loading) return <AdminLayout><div className="p-10 text-center">กำลังโหลด...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10 mb-8 sticky top-[81px] z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold">รายละเอียดประกาศงาน</h1>
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/admin/internship-posts')}
            >
              ยกเลิก
            </button>
            <button
              className="px-6 py-2.5 rounded-lg bg-red-600 border border-white text-white font-semibold text-base hover:bg-red-700 transition-colors"
              onClick={handleDelete}
            >
              ลบโพสต์
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
          <p className="text-sm text-gray-400 mb-4 font-mono">Post ID: {id}</p>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อโพสต์ประกาศ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 bg-white ${errors.internship_title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  placeholder="ชื่อโพสต์ประกาศการฝึกงาน"
                  value={formData.internship_title}
                  onChange={(e) => setFormData({ ...formData, internship_title: e.target.value })}
                />
                {errors.internship_title && <p className="mt-1 text-sm text-red-600">{errors.internship_title}</p>}
              </div>

              <div className="md:col-span-2 relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  บริษัท <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full border rounded-lg pl-4 pr-10 py-2.5 text-base focus:outline-none focus:ring-2 bg-white cursor-pointer ${errors.company_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder="เลือกหรือค้นหาบริษัท"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setFormData({ ...formData, company_id: '' });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onClick={() => setShowSuggestions(!showSuggestions)}
                  />
                  <ChevronDown 
                    size={18} 
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${showSuggestions ? 'rotate-180' : ''}`} 
                  />
                </div>
                {showSuggestions && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map(c => (
                        <div
                          key={c.company_id}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 border-b last:border-none text-base"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectCompany(c);
                          }}
                        >
                          {c.company_name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-400 italic text-center py-4">ไม่พบบริษัทที่ค้นหา</div>
                    )}
                  </div>
                )}
                {errors.company_id && <p className="mt-1 text-sm text-red-600">{errors.company_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รูปแบบการฝึกงาน <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 bg-white ${errors.internship_working_method ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  value={formData.internship_working_method}
                  onChange={(e) => setFormData({ ...formData, internship_working_method: e.target.value })}
                >
                  <option value="" disabled>เลือกรูปแบบการฝึกงาน</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
                {errors.internship_working_method && <p className="mt-1 text-sm text-red-600">{errors.internship_working_method}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  จังหวัด <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 bg-white ${errors.internship_location ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  value={formData.internship_location}
                  onChange={(e) => setFormData({ ...formData, internship_location: e.target.value })}
                >
                  <option value="" disabled>เลือกจังหวัด</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.internship_location && <p className="mt-1 text-sm text-red-600">{errors.internship_location}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ระยะเวลาฝึกงาน (เดือน) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 bg-white ${errors.internship_duration ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  placeholder="ระยะเวลาฝึกงาน"
                  value={formData.internship_duration}
                  onChange={(e) => setFormData({ ...formData, internship_duration: e.target.value })}
                />
                {errors.internship_duration && <p className="mt-1 text-sm text-red-600">{errors.internship_duration}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ค่าตอบแทน
                </label>
                <div className="grid grid-cols-[1fr_140px] gap-3">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="ระบุค่าตอบแทน"
                    value={compensationAmount}
                    onChange={(e) => setCompensationAmount(e.target.value)}
                  />
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={compensationUnit}
                    onChange={(e) => setCompensationUnit(e.target.value)}
                  >
                    {COMP_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  วันที่ปิดรับสมัคร <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 bg-white ${errors.internship_expired_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  value={formData.internship_expired_date}
                  onChange={(e) => setFormData({ ...formData, internship_expired_date: e.target.value })}
                />
                {errors.internship_expired_date && <p className="mt-1 text-sm text-red-600">{errors.internship_expired_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  สถานะการเปิดรับสมัคร <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.internship_status}
                  onChange={(e) => setFormData({ ...formData, internship_status: parseInt(e.target.value) })}
                >
                  <option value={1}>เปิดรับสมัคร</option>
                  <option value={0}>ปิดรับสมัคร</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  เป็น MOU กับมหาวิทยาลัยหรือไม่
                </label>
                <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={formData.mou === 1}
                    onChange={(e) => setFormData({ ...formData, mou: e.target.checked ? 1 : 0 })}
                  />
                  ใช่ (แสดงสัญลักษณ์ MOU)
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ช่องทางการสมัครงาน <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-6 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="apply_type"
                      value="link"
                      checked={formData.internship_apply_type === 'link'}
                      onChange={(e) => setFormData({ ...formData, internship_apply_type: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">ลิงก์สมัครงาน</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="apply_type"
                      value="email"
                      checked={formData.internship_apply_type === 'email'}
                      onChange={(e) => setFormData({ ...formData, internship_apply_type: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">อีเมลติดต่อ</span>
                  </label>
                </div>
                <input
                  type={formData.internship_apply_type === 'email' ? 'email' : 'text'}
                  className={`w-full border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 bg-white ${errors.internship_link ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  placeholder={formData.internship_apply_type === 'email' ? 'เช่น hr@company.com' : 'เช่น https://company.com/apply'}
                  value={formData.internship_link}
                  onChange={(e) => setFormData({ ...formData, internship_link: e.target.value })}
                />
                {errors.internship_link && <p className="mt-1 text-sm text-red-600">{errors.internship_link}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รูปโปสเตอร์ประชาสัมพันธ์ (ลิงก์รูปภาพ หรือ อัปโหลดไฟล์)
                </label>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="เช่น https://example.com/poster.jpg หรืออัปโหลดด้านล่าง"
                    value={formData.internship_poster}
                    onChange={(e) => setFormData({ ...formData, internship_poster: e.target.value })}
                  />
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData.internship_poster && (
                      <div className="text-xs text-green-600 font-medium">
                        (มีไฟล์/ลิงก์รูปภาพแล้ว)
                      </div>
                    )}
                  </div>
                  {formData.internship_poster && (
                    <div className="mt-2 border rounded-lg p-2 bg-gray-50 flex justify-center">
                      <img 
                        src={formData.internship_poster.startsWith('/') ? `http://localhost:5000${formData.internship_poster}` : formData.internship_poster} 
                        alt="Poster Preview" 
                        className="max-h-40 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                รายละเอียดงาน <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 min-h-[140px] ${errors.internship_description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="ใส่คำอธิบาย..."
                maxLength={1000}
                value={formData.internship_description}
                onChange={(e) => setFormData({ ...formData, internship_description: e.target.value })}
              ></textarea>
              {errors.internship_description && <p className="mt-1 text-sm text-red-600">{errors.internship_description}</p>}
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {formData.internship_description.length}/1000
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                หน้าที่และความรับผิดชอบ ( 1บรรทัด ต่อ 1ข้อ ) <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 min-h-[140px] ${errors.internship_responsibilities ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="(1บรรทัด ต่อ 1ข้อ)"
                maxLength={1000}
                value={formData.internship_responsibilities}
                onChange={(e) => setFormData({ ...formData, internship_responsibilities: e.target.value })}
              ></textarea>
              {errors.internship_responsibilities && <p className="mt-1 text-sm text-red-600">{errors.internship_responsibilities}</p>}
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {formData.internship_responsibilities.length}/1000
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คุณสมบัติผู้สมัคร ( 1บรรทัด ต่อ 1ข้อ ) <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 min-h-[140px] ${errors.internship_requirements ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="( 1บรรทัด ต่อ 1ข้อ )"
                maxLength={1000}
                value={formData.internship_requirements}
                onChange={(e) => setFormData({ ...formData, internship_requirements: e.target.value })}
              ></textarea>
              {errors.internship_requirements && <p className="mt-1 text-sm text-red-600">{errors.internship_requirements}</p>}
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {formData.internship_requirements.length}/1000
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
