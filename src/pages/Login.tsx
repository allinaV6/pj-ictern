import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email || !password) {
      alert("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);

      // 🔥 1. login ด้วย Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      console.log("✅ Firebase login:", firebaseUser.email);

      // 🔥 2. ยิงไป backend เพื่อหา student
      const res = await fetch("http://localhost:5000/api/auth/firebase-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: firebaseUser.email
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert("ไม่มี user ในระบบ (MySQL)");
        return;
      }

      console.log("✅ MySQL user:", data.user);

      // 🔥 3. เก็บ user (มี student_id)
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("เข้าสู่ระบบสำเร็จ ✅");

      // 🔥 4. ไปหน้า posts
      navigate("/posts");

    } catch (error: any) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        alert("ไม่พบบัญชีผู้ใช้");
      } else if (error.code === "auth/wrong-password") {
        alert("รหัสผ่านไม่ถูกต้อง");
      } else {
        alert("เข้าสู่ระบบไม่สำเร็จ");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          เข้าสู่ระบบ
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="อีเมล"
            className="w-full p-3 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="รหัสผ่าน"
            className="w-full p-3 border rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}