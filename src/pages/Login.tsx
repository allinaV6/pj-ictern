import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase"; // ✅ ปรับ path ถ้าไฟล์ firebase.ts อยู่ที่อื่น

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");        // Username -> Email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // ✅ เช็คว่าเชื่อม Firebase สำเร็จ
      console.log("Login success:", cred.user.uid, cred.user.email);

      // (ถ้าจะส่ง token ไป backend ในอนาคต)
      // const token = await cred.user.getIdToken();
      // console.log("idToken:", token);

      navigate("/posts");
    } catch (err: any) {
      const code = err?.code as string | undefined;

      if (code === "auth/invalid-email") setError("รูปแบบอีเมลไม่ถูกต้อง");
      else if (code === "auth/user-not-found") setError("ไม่พบบัญชีผู้ใช้นี้");
      else if (code === "auth/wrong-password") setError("รหัสผ่านไม่ถูกต้อง");
      else if (code === "auth/invalid-credential") setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      else setError(err?.message || "เข้าสู่ระบบไม่สำเร็จ");

      console.error("Firebase login error:", err);
    } finally {
      setLoading(false);
    }
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

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white font-bold py-3 rounded hover:bg-blue-800 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-left flex items-center justify-between">
          <Link to="/forgot" className="text-blue-600 hover:underline text-sm">
            Forgot Password?
          </Link>

          {/* ถ้าคุณมีหน้า Register */}
          <Link to="/register" className="text-blue-600 hover:underline text-sm">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
