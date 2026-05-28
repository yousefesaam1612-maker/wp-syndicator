// Normalize URL: ensure https://, no trailing slash
function normalizeUrl(rawUrl) {
  let url = rawUrl.trim().replace(/\/+$/, "");
  // Add https:// if no protocol given
  if (!url.match(/^https?:\/\//i)) {
    url = "https://" + url;
  }
  return url;
}

export async function testWordPressConnection(url, username, appPassword) {
  try {
    const baseUrl = normalizeUrl(url);
    const credentials = `${username}:${appPassword.trim()}`;
    const authHeader = "Basic " + Buffer.from(credentials).toString("base64");

    // Go directly to /wp-json/wp/v2/users/me — no need to pre-check /wp-json/
    // Try the normalized URL, and if it fails try with ?rest_route= (for sites without pretty permalinks)
    const endpoints = [
      `${baseUrl}/wp-json/wp/v2/users/me`,
      `${baseUrl}/?rest_route=/wp/v2/users/me`,
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      let response;
      try {
        response = await fetch(endpoint, {
          headers: {
            Authorization: authHeader,
            "User-Agent": "WP-Syndicator/1.0",
            Accept: "application/json",
          },
          redirect: "follow",
        });
      } catch (fetchErr) {
        lastError = `تعذّر الاتصال: ${fetchErr.message}`;
        continue;
      }

      // Parse response
      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        // Not JSON — likely a redirect to login page or blocked
        lastError = `الموقع لم يُرجع استجابة JSON صحيحة (Status: ${response.status}). تأكد أن REST API مفعّل وأن الـ Permalink ليس "Plain".`;
        continue;
      }

      if (response.ok) {
        return { success: true, user: data };
      }

      if (response.status === 401) {
        return {
          success: false,
          error: `اسم المستخدم أو Application Password غير صحيح — تأكد أن الـ Application Password أُنشئت من لوحة WordPress وليست كلمة مرور الدخول العادية.`,
          hint: `الـ Application Password تبدو هكذا: AbCd EfGh IjKl MnOp QrSt UvWx`,
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: `ليس لديك صلاحية الوصول: ${data?.message || "Forbidden"}`,
          hint: "تأكد أن المستخدم لديه دور Administrator أو Editor.",
        };
      }

      lastError = `خطأ (${response.status}): ${data?.message || "unknown"}`;
    }

    return {
      success: false,
      error: lastError || "فشل الاتصال لسبب غير معروف.",
    };
  } catch (error) {
    return { success: false, error: `خطأ غير متوقع: ${error.message}` };
  }
}

export async function publishToWordPress(site, article) {
  try {
    const baseUrl = normalizeUrl(site.url);
    const credentials = `${site.username}:${site.app_password.trim()}`;
    const authHeader = "Basic " + Buffer.from(credentials).toString("base64");

    const postData = {
      title: article.title,
      content: article.content,
      status: "publish",
    };

    const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "User-Agent": "WP-Syndicator/1.0",
      },
      body: JSON.stringify(postData),
      redirect: "follow",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || `فشل نشر المقال (${response.status})`,
      };
    }

    return { success: true, wp_post_id: data.id, url: data.link };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
