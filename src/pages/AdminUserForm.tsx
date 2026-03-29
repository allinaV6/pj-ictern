import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminUserForm() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin/users', { replace: true });
  }, [navigate]);

  return (
    <AdminLayout>
      <div className="p-10 text-center text-gray-600">
        ระบบนี้ไม่รองรับการเพิ่มผู้ใช้
      </div>
    </AdminLayout>
  );
}
