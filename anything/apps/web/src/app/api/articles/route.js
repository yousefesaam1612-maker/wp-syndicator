import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    // Return empty array instead of error object for GET requests
    return Response.json([]);
  }

  const articles = await sql`
    SELECT a.*, 
    (SELECT count(*) FROM publications p WHERE p.article_id = a.id AND p.status = 'success') as published_count
    FROM articles a 
    WHERE user_id = ${session.user.id} 
    ORDER BY created_at DESC
  `;
  return Response.json(articles);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, featured_image, scheduled_at, category, status } =
    await request.json();

  const [article] = await sql`
    INSERT INTO articles (user_id, title, content, featured_image, scheduled_at, category, status)
    VALUES (
      ${session.user.id}, ${title}, ${content},
      ${featured_image || null}, ${scheduled_at || null},
      ${category || "عام"}, ${status || "draft"}
    )
    RETURNING *
  `;

  return Response.json(article);
}

export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, content, featured_image, status, scheduled_at, category } =
    await request.json();

  const [article] = await sql`
    UPDATE articles
    SET title = ${title},
        content = ${content},
        featured_image = ${featured_image || null},
        status = ${status || "draft"},
        category = ${category || "عام"},
        scheduled_at = ${scheduled_at || null},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND user_id = ${session.user.id}
    RETURNING *
  `;

  return Response.json(article);
}

export async function DELETE(request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await sql`DELETE FROM articles WHERE id = ${id} AND user_id = ${session.user.id}`;
  return Response.json({ success: true });
}
