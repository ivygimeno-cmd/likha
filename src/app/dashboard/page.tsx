import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import AvatarUpload from "./avatar-upload";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";

export default async function DashboardPage() {
 const supabase = await createClient();

const currentUser = await getCurrentUser();

if (!currentUser) {
  redirect("/login");
}

const { user, profile, isAdmin } = currentUser;

const { data: verificationData } = await supabase
  .rpc("get_public_identity_verification", {
    p_profile_id: user.id,
  })
  .maybeSingle();

  const verification = verificationData as {
    is_verified: boolean;
  } | null;

  const isIdentityVerified =
    verification?.is_verified === true;

  const role = profile?.role ?? "buyer";
  const isSeller = role === "seller";

  const [
    { data: publicProfileData },
    { data: ratingData },
    { data: creditBalanceData },
  ] = await Promise.all([
    supabase
      .rpc("get_public_profile", {
        p_profile_id: user.id,
      })
      .maybeSingle(),

    supabase
      .rpc("get_profile_rating", {
        p_profile_id: user.id,
      })
      .maybeSingle(),

    supabase
      .rpc("get_my_likha_credit_balance")
      .maybeSingle(),
  ]);

  const publicProfile = publicProfileData as {
    display_name: string;
  } | null;

  const rating = ratingData as {
    average_rating: number | string;
    total_reviews: number;
  } | null;

  const dashboardDisplayName =
    publicProfile?.display_name ??
    profile?.full_name ??
    profile?.business_name ??
    "LIKHA user";

  const averageRating = Number(
    rating?.average_rating ?? 0,
  );

  const totalReviews = Number(
    rating?.total_reviews ?? 0,
  );

  const roundedRating = Math.min(
    5,
    Math.max(0, Math.round(averageRating)),
  );

  const creditBalanceResult = creditBalanceData as {
    balance: number | string;
  } | null;

  const creditBalance = Number(
    creditBalanceResult?.balance ?? 0,
  );

  let requestQuery = supabase
    .from("project_requests")
    .select(
      "id, title, product_type, minimum_budget, maximum_budget, deadline, location, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (isSeller) {
    requestQuery = requestQuery
      .eq("status", "open")
      .neq("buyer_id", user.id);
  }

  const [
    {
      data: requests,
      error: requestsError,
    },
    { data: proposals },
    { data: orders },
  ] = await Promise.all([
    requestQuery.limit(6),

    supabase
      .from("proposals")
      .select("id, status"),

    supabase
      .from("orders")
      .select("id, status"),
  ]);

  if (requestsError) {
    throw new Error(
      `Hindi ma-load ang project requests: ${requestsError.message}`,
    );
  }

  const openRequestCount = isSeller
    ? (requests?.length ?? 0)
    : (requests ?? []).filter(
        (request) => request.status === "open",
      ).length;

  const activeOrderCount = (orders ?? []).filter(
    (order) =>
      order.status === "in_progress" ||
      order.status === "submitted",
  ).length;

  const completedOrderCount = (orders ?? []).filter(
    (order) => order.status === "completed",
  ).length;



  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <AuthenticatedNavbar />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">

<section className="border-b border-[#173d32]/15 pb-10">
  {/* Dashboard heading */}
  <div>
    <h1 className="font-serif text-5xl font-semibold">
      Magandang araw
      {profile?.full_name
        ? `, ${profile.full_name.split(" ")[0]}`
        : ""}
      .
    </h1>

    <p className="mt-4 text-[#173d32]/65">
      {isSeller
        ? "Tingnan ang mga bagong request na maaari mong gawan ng proposal."
        : "Pamahalaan ang iyong custom requests at seller proposals."}
    </p>
  </div>

  {/* Main dashboard area */}
  <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_560px] lg:items-start">
    {/* LEFT SIDE */}
    <div className="flex flex-col">
      {/* Profile */}
      <div className="flex items-start gap-6">
        <AvatarUpload
          userId={user.id}
          currentAvatarUrl={profile?.avatar_url ?? null}
          displayName={dashboardDisplayName}
          editable={false}
          size="dashboard"
        />

        <div className="min-w-0 flex-1">
          {/* Name + Verified badge */}
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-serif text-5xl font-semibold">
              {dashboardDisplayName}
            </h2>

            {isIdentityVerified && (
              <span
                title="Government ID and selfie/liveness were successfully confirmed."
                className="inline-flex items-center gap-1.5 rounded-full bg-[#789b82] px-3 py-2 text-xs font-semibold text-white"
              >
                <span aria-hidden="true">✓</span>
                Identity Verified
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div
              className="text-xl tracking-[0.08em] text-[#b76449]"
              aria-label={`${averageRating} out of 5 stars`}
            >
              {"★".repeat(roundedRating)}

              <span className="text-[#173d32]/15">
                {"★".repeat(5 - roundedRating)}
              </span>
            </div>

            <p className="text-sm font-semibold">
              {averageRating.toFixed(1)}

              <span className="ml-1 font-normal text-[#173d32]/50">
                ({totalReviews}{" "}
                {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </p>
          </div>

          {/* Credits */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="min-w-56 rounded-xl border border-[#173d32]/15 bg-[#fbf8f1] px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/45">
              Available credits
              </p>

              <p className="mt-1 font-serif text-3xl font-semibold">
                {creditBalance.toLocaleString("en-PH")}
              </p>
            </div>

            <Link
              href="/credits"
              className="inline-flex rounded-lg bg-[#173d32] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#245646]"
            >
              Bumili ng Credits
            </Link>
          </div>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE */}
   <div className="flex flex-col gap-5 lg:-mt-25">
      {/* Action buttons */}
  <div className="ml-auto flex w-[225px] flex-col gap-4">
       {isAdmin === true && (
    <Link
      href="/admin"
 className="rounded-md border border-[#173d32]/20 bg-[#fbf8f1] px-7 py-4 text-center font-semibold text-[#173d32] transition hover:border-[#173d32]/40 hover:bg-white"
 
 >
   Admin Panel
    </Link>
  )}

  <Link
    href={`/profile/${user.id}`}
className="rounded-md bg-[#173d32] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#245646]"
 >
  Tingnan ang profile
  </Link>

  <Link
    href={isSeller ? "/marketplace" : "/request"}
    className="rounded-md bg-[#b76449] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#9f503c]"
  >
    {isSeller
      ? "Maghanap ng project"
      : "Mag-post ng request"}
  </Link>
</div>

      {/* Dashboard statistics */}
  <div className="mt-6 border border-[#173d32]/20">
        <div className="grid grid-cols-3 divide-x divide-[#173d32]/20">
          <div className="px-6 py-7">
            <p className="text-sm text-[#173d32]/55">
              {isSeller ? "Available na projects" : "Active orders"}
            </p>

            <p className="mt-6 font-serif text-4xl font-semibold">
              {isSeller ? openRequestCount : activeOrderCount}
            </p>
          </div>

          <div className="px-6 py-7">
            <p className="text-sm text-[#173d32]/55">
              {isSeller
                ? "Mga sinend mong offer"
                : "Mga natangap mong proposal"}
            </p>

            <p className="mt-6 font-serif text-4xl font-semibold">
              {proposals?.length ?? 0}
            </p>
          </div>

          <div className="px-6 py-7">
            <p className="text-sm text-[#173d32]/55">
             Mga nakumpletong orders
            </p>

            <p className="mt-6 font-serif text-4xl font-semibold">
              {completedOrderCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


        <section className="mt-14">
          <div className="flex items-end justify-between">
            <div>


              <h2 className="mt-2 font-serif text-4xl font-semibold">
                {isSeller
                  ? "Mga naghahanap ng creator"
                  : "Mga ipinapagawa mo"}
              </h2>
            </div>
          </div>

          {!requests || requests.length === 0 ? (
            <div className="mt-8 border-y border-[#173d32]/15 py-16 text-center">
              <p className="font-serif text-3xl font-semibold">
                {isSeller
                  ? "Wala pang available na request."
                  : "Wala ka pang ipinapagawa."}
              </p>

              <p className="mt-3 text-[#173d32]/60">
                {isSeller
                  ? "Balikan ulit kapag may bagong request."
                  : "Mag-post ng request para makatanggap ng offers mula sa creators."}
              </p>

              <Link
                href={isSeller ? "/marketplace" : "/request"}
                className="mt-7 inline-block font-semibold text-[#b76449]"
              >
                {isSeller ? "Pumunta sa Marketplace " : "Magpagawa ngayon "}
              </Link>
            </div>
          ) : (
            <div className="mt-8 divide-y divide-[#173d32]/15 border-y border-[#173d32]/15">
              {requests.map((request) => (
                <article
                  key={request.id}
                  className="grid gap-6 py-7 transition md:grid-cols-[1.5fr_0.8fr_0.7fr_auto] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#b76449]">
                      {request.product_type}
                    </p>

                    <h3 className="mt-1 font-serif text-2xl font-semibold">
                      {request.title}
                    </h3>

                    <p className="mt-2 text-sm text-[#173d32]/55">
                      {request.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#173d32]/45">
                      Budget
                    </p>

                    <p className="mt-1 font-semibold">
                      ₱{Number(request.minimum_budget).toLocaleString()}–₱
                      {Number(request.maximum_budget).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#173d32]/45">
                      Deadline
                    </p>

                    <p className="mt-1 font-semibold">
                      {new Date(request.deadline).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <Link
                    href={`/requests/${request.id}`}
                    className="font-semibold text-[#b76449]"
                  >
                    Tingnan 
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}