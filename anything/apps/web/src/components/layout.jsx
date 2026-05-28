import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Globe,
  FileText,
  PlusCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import useUser from "@/utils/useUser";

export default function AppLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { data: user, loading } = useUser();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/account/signin";
    }
  }, [user, loading]);

  const menuItems = [
    { name: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
    { name: "المواقع", icon: Globe, path: "/sites" },
    { name: "المقالات", icon: FileText, path: "/articles" },
    { name: "إنشاء مقال", icon: PlusCircle, path: "/editor" },
  ];

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#357AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-[#F8FAFC] font-sans text-right"
      dir="rtl"
    >
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 bg-white border-l border-gray-200 fixed h-full z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 font-bold text-xl text-[#357AFF]">
              <Zap className="fill-current" />
              <span>WP Syndicator</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                typeof window !== "undefined" &&
                window.location.pathname === item.path
                  ? "bg-[#357AFF] text-white shadow-lg shadow-blue-200"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.name}</span>}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-8 w-full px-4">
          <a
            href="/account/logout"
            className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all w-full"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>تسجيل الخروج</span>}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`${isSidebarOpen ? "mr-64" : "mr-20"} flex-1 transition-all duration-300 p-8`}
      >
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              أهلاً بك، {user?.name || "المستخدم"}
            </h1>
            <p className="text-sm text-gray-500">
              إليك آخر تحديثات منصتك اليوم.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 text-[#357AFF] px-4 py-2 rounded-full text-sm font-medium">
              الخطة الاحترافية
            </div>
            <img
              src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=357AFF&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              alt="Avatar"
            />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
