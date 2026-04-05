import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import InternshipPosts from './pages/InternshipPosts';
import InternshipPostDetail from './pages/InternshipPostDetail';
import DetailCompany from './pages/DetailCompany';
import CompanyReview from './pages/CompanyReview';
import CareerFitQuiz from './pages/CareerFitQuiz';
import QuizPage from './pages/QuizPage';
import ResultQuiz from './pages/ResultQuiz';
import Setting from './pages/Setting';
import AdminDashboard from './pages/AdminDashboard';
import AdminInternshipPostList from './pages/AdminInternshipPostList';
import AdminInternshipPostForm from './pages/AdminInternshipPostForm';
import AdminInternshipPostDetail from './pages/AdminInternshipPostDetail';
import AdminCompanyList from './pages/AdminCompanyList';
import AdminCompanyForm from './pages/AdminCompanyForm';
import AdminCompanyDetail from './pages/AdminCompanyDetail';
import AdminUserList from './pages/AdminUserList';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminPositionList from './pages/AdminPositionList';
import AdminPositionForm from './pages/AdminPositionForm';
import AdminPositionDetail from './pages/AdminPositionDetail';
import './App.css';

function InternshipPostDetailWrapper() {
  const { id } = useParams();
  return <InternshipPostDetail key={id} />;
}

// Protected Route Component for Admin Access
const AdminRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const roleStr = localStorage.getItem("role") || user?.role || "";
  const normalizedUserRole = String(roleStr).trim().toLowerCase();

  if (!user) return <Navigate to="/" replace />;
  
  const isAuthorized = allowedRoles.some(role => 
    normalizedUserRole.includes(role.toLowerCase()) || 
    role.toLowerCase().includes(normalizedUserRole)
  );

  if (!isAuthorized && normalizedUserRole !== "admin") {
    return <Navigate to="/posts" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">

        <Routes>

          <Route path="/" element={<Login />} />

          {/* Internship Posts */}
          <Route path="/posts" element={<InternshipPosts />} />
          <Route path="/posts/:id" element={<InternshipPostDetailWrapper />} />

          <Route path="/company/:id" element={<DetailCompany />} />
          <Route path="/company/:id/review" element={<CompanyReview />} />

          {/* Quiz */}
          <Route path="/quiz" element={<CareerFitQuiz />} />
          <Route path="/quiz/start" element={<QuizPage />} />
          <Route path="/quiz/result" element={<ResultQuiz />} />

          {/* User */}
          <Route path="/setting" element={<Setting />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path="/admin/internship-posts" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminInternshipPostList />
            </AdminRoute>
          } />
          <Route path="/admin/internship-posts/new" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminInternshipPostForm />
            </AdminRoute>
          } />
          <Route path="/admin/internship-posts/:id" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminInternshipPostDetail />
            </AdminRoute>
          } />

          <Route path="/admin/companies" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminCompanyList />
            </AdminRoute>
          } />
          <Route path="/admin/companies/new" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminCompanyForm />
            </AdminRoute>
          } />
          <Route path="/admin/companies/:id" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminCompanyDetail />
            </AdminRoute>
          } />

          <Route path="/admin/users" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminUserList />
            </AdminRoute>
          } />
          <Route path="/admin/users/:id" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminUserDetail />
            </AdminRoute>
          } />

          <Route path="/admin/positions" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminPositionList />
            </AdminRoute>
          } />
          <Route path="/admin/positions/new" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminPositionForm />
            </AdminRoute>
          } />
          <Route path="/admin/positions/:id" element={
            <AdminRoute allowedRoles={["Admin"]}>
              <AdminPositionDetail />
            </AdminRoute>
          } />

        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;