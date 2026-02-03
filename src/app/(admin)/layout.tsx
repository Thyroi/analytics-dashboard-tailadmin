import { auth0 } from "@/lib/auth0";
import { verifyJWT } from "@/lib/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function requireSession() {
  const auth0Session = await auth0.getSession();
  if (auth0Session) return;

  const cookieStore = await cookies();
  const localToken = cookieStore.get("local-auth-token")?.value;
  if (!localToken) redirect("/login");

  const payload = await verifyJWT(localToken);
  if (!payload) redirect("/login");
}

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <>{children}</>;
}
