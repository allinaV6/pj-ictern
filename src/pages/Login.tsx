import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    navigate('/posts');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold">
            Logo
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Sign in</h1>
        <p className="text-gray-500 mb-8">with your Mahidol University Accounts.</p>
        
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-900 text-white font-bold py-3 rounded hover:bg-blue-800 transition duration-200"
          >
            Sign in
          </button>
        </form>
        
        <div className="mt-6 text-left">
          <a href="#" className="text-blue-600 hover:underline text-sm">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}
