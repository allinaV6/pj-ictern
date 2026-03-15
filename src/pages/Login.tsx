import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5001/api/login",
        {
          email: username,
          password: password,
        }
      );

      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/posts");
    } catch (error: any) {
      alert("Username หรือ Password ไม่ถูกต้อง ❌");
      console.error(error.response?.data || error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white px-12 py-10 rounded-xl shadow-lg max-w-md w-full text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
            Logo
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Sign in
        </h1>
        <p className="text-gray-500 mb-8 text-base">
          with your Mahidol University Accounts.
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded text-base 
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded text-base 
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 text-white font-bold py-3 rounded 
            text-base hover:bg-blue-800 transition duration-200"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 text-left">
          <a
            href="#"
            className="text-blue-600 hover:underline text-base"
          >
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
