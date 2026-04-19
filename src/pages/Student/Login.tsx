import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); 

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (loading) return; 

    if (!email && !password) {
      toast.error("กรุณากรอกอีเมลและรหัสผ่าน", { id: "login" });
      return;
    }
    if (!email) {
      toast.error("กรุณากรอกอีเมล", { id: "login" });
      return;
    }
    if (!password) {
      toast.error("กรุณากรอกรหัสผ่าน", { id: "login" });
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const res = await fetch("http://localhost:5000/api/auth/firebase-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userCredential.user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("ไม่พบข้อมูลในระบบ", { id: "login" });
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.role);

      toast.success("เข้าสู่ระบบสำเร็จ", { id: "login" });
      navigate("/posts");

    } catch (error: any) {
      if (error?.code === "auth/user-not-found") {
        toast.error("ไม่พบบัญชีในระบบ", { id: "login" });
      } else if (error?.code === "auth/wrong-password") {
        toast.error("รหัสผ่านไม่ถูกต้อง", { id: "login" });
      } else {
        toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง", { id: "login" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="bg-white w-full max-w-md p-6 shadow border border-slate-300">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/ictern logo 250x150 nobg.png" 
            alt="logo"
            className="h-24 object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-700">
          Sign in
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border-b-2 border-slate-400 
            bg-transparent outline-none
            text-slate-800 placeholder-slate-400
            focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border-b-2 border-slate-400 
            bg-transparent outline-none
            text-slate-800 placeholder-slate-400
            focus:border-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3
            hover:bg-yellow-400 hover:text-blue-900
            disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* Forgot */}
          <div className="text-left">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-blue-600"
            >
              Forgot password?
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}