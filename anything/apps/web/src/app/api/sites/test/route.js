import { testWordPressConnection } from "@/app/api/utils/wordpress";

export async function POST(request) {
  try {
    const { url, username, app_password } = await request.json();

    if (!url || !username || !app_password) {
      return Response.json({ success: false, error: "يرجى ملء جميع الحقول." });
    }

    const result = await testWordPressConnection(url, username, app_password);
    return Response.json(result);
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
