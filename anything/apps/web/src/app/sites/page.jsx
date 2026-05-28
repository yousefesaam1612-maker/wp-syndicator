import { useState } from "react";
import AppLayout from "@/components/layout";
import {
  Plus,
  Trash2,
  Globe,
  ExternalLink,
  ShieldCheck,
  LogIn,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/useUser";

export default function SitesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSite, setNewSite] = useState({
    name: "",
    url: "",
    username: "",
    app_password: "",
  });
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const queryClient = useQueryClient();
  const { data: user, loading: userLoading } = useUser();

  const { data: sitesRaw = [], isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await fetch("/api/sites");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  const sites = Array.isArray(sitesRaw) ? sitesRaw : [];

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/sites/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newSite.url,
          username: newSite.username,
          app_password: newSite.app_password,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTestLoading(false);
    }
  };

  const addSiteMutation = useMutation({
    mutationFn: (site) =>
      fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(site),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل إضافة الموقع");
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["sites"]);
      setShowAddModal(false);
      setNewSite({ name: "", url: "", username: "", app_password: "" });
      setError(null);
      setTestResult(null);
    },
    onError: (err) => setError(err.message),
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (id) =>
      fetch("/api/sites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => queryClient.invalidateQueries(["sites"]),
  });

  // Show login prompt if not authenticated
  if (!userLoading && !user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <LogIn size={36} className="text-[#357AFF]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            تسجيل الدخول مطلوب
          </h2>
          <p className="text-gray-500 mb-8">
            يجب تسجيل الدخول أولاً للوصول إلى مواقعك.
          </p>
          <a
            href="/account/signin"
            className="bg-[#357AFF] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#2E69DE] transition-all shadow-lg shadow-blue-100"
          >
            تسجيل الدخول
          </a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">مواقع WordPress</h2>
          <p className="text-gray-500">قم بإدارة وربط مواقعك للنشر التلقائي.</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setError(null);
            setTestResult(null);
          }}
          className="bg-[#357AFF] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[#2E69DE] transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          <span>ربط موقع جديد</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
          <ShieldCheck size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <div
            key={site.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group relative"
          >
            <button
              onClick={() => deleteSiteMutation.mutate(site.id)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={18} />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#357AFF]">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{site.name}</h3>
                <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
                  متصل
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6 truncate">{site.url}</p>

            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-4">
              <div className="text-xs text-gray-400">
                أضيف في {new Date(site.created_at).toLocaleDateString("ar-EG")}
              </div>
              <a
                href={site.url}
                target="_blank"
                className="text-[#357AFF] hover:underline flex items-center gap-1 text-sm font-medium"
              >
                <span>زيارة</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ))}

        {sites.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
            <Globe className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400">لم تقم بربط أي مواقع بعد.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">ربط موقع WordPress جديد</h2>
            <div className="space-y-4 text-right">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الموقع
                </label>
                <input
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#357AFF] outline-none"
                  placeholder="مثال: مدونتي الشخصية"
                  value={newSite.name}
                  onChange={(e) =>
                    setNewSite({ ...newSite, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رابط الموقع (URL)
                </label>
                <input
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#357AFF] outline-none"
                  placeholder="https://mysite.com"
                  value={newSite.url}
                  onChange={(e) =>
                    setNewSite({ ...newSite, url: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المستخدم
                </label>
                <input
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#357AFF] outline-none"
                  placeholder="admin"
                  value={newSite.username}
                  onChange={(e) =>
                    setNewSite({ ...newSite, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Password
                  <span className="text-red-500 text-xs mr-2">
                    (مختلفة عن كلمة مرور الدخول!)
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#357AFF] outline-none font-mono text-sm"
                  placeholder="AbCd EfGh IjKl MnOp QrSt UvWx"
                  value={newSite.app_password}
                  onChange={(e) =>
                    setNewSite({ ...newSite, app_password: e.target.value })
                  }
                />
                <div className="flex items-start gap-2 mt-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <Info size={15} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">
                    <strong>كيفية الحصول عليها:</strong> WordPress Dashboard →
                    Users → Profile → Application Passwords → أضف اسماً واضغط
                    "Add New" — انسخ الكلمة التي تظهر مرة واحدة فقط.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Result Box */}
            {testResult && (
              <div
                className={`mt-4 p-4 rounded-xl text-sm border ${
                  testResult.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? (
                    <>
                      <CheckCircle2 size={18} className="text-green-600" />
                      "الاتصال ناجح ✅ يمكنك ربط الموقع الآن."
                    </>
                  ) : (
                    <>
                      <XCircle size={18} className="text-red-500" />
                      "فشل الاتصال ❌"
                    </>
                  )}
                </div>
                {testResult.success && testResult.user && (
                  <p className="text-xs">
                    المستخدم: <strong>{testResult.user.name}</strong> | الأدوار:{" "}
                    {testResult.user.roles?.join(", ")}
                  </p>
                )}
                {!testResult.success && (
                  <>
                    <p className="font-medium">{testResult.error}</p>
                    {testResult.hint && (
                      <p className="text-xs mt-2 bg-red-100 p-2 rounded">
                        💡 {testResult.hint}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                <XCircle size={16} />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleTestConnection}
                disabled={
                  testLoading ||
                  !newSite.url ||
                  !newSite.username ||
                  !newSite.app_password
                }
                className="w-full border-2 border-[#357AFF] text-[#357AFF] py-3 rounded-xl font-bold hover:bg-blue-50 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {testLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    جاري الاختبار...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    اختبار الاتصال أولاً
                  </>
                )}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => addSiteMutation.mutate(newSite)}
                  disabled={
                    addSiteMutation.isPending || !newSite.name || !newSite.url
                  }
                  className="flex-1 bg-[#357AFF] text-white py-3 rounded-xl font-bold hover:bg-[#2E69DE] transition-all disabled:opacity-50"
                >
                  {addSiteMutation.isPending
                    ? "جاري الحفظ..."
                    : "حفظ وربط الموقع"}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError(null);
                    setTestResult(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
