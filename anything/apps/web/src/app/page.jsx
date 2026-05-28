import { useState, useEffect } from "react";
import AppLayout from "@/components/layout";
import {
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const { data: sitesData = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await fetch("/api/sites");
      const data = await res.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: articlesData = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles");
      const data = await res.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
  });

  const sites = Array.isArray(sitesData) ? sitesData : [];
  const articles = Array.isArray(articlesData) ? articlesData : [];

  const stats = [
    {
      name: "إجمالي المواقع",
      value: sites.length,
      icon: Globe,
      color: "bg-blue-500",
    },
    {
      name: "المقالات المنشورة",
      value: articles.filter((a) => a.status === "published").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      name: "مقالات في المسودة",
      value: articles.filter((a) => a.status === "draft").length,
      icon: FileText,
      color: "bg-amber-500",
    },
    {
      name: "نسبة النجاح",
      value: "98%",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div
                className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}
              >
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stat.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latest Articles */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">آخر المقالات</h2>
            <a
              href="/articles"
              className="text-[#357AFF] text-sm font-medium hover:underline"
            >
              عرض الكل
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-4">العنوان</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {articles.slice(0, 5).map((article) => (
                  <tr
                    key={article.id}
                    className="hover:bg-gray-50 transition-all"
                  >
                    <td className="p-4 font-medium text-gray-800">
                      {article.title}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          article.status === "published"
                            ? "bg-green-100 text-green-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {article.status === "published" ? "منشور" : "مسودة"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(article.created_at).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-400">
                      لا توجد مقالات بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sites Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">نشاط المواقع</h2>
          <div className="space-y-6">
            {sites.map((site) => (
              <div key={site.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-[#357AFF]">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{site.name}</p>
                    <p className="text-xs text-gray-500 truncate w-32">
                      {site.url}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    متصل
                  </div>
                </div>
              </div>
            ))}
            {sites.length === 0 && (
              <div className="text-center p-8 text-gray-400">
                لا توجد مواقع مربوطة.
              </div>
            )}
          </div>
          <a
            href="/sites"
            className="mt-8 block w-full text-center py-3 border border-dashed border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
          >
            + إضافة موقع جديد
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
