import AdminLayout from '../components/AdminLayout';
import { 
  Calendar, 
  ChevronDown, 
  Home
} from 'lucide-react';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10">
        <div className="max-w-6xl mx-auto pl-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">ภาพรวมและข้อมูลล่าสุด</h1>
          <p className="text-blue-200 text-lg">ดูสถิติและข้อมูลสรุปสำคัญของระบบทั้งหมด</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-4 mb-8">
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-base">
            <Calendar size={18} />
            01/01/2025 - 01/01/2025
          </button>
          
          <div className="relative">
            <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-base">
              ตำแหน่ง
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-base">
              หมวดหมู่
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="จำนวนประกาศงานทั้งหมด" value="10" />
          <StatCard title="จำนวนบริษัททั้งหมด" value="12" />
          <StatCard title="จำนวนรีวิวทั้งหมด" value="7" />
          <StatCard title="จำนวนนักศึกษาฝึกงานทั้งหมด" value="54" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-gray-700 font-semibold mb-6 text-center text-lg">นักศึกษาฝึกงานทั้งหมด</h3>
            <div className="flex items-center justify-center gap-8">
               <div className="relative w-48 h-48 rounded-full overflow-hidden" 
                    style={{ background: 'conic-gradient(#3b82f6 0% 33%, #818cf8 33% 66%, #f87171 66% 100%)' }}>
                 <div className="absolute top-1/2 left-1/4 text-white text-xs font-bold -translate-y-1/2">SCG Innovate<br/>55</div>
                 <div className="absolute top-1/4 right-4 text-white text-xs font-bold">Creative Digital Agency<br/>54</div>
                 <div className="absolute bottom-4 right-1/4 text-white text-xs font-bold">Innovate Systems<br/>54</div>
               </div>
               
               <div className="space-y-2 text-sm text-gray-600">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-[#818cf8]"></div>
                   <span>Creative Digital Agency</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-[#f87171]"></div>
                   <span>Innovate Systems</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                   <span>SCG Innovate</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-gray-700 font-semibold mb-6 text-center text-lg">จำนวนประกาศฝึกงานตามบริษัท</h3>
            <div className="h-64 flex items-end justify-center gap-8 pb-6 border-b border-gray-100 relative">
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                 {[4,3,2,1,0].map(n => (
                   <div key={n} className="border-t border-gray-100 w-full h-0 flex items-center">
                     <span className="text-xs text-gray-400 -ml-6">{n}</span>
                   </div>
                 ))}
               </div>

               <div className="relative z-10 flex flex-col items-center gap-2">
                 <div className="flex items-end gap-1">
                   <div className="w-16 bg-[#818cf8] h-12 rounded-t"></div>
                   <div className="w-16 bg-[#f87171] h-36 rounded-t"></div>
                 </div>
                 <span className="text-xs text-gray-500 mt-2">2024</span>
                 <div className="flex gap-4 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#818cf8]"></div>Creative Digital Agency</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#f87171]"></div>Innovate Systems</span>
                 </div>
               </div>

               <div className="relative z-10 flex flex-col items-center gap-2">
                 <div className="flex items-end gap-1">
                   <div className="w-16 bg-[#818cf8] h-24 rounded-t"></div>
                   <div className="w-16 bg-[#f87171] h-48 rounded-t"></div>
                 </div>
                 <span className="text-xs text-gray-500 mt-2">2025</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center h-40">
      <h3 className="text-gray-500 text-base mb-2">{title}</h3>
      <div className="text-4xl md:text-5xl font-bold text-blue-900">{value}</div>
    </div>
  );
}
