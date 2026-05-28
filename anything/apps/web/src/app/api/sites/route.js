import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { testWordPressConnection } from "@/app/api/utils/wordpress";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    // Return empty array instead of error object for GET requests
    return Response.json([]);
  }

  const sites =
    await sql`SELECT * FROM wp_sites WHERE user_id = ${session.user.id} ORDER BY created_at DESC`;
  return Response.json(sites);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, url, username, app_password } = await request.json();

  // Test connection before saving
  const test = await testWordPressConnection(url, username, app_password);
  if (!test.success) {
    return Response.json({ error: test.error }, { status: 400 });
  }

  const [site] = await sql`
    INSERT INTO wp_sites (user_id, name, url, username, app_password)
    VALUES (${session.user.id}, ${name}, ${url}, ${username}, ${app_password})
    RETURNING *
  `;

  return Response.json(site);
}

export async function DELETE(request) {
  const session = await auth();
  if (!session?.user?.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await sql`DELETE FROM wp_sites WHERE id = ${id} AND user_id = ${session.user.id}`;
  return Response.json({ success: true });
}
