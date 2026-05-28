import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout";
import {
  Save,
  Sparkles,
  Youtube,
  Image as ImageIcon,
  Type,
  AlignLeft,
  Loader2,
  CheckCircle,
  Tag,
  Send,
  Eye,
  Edit2,
  Link2,
  Upload,
  X,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useUpload from "@/utils/useUpload";

const CATEGORIES = [
  "عام",
  "أخبار",
  "تقنية",
  "رياضة",
  "اقتصاد",
  "صحة",
  "سياسة",
  "ثقافة",
  "ترفيه",
  "تعليم",
  "سفر",
  "طعام",
  "أخرى",
];

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [category, setCategory] = useState("عام");
  const [customCategory, setCustomCategory] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [articleId, setArticleId] = useState(null);

  const textareaRef = useRef(null);
  const inlineImgRef = useRef(null);
  const queryClient = useQueryClient();
  const [upload] = useUpload();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setArticleId(id);
      fetch("/api/articles")
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          const art = list.find((a) => a.id == id);
          if (art) {
            setTitle(art.title);
            setContent(art.content);
            setFeaturedImage(art.featured_image || "");
            setCategory(art.category || "عام");
          }
        });
    }
  }, []);

  const insertAtCursor = (html) => {
    const ta = textareaRef.current;
    if (!ta) {
      setContent((p) => p + "\n" + html);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + "\n" + html + "\n" + after;
    setContent(newContent);
    setTimeout(() => {
      const pos = start + html.length + 2;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleInlineFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingInline(true);
    setShowImageModal(false);
    try {
      const { url, error } = await upload({ file });
      if (error) throw new Error(error);
      const alt = imageAltInput || file.name.replace(/\.[^.]+$/, "");
      insertAtCursor(
        `<img src="${url}" alt="${alt}" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;" />`,
      );
      setImageAltInput("");
    } catch (err) {
      console.error("رفع الصورة فشل:", err);
    } finally {
      setIsUploadingInline(false);
      if (inlineImgRef.current) inlineImgRef.current.value = "";
    }
  };

  const handleInsertImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const alt = imageAltInput || "صورة";
    insertAtCursor(
      `<img src="${imageUrlInput.trim()}" alt="${alt}" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;" />`,
    );
    setImageUrlInput("");
    setImageAltInput("");
    setShowImageModal(false);
  };

  const saveMutation = useMutation({
    mutationFn: ({ status }) => {
      const finalCategory =
        category === "أخرى" && customCategory ? customCategory : category;
      const method = articleId ? "PUT" : "POST";
      const body = articleId
        ? {
            id: articleId,
            title,
            content,
            featured_image: featuredImage,
            category: finalCategory,
            status,
          }
        : {
            title,
            content,
            featured_image: featuredImage,
            category: finalCategory,
            status,
          };

      return fetch("/api/articles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل الحفظ");
        return data;
      });
    },
    onSuccess: (data, variables) => {
      setSaveStatus(variables.status);
      if (!articleId && data.id) setArticleId(data.id);
      setTimeout(() => setSaveStatus(null), 3000);
      queryClient.invalidateQueries(["articles"]);
    },
  });

  const handleAiAction = async (type, promptText) => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, prompt: promptText || content || title }),
      });
      const data = await res.json();
      if (data.content) {
        if (type === "title") {
          alert(`العناوين المقترحة:\n${data.content}`);
        } else {
          setContent((prev) => prev + "\n\n" + data.content);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleYoutubeToArticle = async () => {
    setIsAiLoading(true);
    setShowYoutubeModal(false);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "youtube",
          prompt: `رابط الفيديو: ${youtubeUrl}. اكتب مقالاً مفصلاً.`,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setContent(data.content);
        setTitle("مقال من يوتيوب");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { url } = await upload({ file });
      if (url) setFeaturedImage(url);
    }
  };

  const wordCount = content
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const isDisabled = saveMutation.isPending || !title.trim() || !content.trim();

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <input
              className="w-full text-4xl font-bold text-gray-800 placeholder-gray-200 outline-none mb-8"
              placeholder="عنوان المقال هنا..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
              <button
                onClick={() =>
                  handleAiAction(
                    "generate",
                    `اكتب مقالاً طويلاً ومفصلاً عن: ${title}`,
                  )
                }
                className="flex items-center gap-2 bg-blue-50 text-[#357AFF] px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all whitespace-nowrap"
              >
                <Sparkles size={14} />
                كتابة AI
              </button>
              <button
                onClick={() => handleAiAction("rewrite")}
                className="flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-purple-100 transition-all whitespace-nowrap"
              >
                <AlignLeft size={14} />
                إعادة صياغة
              </button>
              <button
                onClick={() => handleAiAction("title")}
                className="flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all whitespace-nowrap"
              >
                <Type size={14} />
                توليد عناوين
              </button>
              <button
                onClick={() => setShowYoutubeModal(true)}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all whitespace-nowrap"
              >
                <Youtube size={14} />
                من يوتيوب
              </button>

              <div className="w-px bg-gray-200 mx-1" />

              <button
                onClick={() => setShowImageModal(true)}
                className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-100 transition-all whitespace-nowrap"
              >
                <ImageIcon size={14} />
                إضافة صورة
              </button>

              <div className="w-px bg-gray-200 mx-1" />

              <button
                onClick={() => setPreviewMode((p) => !p)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  previewMode
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {previewMode ? <Edit2 size={14} /> : <Eye size={14} />}
                {previewMode ? "تحرير" : "معاينة"}
              </button>
            </div>

            {previewMode ? (
              <div
                className="min-h-[600px] prose prose-lg max-w-none text-gray-700 leading-relaxed p-2"
                style={{ direction: "rtl" }}
                dangerouslySetInnerHTML={{
                  __html:
                    content ||
                    "<p class='text-gray-300'>لا يوجد محتوى بعد...</p>",
                }}
              />
            ) : (
              <>
                {isUploadingInline && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-xl mb-3">
                    <Loader2
                      size={15}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    جاري رفع الصورة وإدراجها...
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  className="w-full h-[600px] text-lg text-gray-700 placeholder-gray-300 outline-none resize-none leading-relaxed font-mono text-sm"
                  placeholder="ابدأ كتابة محتواك هنا... (يدعم HTML)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-8 space-y-5">
            {saveStatus && (
              <div
                className={`flex items-center gap-2 text-sm font-medium p-3 rounded-xl ${saveStatus === "published" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"}`}
              >
                <CheckCircle size={16} />
                {saveStatus === "published"
                  ? "✅ تم النشر بنجاح!"
                  : "💾 تم الحفظ كمسودة"}
              </div>
            )}

            <button
              onClick={() => saveMutation.mutate({ status: "draft" })}
              disabled={isDisabled}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Save size={18} />
              {saveMutation.isPending &&
              saveMutation.variables?.status === "draft"
                ? "جاري الحفظ..."
                : "حفظ كمسودة"}
            </button>

            <button
              onClick={() => saveMutation.mutate({ status: "published" })}
              disabled={isDisabled}
              className="w-full bg-[#357AFF] text-white py-4 rounded-2xl font-bold hover:bg-[#2E69DE] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Send size={18} />
              {saveMutation.isPending &&
              saveMutation.variables?.status === "published"
                ? "جاري النشر..."
                : "حفظ ونشر"}
            </button>

            <div className="border-t border-gray-50 pt-5 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Tag size={15} className="text-gray-400" />
                  التصنيف
                </label>
                <select
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#357AFF] outline-none bg-white text-gray-700"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {category === "أخرى" && (
                  <input
                    className="w-full mt-2 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#357AFF] outline-none text-sm"
                    placeholder="اكتب التصنيف..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <ImageIcon size={15} className="text-gray-400" />
                  الصورة البارزة
                </label>
                <div className="w-full aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 overflow-hidden relative group cursor-pointer">
                  {featuredImage ? (
                    <>
                      <img
                        src={featuredImage}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <span className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold text-sm">
                          تغيير
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={28} className="mb-2 opacity-30" />
                      <span className="text-xs">اضغط للرفع</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">عدد الكلمات</span>
                  <span className="font-bold text-gray-800">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">وقت القراءة</span>
                  <span className="font-bold text-gray-800">
                    {Math.max(1, Math.ceil(wordCount / 200))} دقيقة
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الحالة</span>
                  <span
                    className={`font-bold ${articleId ? "text-blue-500" : "text-gray-400"}`}
                  >
                    {articleId ? "تم الحفظ" : "جديد"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                إضافة صورة داخل المقال
              </h2>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                وصف الصورة (Alt Text) — اختياري
              </label>
              <input
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#357AFF] outline-none text-sm"
                placeholder="مثال: صورة توضيحية للمقال"
                value={imageAltInput}
                onChange={(e) => setImageAltInput(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Upload size={15} className="text-green-500" />
                رفع صورة من جهازك
              </p>
              <label className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-green-200 bg-green-50 hover:bg-green-100 text-green-600 font-bold py-4 rounded-2xl cursor-pointer transition-all">
                <ImageIcon size={20} />
                اختر صورة للرفع
                <input
                  ref={inlineImgRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleInlineFileUpload}
                />
              </label>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">أو</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Link2 size={15} className="text-blue-500" />
                إدراج برابط URL
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#357AFF] outline-none text-sm"
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInsertImageUrl();
                  }}
                />
                <button
                  onClick={handleInsertImageUrl}
                  disabled={!imageUrlInput.trim()}
                  className="bg-[#357AFF] text-white px-4 rounded-xl font-bold hover:bg-[#2E69DE] transition-all disabled:opacity-40"
                >
                  إدراج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showYoutubeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Youtube size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">
              فيديو إلى مقال
            </h2>
            <p className="text-gray-500 mb-8 text-center text-sm">
              أدخل رابط فيديو يوتيوب وسنقوم بتحويله لمقال احترافي.
            </p>

            <input
              className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none mb-6 text-left"
              dir="ltr"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />

            <div className="flex gap-4">
              <button
                onClick={handleYoutubeToArticle}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                تحويل الآن
              </button>
              <button
                onClick={() => setShowYoutubeModal(false)}
                className="px-8 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {isAiLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-blue-50 flex flex-col items-center gap-4">
            <Loader2
              className="text-[#357AFF]"
              size={48}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p className="font-bold text-gray-800 text-xl">
              الذكاء الاصطناعي يفكر...
            </p>
            <p className="text-sm text-gray-400">
              جاري معالجة المحتوى وتجهيزه لك
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 12px 0;
        }
        .prose p {
          margin-bottom: 1rem;
        }
        .prose h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1.5rem 0 0.75rem;
        }
        .prose h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 1.25rem 0 0.5rem;
        }
      `}</style>
    </AppLayout>
  );
}
