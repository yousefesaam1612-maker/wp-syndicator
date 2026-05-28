import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { publishToWordPress } from "@/app/api/utils/wordpress";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { article_id, site_ids } = await request.json();

  const [article] =
    await sql`SELECT * FROM articles WHERE id = ${article_id} AND user_id = ${session.user.id}`;
  if (!article)
    return Response.json({ error: "Article not found" }, { status: 404 });

  const sites =
    await sql`SELECT * FROM wp_sites WHERE id = ANY(${site_ids}) AND user_id = ${session.user.id}`;

  const results = [];

  for (const site of sites) {
    // Initial publication record
    const [pub] = await sql`
      INSERT INTO publications (article_id, site_id, status)
      VALUES (${article_id}, ${site.id}, 'pending')
      RETURNING id
    `;

    const result = await publishToWordPress(site, article);

    if (result.success) {
      await sql`
        UPDATE publications 
        SET status = 'success', wp_post_id = ${result.wp_post_id}, published_at = CURRENT_TIMESTAMP
        WHERE id = ${pub.id}
      `;
      results.push({ site: site.name, status: "success", url: result.url });
    } else {
      await sql`
        UPDATE publications 
        SET status = 'error', error_message = ${result.error}
        WHERE id = ${pub.id}
      `;
      results.push({ site: site.name, status: "error", error: result.error });
    }
  }

  // Update article status if at least one was successful
  if (results.some((r) => r.status === "success")) {
    await sql`UPDATE articles SET status = 'published' WHERE id = ${article_id}`;
  }

  return Response.json(results);
}
