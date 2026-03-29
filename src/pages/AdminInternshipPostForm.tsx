import AdminLayout from '../components/AdminLayout';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';

type Company = {
  company_id: number;
  company_name: string;
};

const PROVINCES = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท',
  'ชัยภูมิ','ชุมพร','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช',
  'นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี',
  'พระนครศรีอยุธยา','พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต',
  'มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี',
  'ลำปาง','ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร',
  'สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง',
  'อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี','เชียงราย','เชียงใหม่','เพชรบูรณ์','แพร่','ลำปาง'
].filter((v, i, a) => a.indexOf(v) === i);

const COMP_UNITS = ['ต่อเดือน', 'ต่อวัน'];

export default function AdminInternshipPostForm() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [compensationAmount, setCompensationAmount] = useState('');
  const [compensationUnit, setCompensationUnit] = useState(COMP_UNITS[0]);
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
    internship_status: 1,
    mou: 0
  });

  useEffect(() => {
    axios
      .get<Company[]>('http://localhost:5002/api/companies')
      .then((response) => {
        setCompanies(response.data);
      })
      .catch((error) => {
        console.error('Error fetching companies:', error);
      });
  }, []);

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

    if (
      !formData.internship_title ||
      !company_id ||
      !formData.internship_working_method ||
      !formData.internship_location ||
      !formData.internship_duration ||
      !formData.internship_expired_date
    ) {
      alert('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
      return;
    }

    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const account_id = user?.id;

      await axios.post('http://localhost:5002/api/posts', { ...formData, company_id, account_id, internship_compensation });
      alert('บันทึกสำเร็จ');
      navigate('/admin/internship-posts');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold text-gray-800">เพิ่มโพสต์ประกาศรับสมัครนักศึกษาฝึกงาน</h1>
            <div className="flex items-center gap-3">
              <button
                className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-50"
                onClick={() => navigate('/admin/internship-posts')}
              >
                ยกเลิก
              </button>
              <button
                className="px-7 py-2.5 rounded-lg bg-blue-900 text-white font-semibold text-base hover:bg-blue-800"
                onClick={handleSave}
              >
                บันทึก
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อโพสต์ประกาศ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="ชื่อโพสต์ประกาศการฝึกงาน"
                  value={formData.internship_title}
                  onChange={(e) => setFormData({ ...formData, internship_title: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  บริษัท <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="ค้นหาบริษัท"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setFormData({ ...formData, company_id: '' });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {showSuggestions && companySearch && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map(c => (
                        <div
                          key={c.company_id}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 border-b last:border-none"
                          onClick={() => handleSelectCompany(c)}
                        >
                          {c.company_name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-400 italic">ไม่พบบริษัทนี้</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รูปแบบการฝึกงาน <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.internship_working_method}
                  onChange={(e) => setFormData({ ...formData, internship_working_method: e.target.value })}
                >
                  <option value="" disabled>เลือกรูปแบบการฝึกงาน</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  จังหวัด <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.internship_location}
                  onChange={(e) => setFormData({ ...formData, internship_location: e.target.value })}
                >
                  <option value="" disabled>เลือกจังหวัด</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ระยะเวลาฝึกงาน (เดือน) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="ระยะเวลาฝึกงาน"
                  value={formData.internship_duration}
                  onChange={(e) => setFormData({ ...formData, internship_duration: e.target.value })}
                />
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.internship_expired_date}
                  onChange={(e) => setFormData({ ...formData, internship_expired_date: e.target.value })}
                />
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
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-gray-700">
                    <input
                      type="radio"
                      name="mou"
                      checked={formData.mou === 1}
                      onChange={() => setFormData({ ...formData, mou: 1 })}
                    />
                    ใช่ (แสดงสัญลักษณ์ MOU)
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-700">
                    <input
                      type="radio"
                      name="mou"
                      checked={formData.mou === 0}
                      onChange={() => setFormData({ ...formData, mou: 0 })}
                    />
                    ไม่ใช่
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ลิงก์สำหรับสมัครงาน
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="เช่น https://company.com/apply"
                  value={formData.internship_link}
                  onChange={(e) => setFormData({ ...formData, internship_link: e.target.value })}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                รายละเอียดงาน <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[140px]"
                placeholder="ใส่คำอธิบาย..."
                maxLength={1000}
                value={formData.internship_description}
                onChange={(e) => setFormData({ ...formData, internship_description: e.target.value })}
              ></textarea>
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {formData.internship_description.length}/1000
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                หน้าที่และความรับผิดชอบ ( 1บรรทัด ต่อ 1ข้อ ) <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[140px]"
                placeholder="( 1บรรทัด ต่อ 1ข้อ )"
                maxLength={1000}
                value={formData.internship_responsibilities}
                onChange={(e) => setFormData({ ...formData, internship_responsibilities: e.target.value })}
              ></textarea>
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {formData.internship_responsibilities.length}/1000
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คุณสมบัติผู้สมัคร ( 1บรรทัด ต่อ 1ข้อ )<span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[140px]"
                placeholder="( 1บรรทัด ต่อ 1ข้อ )"
                maxLength={1000}
                value={formData.internship_requirements}
                onChange={(e) => setFormData({ ...formData, internship_requirements: e.target.value })}
              ></textarea>
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
