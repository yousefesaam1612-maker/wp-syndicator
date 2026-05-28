import { auth } from "@/auth";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt, type } = await request.json();

  let systemPrompt =
    "أنت مساعد خبير في كتابة المحتوى وتحسين محركات البحث (SEO).";
  if (type === "rewrite") {
    systemPrompt +=
      " قم بإعادة صياغة النص التالي بأسلوب مختلف مع الحفاظ على المعنى وقواعد الـ SEO.";
  } else if (type === "title") {
    systemPrompt +=
      " قم بتوليد 5 عناوين جذابة وصديقة لمحركات البحث بناءً على النص التالي.";
  } else if (type === "youtube") {
    systemPrompt +=
      " قم بتحويل النص المستخرج من الفيديو (YouTube Transcript) إلى مقال احترافي منظم بفقرات وعناوين فرعية H2/H3.";
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CREATE_APP_URL}/integrations/google-gemini-2-5-pro/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      },
    );

    const data = await response.json();
    const content = data.choices[0].message.content;

    return Response.json({ content });
  } catch (error) {
    return Response.json(
      { error: "فشل توليد المحتوى بالذكاء الاصطناعي" },
      { status: 500 },
    );
  }
}
