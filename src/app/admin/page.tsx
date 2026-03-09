import { getAllMenuItemsForAdmin, getCategories } from "@/lib/menu";
import { getAllBlogPostsForAdmin } from "@/lib/blog";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyAdminToken(token) : false;
  if (!valid) redirect("/admin/login");

  const [items, categories, posts] = await Promise.all([
    getAllMenuItemsForAdmin(),
    getCategories(),
    getAllBlogPostsForAdmin(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Makan Moments Admin</h1>
        <SignOutButton />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <AdminTabs items={items} categories={categories} posts={posts} />
      </main>
    </div>
  );
}

function SignOutButton() {
  return (
    <form action="/api/admin/logout" method="POST">
      <button
        type="submit"
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
      >
        Sign Out
      </button>
    </form>
  );
}
