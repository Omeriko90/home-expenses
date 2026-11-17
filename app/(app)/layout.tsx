import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/shell/nav";
import { Topbar } from "@/components/shell/topbar";
import { getDictionary } from "@/lib/i18n/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getDictionary();
  const userName = session.user.name ?? session.user.email ?? "";

  return (
    // Fixed-height viewport: the shell never scrolls — only <main> does.
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar — fixed, always visible, never scrolls with content */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center px-5 text-lg font-semibold text-primary">
          {t.appName}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <Nav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={userName} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          {/* min-h-full + flex: short pages can still fill the viewport via
              flex-1, while tall pages grow so main's bottom padding stays. */}
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
