import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import InternshipPosts from './pages/InternshipPosts';
import InternshipPostDetail from './pages/InternshipPostDetail';
import DetailCompany from './pages/DetailCompany';
import CompanyReview from './pages/CompanyReview';
import CareerFitQuiz from './pages/CareerFitQuiz';
import QuizPage from './pages/QuizPage';
import ResultQuiz from './pages/ResultQuiz';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Internship Posts Flow */}
          <Route path="/posts" element={<InternshipPosts />} />
          <Route path="/posts/:id" element={<InternshipPostDetail />} />
          <Route path="/company/:id" element={<DetailCompany />} />
          <Route path="/company/:id/review" element={<CompanyReview />} />
          
          {/* Quiz Flow */}
          <Route path="/quiz" element={<CareerFitQuiz />} />
          <Route path="/quiz/start" element={<QuizPage />} />
          <Route path="/quiz/result" element={<ResultQuiz />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
