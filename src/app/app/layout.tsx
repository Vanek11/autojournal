import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      }}
    >
      {children}
    </AppShell>
  );
}
