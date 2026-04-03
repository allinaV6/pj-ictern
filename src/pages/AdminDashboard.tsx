import AdminLayout from '../components/AdminLayout';
import { 
  Calendar, Check, ChevronDown, X
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface DashboardData {
  openPosts: number;
  closedPosts: number;
  totalCompanies: number;
  totalReviews: number;
  totalInterns: number;
  positionDistribution: Array<{ name: string; value: number }>;
  barChartData: Array<{ name: string; value: number }>;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1'
];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const params: any = { startDate, endDate };
        if (selectedPositions.length > 0) {
          params.position = selectedPositions;
        }

        const response = await axios.get(`http://localhost:5000/api/dashboard/summary`, {
          params,
          // Handle array parameters correctly in axios
          paramsSerializer: {
            indexes: null 
          }
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [startDate, endDate, selectedPositions]);

  const togglePosition = (position: string) => {
    setSelectedPositions(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position) 
        : [...prev, position]
    );
  };

  const clearPositions = () => setSelectedPositions([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/dashboard/filters`);
        setPositionOptions(response.data.positionOptions || []);
      } catch (error) {
        console.error('Error fetching dashboard filters:', error);
      }
    };

    fetchFilters();
  }, []);

  if (loading && !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-xl font-medium text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </AdminLayout>
    );
  }

  const totalPostsCount = (data?.openPosts || 0) + (data?.closedPosts || 0);

  return (
    <AdminLayout>
      <div className="bg-blue-900 text-white px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold">ภาพรวมและข้อมูลล่าสุด</h1>
          <p className="text-lg text-blue-100 mt-2">ดูสถิติและข้อมูลสรุปสำคัญของระบบทั้งหมด</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-8 ml-2">
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-600 shadow-sm min-w-[320px]">
            <Calendar size={18} className="text-blue-600" />
            <div className="flex items-center gap-2 flex-grow justify-center">
              {!startDate && !endDate ? (
                <div 
                  className="cursor-pointer text-gray-400 font-medium hover:text-blue-600 w-full text-center transition-colors"
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    const lastDay = today.toISOString().split('T')[0];
                    setStartDate(firstDay);
                    setEndDate(lastDay);
                  }}
                >
                  <span>เลือกช่วงวันที่</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="outline-none focus:text-blue-600 bg-transparent"
                  />
                  <span className="text-gray-400 font-bold"> - </span>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="outline-none focus:text-blue-600 bg-transparent"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setStartDate(''); setEndDate(''); }}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all"
                    title="ล้างตัวกรองวันที่"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Multiple Select Position Filter */}
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50 min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-medium text-gray-600 whitespace-nowrap">ตำแหน่ง:</span>
                <span className="truncate">
                  {selectedPositions.length === 0 
                    ? 'ทั้งหมด' 
                    : selectedPositions.length === 1 
                      ? selectedPositions[0] 
                      : `${selectedPositions.length} ตำแหน่ง`}
                </span>
              </div>
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div 
                  onClick={clearPositions}
                  className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-100 flex items-center justify-between"
                >
                  <span className={selectedPositions.length === 0 ? 'font-bold text-blue-600' : ''}>ทั้งหมด</span>
                  {selectedPositions.length === 0 && <Check size={14} className="text-blue-600" />}
                </div>
                {positionOptions.map((position) => (
                  <div 
                    key={position}
                    onClick={() => togglePosition(position)}
                    className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                  >
                    <span className={selectedPositions.includes(position) ? 'font-bold text-blue-600' : ''}>{position}</span>
                    {selectedPositions.includes(position) && <Check size={14} className="text-blue-600" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Badges */}
          {selectedPositions.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {selectedPositions.map(pos => (
                <span key={pos} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                  {pos}
                  <X size={12} className="cursor-pointer" onClick={() => togglePosition(pos)} />
                </span>
              ))}
              <button 
                onClick={clearPositions}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Post Count Card - Split Design */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-h-[140px]">
            <h3 className="text-gray-700 font-bold text-lg mb-4">จำนวนประกาศงานทั้งหมด</h3>
            <div className="flex w-full items-center">
              <div className="flex-1">
                <p className="text-[10px] text-green-600 font-medium mb-1">เปิดรับสมัครอยู่</p>
                <div className="text-3xl font-bold text-blue-900">{data?.openPosts || 0}</div>
              </div>
              <div className="w-[1px] h-16 bg-gray-200 mx-2"></div>
              <div className="flex-1">
                <p className="text-[10px] text-red-500 font-medium mb-1">ปิดรับสมัครแล้ว</p>
                <div className="text-3xl font-bold text-blue-900">{data?.closedPosts || 0}</div>
              </div>
            </div>
          </div>

          <StatCard title="จำนวนบริษัททั้งหมด" value={data?.totalCompanies.toString() || "0"} />
          <StatCard title="จำนวนรีวิวทั้งหมด" value={data?.totalReviews.toString() || "0"} />
          <StatCard title="จำนวนนักศึกษาฝึกงานทั้งหมด" value={data?.totalInterns.toString() || "0"} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart - Position Distribution */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative min-h-[420px] flex flex-col">
            <h3 className="text-gray-700 font-bold text-center mb-6">ตำแหน่งงานที่เปิดรับสมัครมากที่สุด</h3>
            <div className="flex-grow flex items-center justify-center">
              {data?.positionDistribution && data.positionDistribution.length > 0 && totalPostsCount > 0 ? (
                <div className="w-full h-full relative">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.positionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {data.positionDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Text for Donut - Refined Centering */}
                  <div className="absolute top-0 left-0 w-full h-[280px] flex flex-col items-center justify-center pointer-events-none translate-y-[2px]">
                    <span className="text-4xl font-bold text-gray-800 leading-none">{totalPostsCount}</span>
                    <span className="text-[11px] text-gray-400 font-medium mt-1">ตำแหน่งงาน</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-100 mb-4" />
                  <p className="italic text-sm">ยังไม่มีข้อมูลตำแหน่งงาน</p>
                </div>
              )}
            </div>
            
            {/* Custom Legend to match user's 2-row layout with matching colors */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 max-w-lg">
                {data?.positionDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span 
                      className="text-[11px] font-bold"
                      style={{ color: COLORS[index % COLORS.length] }}
                    >
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Chart - Posts per Company */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative min-h-[420px] flex flex-col">
            <h3 className="text-gray-700 font-bold text-center mb-6">จำนวนประกาศฝึกงานตามบริษัท</h3>
            <div className="flex-grow flex items-center justify-center">
              {data?.barChartData && data.barChartData.length > 0 && totalPostsCount > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart 
                    data={data.barChartData} 
                    layout="vertical"
                    margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      tick={{ fontSize: 11, fill: '#4B5563', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#F9FAFB' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#3B82F6" 
                      radius={[0, 6, 6, 0]} 
                      barSize={24}
                      label={{ 
                        position: 'right', 
                        fontSize: 12, 
                        fill: '#1D4ED8', 
                        fontWeight: 'bold', 
                        offset: 15
                      }}
                    >
                      {data.barChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <div className="w-20 h-20 rounded-lg border-4 border-dashed border-gray-100 mb-4" />
                  <p className="italic text-sm">ยังไม่มีข้อมูลประกาศงาน</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-h-[140px]">
      <h3 className="text-gray-700 font-bold text-lg mb-4">{title}</h3>
      <div className="text-5xl font-bold text-blue-900">{value}</div>
    </div>
  );
}
