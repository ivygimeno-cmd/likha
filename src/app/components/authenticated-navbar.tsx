import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import NotificationDropdown from "./notification-dropdown";
import RealtimeNotificationRefresh from "./realtime-notification-refresh";
import { refresh } from "next/cache";
import GlobalSearch from "./global-search";
import ProfileDropdown from "./profile-dropdown";

export default async function AuthenticatedNavbar() {


  const currentUser = await getCurrentUser();

if (!currentUser) {
  redirect("/login");
}

const {
  user,
  profile,
} = currentUser;

const supabase = await createClient();

const { data: notificationsData } =
  await supabase
    .from("notifications")
    .select(
      "id, type, title, message, href, read_at, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

    
  const notifications = notificationsData ?? [];

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at,
  ).length;

  const iscreator = profile?.role === "creator";

  const displayName =
    profile?.full_name ??
    profile?.business_name ??
    user.email?.split("@")[0] ??
    "Profile";

  async function switchWorkspace() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const nextRole =
      currentProfile?.role === "creator"
        ? "buyer"
        : "creator";

    const { error } = await supabase
      .from("profiles")
      .update({
        role: nextRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      redirect(
        `/dashboard?error=${encodeURIComponent(
          error.message,
        )}`,
      );
    }

    redirect("/dashboard");
  }

  async function signOut() {
    "use server";

    const supabase = await createClient();

    await supabase.auth.signOut();

    redirect("/login");
  }

  async function openNotification(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const notificationId = String(
      formData.get("notificationId") ?? "",
    );

    const href = String(
      formData.get("href") ?? "/dashboard",
    );

    if (!notificationId) {
      redirect("/dashboard");
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(
        `Hindi ma-mark as read ang notification: ${error.message}`,
      );
    }

    redirect(href);
  }

  async function dismissNotification(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const notificationId = String(
      formData.get("notificationId") ?? "",
    );

    if (!notificationId) {
      return;
    }

    const { error } = await supabase.rpc(
      "dismiss_my_notification",
      {
        p_notification_id: notificationId,
      },
    );

    if (error) {
      throw new Error(
        `Hindi ma-dismiss ang notification: ${error.message}`,
      );
    }

    refresh();
  }

  return (
    <header className="border-b border-[#173d32]/15 bg-[#f5f0e6]">
      <RealtimeNotificationRefresh userId={user.id} />

      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4 lg:px-10">
        <Link
          href="/"
          className="shrink-0 font-serif text-3xl font-semibold tracking-[0.2em]"
        >
          LIKHA
        </Link>

        <GlobalSearch />

        <div className="flex items-center gap-2 sm:gap-3">

          {/* Messages */}
          <Link
            href="/messages"
            aria-label="Messages"
            title="Messages"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#173d32]/15 transition hover:border-[#b76449]/40 hover:bg-[#b76449]/10 hover:text-[#b76449]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 7.5 6.15 4.1a2.5 2.5 0 0 0 2.7 0L19.5 7.5"
              />
            </svg>
          </Link>

          {/* Notifications */}
          <NotificationDropdown>
            <summary
              aria-label="Notifications"
              title="Notifications"
              className="relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#173d32]/15 transition hover:border-[#b76449]/40 hover:bg-[#b76449]/10 hover:text-[#b76449]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 8.25a6 6 0 0 0-12 0c0 7.5-3 7.5-3 7.5h18s-3 0-3-7.5Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19.5a2.25 2.25 0 0 0 4 0"
                />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#b76449] px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </summary>

            <div className="absolute right-0 z-50 mt-3 w-[360px] overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] shadow-xl">

              {/* Header */}
              <div className="border-b border-[#173d32]/10 px-5 py-4">
                <p className="font-semibold">
                  Notifications
                </p>

                <p className="mt-1 text-xs text-[#173d32]/45">
                  {unreadCount} unread
                </p>
              </div>

              {/* Notification items */}
              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-[#173d32]/50">
                    No notifications yet.
                  </p>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 border-b border-[#173d32]/10 px-5 py-4 ${
                        notification.read_at
                          ? "bg-transparent"
                          : "bg-[#173d32]/[0.035]"
                      }`}
                    >
                      {!notification.read_at && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#b76449]" />
                      )}

                      {/* Click notification body */}
                      <form
                        action={openNotification}
                        className="min-w-0 flex-1"
                      >
                        <input
                          type="hidden"
                          name="notificationId"
                          value={notification.id}
                        />

                        <input
                          type="hidden"
                          name="href"
                          value={
                            notification.href ??
                            "/dashboard"
                          }
                        />

                        <button
                          type="submit"
                          className="block w-full text-left"
                        >
                          <p className="text-sm font-semibold">
                            {notification.title}
                          </p>

                          <p className="mt-1 text-sm leading-6 text-[#173d32]/60">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-xs text-[#173d32]/40">
                            {new Date(
                              notification.created_at,
                            ).toLocaleString("en-PH", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </button>
                      </form>

                      {/* Dismiss notification */}
                      <form action={dismissNotification}>
                        <input
                          type="hidden"
                          name="notificationId"
                          value={notification.id}
                        />

                        <button
                          type="submit"
                          aria-label="Dismiss notification"
                          title="Dismiss notification"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg text-[#173d32]/35 transition hover:bg-[#173d32]/5 hover:text-[#b76449]"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="p-3">
                <Link
                  href="/notifications"
                  className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-[#b76449] transition hover:bg-[#b76449]/10"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          </NotificationDropdown>

          {/* Profile dropdown */}
          <ProfileDropdown>
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-[#173d32]/15 bg-[#fbf8f1] py-1.5 pr-4 pl-1.5 transition hover:border-[#173d32]/30">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173d32] bg-cover bg-center font-serif text-sm font-semibold text-white"
                style={
                  profile?.avatar_url
                    ? {
                        backgroundImage: `url(${profile.avatar_url})`,
                      }
                    : undefined
                }
              >
                {!profile?.avatar_url &&
                  displayName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden max-w-[145px] text-left sm:block">
                <p className="truncate text-sm font-semibold">
                  {displayName}
                </p>

                <p className="text-[11px] font-semibold text-[#b76449]">
                  {iscreator ? "creator" : "Buyer"}
                </p>
              </div>

              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="hidden h-4 w-4 sm:block"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m6 8 4 4 4-4"
                />
              </svg>
            </summary>

            <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] shadow-xl">

              {/* Profile header */}
              <div className="border-b border-[#173d32]/10 px-5 py-4">
                <p className="truncate font-semibold">
                  {displayName}
                </p>

            <p className="mt-1 truncate text-xs text-[#173d32]/50">
  {user.email}
</p>

{profile?.referral_code && (
  <p className="mt-2 text-xs text-[#173d32]/55">
    <span className="font-semibold">Referral code</span>{" "}
    <span className="font-mono font-semibold text-[#b76449]">
      {profile.referral_code}
    </span>
  </p>
)}

<p className="mt-1 text-xs font-semibold text-[#b76449]">
  {iscreator
    ? "creator workspace"
    : "Buyer workspace"}
</p>
              </div>

              {/* Menu */}
              <div className="flex flex-col p-2">

                <Link
                  href={`/profile/${user.id}`}
                  className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#173d32]/5"
                >
             Tingnan ang profile
                </Link>

                <Link
                  href="/dashboard"
                  className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#173d32]/5"
                >
                  Dashboard
                </Link>

                <Link
                  href="/marketplace"
                  className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#173d32]/5"
                >
                  Marketplace
                </Link>

                <Link
                  href="/orders"
                  className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#173d32]/5"
                >
                  Orders
                </Link>

                <Link
                  href="/messages"
                  className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#173d32]/5 sm:hidden"
                >
                  Messages
                </Link>

                <div className="my-2 border-t border-[#173d32]/10" />

                <form action={switchWorkspace}>
                  <button
                    type="submit"
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#b76449] transition hover:bg-[#b76449]/10"
                  >
                    {iscreator
                      ? "Switch to Buyer"
                      : "Switch to creator"}
                  </button>
                </form>

                <div className="my-2 border-t border-[#173d32]/10" />

                <Link
                  href="/settings"
                  className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#173d32]/5"
                >
                  Settings
                </Link>

                <Link
                  href="/help"
                  className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#173d32]/5"
                >
                  Help & Feedback
                </Link>

                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-red-50 hover:text-red-700"
                  >
                    Sign out
                  </button>
                </form>

              </div>
            </div>
          </ProfileDropdown>

        </div>
      </nav>
    </header>
  );
}