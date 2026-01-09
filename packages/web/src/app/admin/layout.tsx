import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Layers, LayoutDashboard, Key, BarChart3, Code2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";

// Force dynamic rendering to avoid build-time database access
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Admin Header */}
      <header className="border-b border-[rgb(var(--border))] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--secondary))] to-[rgb(var(--primary))] rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">SVGO JSX</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Button variant="ghost" asChild>
                <Link href="/admin" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/keys" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Keys
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/stats" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistics
                </Link>
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">
              {session.user.email}
            </span>
            <SignOutButton />
            <Button variant="outline" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Editor
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}
