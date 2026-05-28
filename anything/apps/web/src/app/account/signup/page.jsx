import { useState } from "react";
import useAuth from "@/utils/useAuth";
import { Zap, Mail, Lock, User, Loader2 } from "lucide-react";

function SignUpPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { signUpWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signUpWithCredentials({
        email,
        password,
        name,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      setError("حدث خطأ أثناء إنشاء الحساب. تأكد من البيانات وحاول مجدداً.");
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen bg-gray-50 items-center justify-center p-4 font-sans text-right"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-[2rem] p-10 shadow-2xl shadow-blue-100 border border-blue-50">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#357AFF] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <Zap className="text-white fill-current" size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            WP Syndicator
          </h1>
          <p className="text-gray-500">ابدأ رحلتك في النشر الذكي اليوم</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mr-1">
              الاسم الكامل
            </label>
            <div className="relative">
              <User
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-[#357AFF] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mr-1">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-[#357AFF] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mr-1">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-[#357AFF] outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center font-bold bg-red-50 py-2 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#357AFF] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#2E69DE] transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "إنشاء حساب جديد"}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500">
          لديك حساب بالفعل؟{" "}
          <a
            href="/account/signin"
            className="text-[#357AFF] font-bold hover:underline"
          >
            تسجيل الدخول
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignUpPage;
