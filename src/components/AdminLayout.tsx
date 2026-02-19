import type { ReactNode } from 'react';
import { useState } from 'react';
import Navbar from './Navbar';
import { Home, FileText, Building2, Users, Briefcase, ChevronRight, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isDashboard = location.pathname === '/admin/dashboard';
  const isInternshipPosts = location.pathname.startsWith('/admin/internship-posts');
  const isCompanies = location.pathname.startsWith('/admin/companies');
  const isUsers = location.pathname.startsWith('/admin/users');
  const isPositions = location.pathname.startsWith('/admin/positions');

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar isAdmin={true} />

      {children}

      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 w-10 h-16 bg-white rounded-r-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-40"
        >
          <ChevronRight className="text-blue-900" size={24} />
        </button>
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl border-r border-gray-100 transform transition-transform duration-300 z-50 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
              DS
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Darin Supanawong</h3>
              <p className="text-xs text-blue-600 font-medium">Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <SidebarItem
            icon={<Home size={20} />}
            label="Dashboard"
            active={isDashboard}
            onClick={() => navigate('/admin/dashboard')}
          />
          <SidebarItem
            icon={<FileText size={20} />}
            label="Internship Post"
            active={isInternshipPosts}
            onClick={() => navigate('/admin/internship-posts')}
          />
          <SidebarItem
            icon={<Building2 size={20} />}
            label="Company"
            active={isCompanies}
            onClick={() => navigate('/admin/companies')}
          />
          <SidebarItem
            icon={<Users size={20} />}
            label="User Management"
            active={isUsers}
            onClick={() => navigate('/admin/users')}
          />
          <SidebarItem
            icon={<Briefcase size={20} />}
            label="Position Management"
            active={isPositions}
            onClick={() => navigate('/admin/positions')}
          />
        </div>
      </div>
    </div>
  );
}

type SidebarItemProps = {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
