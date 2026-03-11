import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AiWaiterHub } from "@/components/admin/ai-waiter-hub";

export const dynamic = "force-dynamic";

export default async function AiWaiterHubPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyAdminToken(token) : false;
  if (!valid) redirect("/admin/login");

  return <AiWaiterHub />;
}
