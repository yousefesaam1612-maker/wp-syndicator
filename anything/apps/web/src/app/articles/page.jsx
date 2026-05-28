import { useState } from "react";
import AppLayout from "@/components/layout";
import {
  Plus,
  Send,
  Clock,
  Trash2,
  Edit3,
  Globe,
  FileText,
  Tag,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const [publishingId, setPublishingId] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedSites, setSelectedSites] = useState([]);

  const { data: articlesRaw = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const articles = Array.isArray(articlesRaw) ? articlesRaw : [];

  const { data: sitesRaw = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await fetch("/api/sites");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const sites = Array.isArray(sitesRaw) ? sitesRaw : [];

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      fetch("/api/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => queryClient.invalidateQueries(["articles"]),
  });

  const publishMutation = useMutation({
    mutationFn: (data) =>
      fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(["articles"]);
      setShowPublishModal(false);
      setSelectedSites([]);
      setPublishingId(null);
    },
  });

  const handlePublish = () => {
    if (selectedSites.length === 0) return;
    setPublishingId(selectedArticle.id);
    publishMutation.mutate({
      article_id: selectedArticle.id,
      site_ids: selectedSites,
    });
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المقالات</h2>
          <p className="text-gray-500">
            أنشئ، عدل، وانشر مقالاتك عبر جميع المواقع.
          </p>
        </div>
        <a
          href="/editor"
          className="bg-[#357AFF] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[#2E69DE] transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          <span>كتابة مقال جديد</span>
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4">عنوان المقال</th>
              <th className="p-4">التصنيف</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">المواقع</th>
              <th className="p-4">التاريخ</th>
              <th className="p-4 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-gray-50 transition-all">
                <td className="p-4 font-bold text-gray-800 max-w-[200px] truncate">
                  {article.title}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                    <Tag size={11} />
                    {article.category || "عام"}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${article.status === "published" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}
                  >
                    {article.status === "published" ? "منشور" : "مسودة"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Globe size={13} className="text-gray-400" />
                    {article.published_count || 0}/{sites.length}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(article.created_at).toLocaleDateString("ar-EG")}
                </td>
                <td className="p-4 text-left">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setSelectedArticle(article);
                        setShowPublishModal(true);
                      }}
                      className="p-2 text-[#357AFF] hover:bg-blue-50 rounded-lg transition-all"
                      title="نشر على المواقع"
                    >
                      <Send size={17} />
                    </button>
                    <a
                      href={`/editor?id=${article.id}`}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-50 rounded-lg transition-all"
                    >
                      <Edit3 size={17} />
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate(article.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan="6" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <FileText size={48} className="text-gray-200" />
                    <p>لا توجد مقالات بعد. ابدأ بكتابة مقالك الأول!</p>
                    <a
                      href="/editor"
                      className="text-[#357AFF] font-bold text-sm hover:underline"
                    >
                      + كتابة مقال جديد
                    </a>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-1">نشر المقال الجماعي</h2>
            <p className="text-gray-500 mb-6 text-sm">
              اختر المواقع التي ترغب في نشر المقال عليها.
            </p>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-8 pr-1">
              <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#357AFF]"
                  checked={
                    selectedSites.length === sites.length && sites.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedSites(sites.map((s) => s.id));
                    else setSelectedSites([]);
                  }}
                />
                <span className="font-bold">
                  اختيار كل المواقع ({sites.length})
                </span>
              </label>
              {sites.map((site) => (
                <label
                  key={site.id}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#357AFF]"
                    checked={selectedSites.includes(site.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedSites([...selectedSites, site.id]);
                      else
                        setSelectedSites(
                          selectedSites.filter((id) => id !== site.id),
                        );
                    }}
                  />
                  <span className="text-gray-700 font-medium">{site.name}</span>
                  <span className="text-xs text-gray-400 truncate flex-1 text-left">
                    {site.url}
                  </span>
                </label>
              ))}
              {sites.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">
                  لا توجد مواقع مربوطة.{" "}
                  <a href="/sites" className="text-[#357AFF] underline">
                    أضف موقعاً
                  </a>
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handlePublish}
                disabled={
                  publishMutation.isPending || selectedSites.length === 0
                }
                className="flex-1 bg-[#357AFF] text-white py-4 rounded-2xl font-bold hover:bg-[#2E69DE] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
              >
                {publishMutation.isPending ? (
                  <>
                    <Clock size={20} />
                    جاري النشر...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    نشر على {selectedSites.length} موقع
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPublishModal(false)}
                className="bg-gray-100 text-gray-600 px-8 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
