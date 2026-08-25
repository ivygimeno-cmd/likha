import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, contact_number")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      {/* HEADER */}
      <header className="border-b border-[#173d32]/10 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="font-serif text-3xl tracking-[0.22em]"
          >
            LIKHA
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-medium transition hover:text-[#b76449]"
          >
             Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:py-20">
        {/* PAGE TITLE */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b76449]">
            Account
          </p>

          <h1 className="mt-4 font-serif text-5xl font-normal sm:text-6xl">
           Mga Setting
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#173d32]/55">
           Pamahalaan ang iyong personal na impormasyon, seguridad ng account, notifications, at access.
          </p>
        </div>

        {/* SETTINGS */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* ACCOUNT */}
          <section className="rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
              Account
            </p>

            <h2 className="mt-3 font-serif text-3xl font-normal">
              Personal na impormasyon
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
              Pamahalaan ang iyong contact details o mag-request ng pagbabago sa verified account information.
            </p>

            <div className="mt-8 divide-y divide-[#173d32]/10">
              <Link
                href="/settings/personal-information"
                className="flex items-center justify-between py-5 transition hover:text-[#b76449]"
              >
                <div>
                  <p className="font-medium">
                  Personal na impormasyon
                  </p>

                  <p className="mt-1 text-sm text-[#173d32]/50">
                    Address and contact number
                  </p>
                </div>

                <span></span>
              </Link>

              <Link
                href="/settings/email"
                className="flex items-center justify-between py-5 transition hover:text-[#b76449]"
              >
                <div>
                  <p className="font-medium">
                    Email address
                  </p>

                  <p className="mt-1 text-sm text-[#173d32]/50">
                    {user.email ?? "No email"}
                  </p>
                </div>

                <span></span>
              </Link>

              <Link
                href="/settings/verified-name"
                className="flex items-center justify-between py-5 transition hover:text-[#b76449]"
              >
                <div>
                  <p className="font-medium">
               Verified na pangalan
                  </p>

                  <p className="mt-1 text-sm text-[#173d32]/50">
                    {profile?.full_name ?? "Not provided"}
                  </p>
                </div>

                <span></span>
              </Link>
            </div>
          </section>

          {/* SECURITY */}
          <section className="rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
          SEGURIDAD
            </p>

            <h2 className="mt-3 font-serif text-3xl font-normal">
            Password at seguridad
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
            Panatilihing ligtas ang iyong LIKHA account.
            </p>

            <div className="mt-8 border-t border-[#173d32]/10">
              <Link
                href="/settings/change-password"
                className="flex items-center justify-between py-5 transition hover:text-[#b76449]"
              >
                <div>
                  <p className="font-medium">
                  Palitan ang password
                  </p>

                  <p className="mt-1 text-sm text-[#173d32]/50">
                 I-update ang password ng iyong account
                  </p>
                </div>

                <span></span>
              </Link>
            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className="rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
              Notifications
            </p>

            <h2 className="mt-3 font-serif text-3xl font-normal">
              Email notifications
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
          Piliin kung aling mga non-essential na email mula sa LIKHA ang gusto mong matanggap.
            </p>

            <div className="mt-8 border-t border-[#173d32]/10">
              <Link
                href="/settings/notifications"
                className="flex items-center justify-between py-5 transition hover:text-[#b76449]"
              >
                <div>
                  <p className="font-medium">
                Pamahalaan ang notifications
                  </p>

                  <p className="mt-1 text-sm text-[#173d32]/50">
                 Mga mensahe, order, request, at updates
                  </p>
                </div>

                <span></span>
              </Link>
            </div>
          </section>

          {/* ACCOUNT ACCESS */}
          <section className="rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
              Account access
            </p>

            <h2 className="mt-3 font-serif text-3xl font-normal">
           Iyong session
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
            Kasalukuyan kang naka-sign in sa LIKHA.
            </p>

           <div className="mt-8 divide-y divide-[#173d32]/10 border-t border-[#173d32]/10">
  <Link
    href="/settings/sessions"
    className="flex items-center justify-between py-5 transition hover:text-[#b76449]"
  >
    <div>
      <p className="font-medium">
        Pamahalaan ang sessions
      </p>

      <p className="mt-1 text-sm text-[#173d32]/50">
       Tingnan ang mga device na naka-sign in sa iyong account
      </p>
    </div>

    <span></span>
  </Link>

  <div className="py-5">
    <Link
      href="/logout"
      className="inline-flex text-sm font-medium text-[#b76449] transition hover:opacity-70"
    >
      Mag-sign out sa device na ito 
    </Link>
  </div>
</div>
          </section>
        </div>
      </div>
    </main>
  );
}