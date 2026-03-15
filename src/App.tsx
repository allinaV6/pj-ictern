import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
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
import AdminUserForm from './pages/AdminUserForm';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminPositionList from './pages/AdminPositionList';
import AdminPositionForm from './pages/AdminPositionForm';
import AdminPositionDetail from './pages/AdminPositionDetail';
import './App.css';

function InternshipPostDetailWrapper() {
  const { id } = useParams();
  return <InternshipPostDetail key={id} />;
}

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
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/internship-posts" element={<AdminInternshipPostList />} />
          <Route path="/admin/internship-posts/new" element={<AdminInternshipPostForm />} />
          <Route path="/admin/internship-posts/:id" element={<AdminInternshipPostDetail />} />

          <Route path="/admin/companies" element={<AdminCompanyList />} />
          <Route path="/admin/companies/new" element={<AdminCompanyForm />} />
          <Route path="/admin/companies/:id" element={<AdminCompanyDetail />} />

          <Route path="/admin/users" element={<AdminUserList />} />
          <Route path="/admin/users/new" element={<AdminUserForm />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />

          <Route path="/admin/positions" element={<AdminPositionList />} />
          <Route path="/admin/positions/new" element={<AdminPositionForm />} />
          <Route path="/admin/positions/:id" element={<AdminPositionDetail />} />

        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;