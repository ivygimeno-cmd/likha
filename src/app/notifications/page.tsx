import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: notificationsData,
    error,
  } = await supabase
    .from("notifications")
    .select(
      "id, type, title, message, href, read_at, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Hindi ma-load ang notifications: ${error.message}`,
    );
  }

  const notifications =
    (notificationsData ?? []) as NotificationRecord[];

  async function clearAllNotifications() {
    "use server";

    const supabase = await createClient();

    const currentUser = await getCurrentUser();

if (!currentUser) {
  redirect("/login");
}

const { user } = currentUser;

    const { error } = await supabase.rpc(
      "dismiss_all_my_notifications",
    );

    if (error) {
      throw new Error(
        `Hindi ma-clear ang notifications: ${error.message}`,
      );
    }

    redirect("/notifications");
  }

  async function markAllNotificationsRead() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { error } = await supabase.rpc(
      "mark_all_my_notifications_read",
    );

    if (error) {
      throw new Error(
        `Hindi ma-mark as read ang notifications: ${error.message}`,
      );
    }

    redirect("/notifications");
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-semibold hover:text-[#b76449]"
          >
             Dashboard
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
          Activity
        </p>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h1 className="font-serif text-5xl font-semibold">
            Notifications
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#173d32]/50">
              {notifications.length} total
            </p>

            {notifications.some(
              (notification) => !notification.read_at,
            ) && (
              <form action={markAllNotificationsRead}>
                <button
                  type="submit"
                  className="rounded-xl border border-[#173d32]/15 bg-[#fbf8f1] px-4 py-2 text-sm font-semibold text-[#173d32] transition hover:bg-[#173d32]/5"
                >
                  Mark all as read
                </button>
              </form>
            )}

            {notifications.length > 0 && (
              <form action={clearAllNotifications}>
                <button
                  type="submit"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Clear all
                </button>
              </form>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-10 text-center">
            <p className="font-serif text-2xl font-semibold">
              No notifications yet.
            </p>

            <p className="mt-2 text-sm text-[#173d32]/50">
              Updates about your orders, proposals, support,
              and account activity will appear here.
            </p>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.href ?? "/dashboard"}
                className={`block border-b border-[#173d32]/10 px-6 py-5 transition last:border-b-0 hover:bg-[#173d32]/5 ${
                  !notification.read_at
                    ? "bg-[#b76449]/5"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {!notification.read_at ? (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b76449]" />
                  ) : (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#173d32]/15" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <p className="font-semibold">
                        {notification.title}
                      </p>

                      <time className="shrink-0 text-xs text-[#173d32]/40">
                        {new Date(
                          notification.created_at,
                        ).toLocaleString("en-PH", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>

                    <p className="mt-2 leading-7 text-[#173d32]/65">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}