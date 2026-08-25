import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarUpload from "./avatar-upload";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

    const {
    data: isAdmin,
    error: adminAccessError,
  } = await supabase.rpc("is_likha_admin");

  if (adminAccessError) {
    throw new Error(
      `Hindi ma-check ang admin access: ${adminAccessError.message}`,
    );
  }
  

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, business_name, avatar_url")
    .eq("id", user.id)
    .single();

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
const { data: creditBalanceData } = await supabase
  .rpc("get_my_likha_credit_balance")
  .maybeSingle();

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
  const {
  data: requests,
  error: requestsError,
} = await requestQuery.limit(6);

if (requestsError) {
  throw new Error(
    `Hindi ma-load ang project requests: ${requestsError.message}`,
  );
}

  const { data: proposals } = await supabase
  .from("proposals")
  .select("id, status");

const { data: orders } = await supabase
  .from("orders")
  .select("id, status");

const openRequestCount = isSeller
  ? (requests?.length ?? 0)
  : (requests ?? []).filter((request) => request.status === "open").length;

const activeOrderCount = (orders ?? []).filter(
  (order) =>
    order.status === "in_progress" || order.status === "submitted",
).length;

const completedOrderCount = (orders ?? []).filter(
  (order) => order.status === "completed",
).length;


  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <AuthenticatedNavbar />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <section className="flex flex-col justify-between gap-7 border-b border-[#173d32]/15 pb-10 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
              {isSeller ? "Seller workspace" : "Buyer workspace"}
            </p>

            <h1 className="mt-3 font-serif text-5xl font-semibold">
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

<div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
  <AvatarUpload
    userId={user.id}
    currentAvatarUrl={profile?.avatar_url ?? null}
    displayName={dashboardDisplayName}
    editable={false}
    size="dashboard"
  />

  <div>
<p className="font-serif text-5xl leading-none font-semibold">
  {dashboardDisplayName}
</p>

    <p className="mt-1 text-sm text-[#173d32]/55">
      {isSeller
        ? "Seller workspace"
        : "Buyer workspace"}
    </p>

    <div className="mt-3 flex flex-wrap items-center gap-3">
      {isIdentityVerified ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#173d32] px-3 py-1.5 text-xs font-semibold text-white">
          <span aria-hidden="true">✓</span>
          Identity Verified
        </span>
      ) : (
        <>
          <span className="inline-flex rounded-full border border-[#b76449]/40 bg-[#b76449]/10 px-3 py-1.5 text-xs font-semibold text-[#9f503c]">
            Not Verified
          </span>

          <Link
            href="/verification"
            className="text-sm font-semibold text-[#b76449] underline decoration-[#b76449]/30 underline-offset-4"
          >
            Verify Identity 
          </Link>
        </>
      )}
    </div>

<div className="mt-3 flex flex-wrap items-center gap-3">
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

<div className="mt-5 flex flex-wrap items-center gap-4">
  <div className="min-w-36 rounded-xl border border-[#173d32]/15 bg-[#fbf8f1] px-5 py-3">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/45">
      Available Credits
    </p>

    <p className="mt-1 font-serif text-3xl font-semibold">
      {creditBalance.toLocaleString("en-PH")}
    </p>
  </div>

  <Link
    href="/credits"
    className="inline-flex rounded-lg bg-[#173d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245646]"
  >
    Bumili ng Credits
  </Link>

</div>

    </div>
  </div>
</div>


<div className="flex w-fit flex-col gap-3">
  {isAdmin === true && (
    <Link
      href="/admin"
      className="rounded-md bg-[#173d32] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#245646]"
    >
      Open Admin Panel 
    </Link>
  )}

  <Link
    href={isSeller ? "/marketplace" : "/request"}
    className="rounded-md bg-[#b76449] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#9f503c]"
  >
    {isSeller
      ? "Maghanap ng Projects "
      : "Mag-post ng Request "}
  </Link>
</div>


        </section>
        {isIdentityVerified ? (
  <section className="my-8 flex flex-col justify-between gap-5 rounded-2xl border border-[#173d32]/20 bg-[#dfe9df] p-6 sm:flex-row sm:items-center">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#173d32]/60">
        Account security
      </p>

      <h2 className="mt-2 font-serif text-3xl font-semibold">
        ✓ Identity Verified
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#173d32]/65">
        Na-confirm na ang iyong government ID at selfie/liveness.
        Makikita ng buyers at sellers ang verified badge sa iyong profile.
      </p>
    </div>

    <Link
      href={`/profile/${user.id}`}
      className="w-fit rounded-lg border border-[#173d32]/25 px-5 py-3 text-sm font-semibold transition hover:bg-[#173d32] hover:text-white"
    >
      Tingnan ang Profile 
    </Link>
  </section>
) : (
  <section className="my-8 flex flex-col justify-between gap-5 rounded-2xl border border-[#b76449]/30 bg-[#b76449]/10 p-6 sm:flex-row sm:items-center">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
        Optional identity verification
      </p>

      <h2 className="mt-2 font-serif text-3xl font-semibold">
        Palakasin ang tiwala sa iyong LIKHA profile.
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#173d32]/65">
        I-confirm ang iyong government ID at selfie/liveness para
        magkaroon ng Identity Verified badge. Pribado ang iyong ID
        details at hindi ito ipapakita sa public profile.
      </p>
    </div>

    <Link
      href="/verification"
      className="w-fit shrink-0 rounded-lg bg-[#b76449] px-6 py-3 font-semibold text-white transition hover:bg-[#9f503c]"
    >
      Verify Identity 
    </Link>
  </section>
)}

    <section className="grid gap-px overflow-hidden border border-[#173d32]/15 bg-[#173d32]/15 md:grid-cols-3">
  <div className="bg-[#fbf8f1] p-7">
    <p className="text-sm text-[#173d32]/55">
      {isSeller ? "Available projects" : "Active orders"}
    </p>

    <p className="mt-3 font-serif text-4xl font-semibold">
      {isSeller ? openRequestCount : activeOrderCount}
    </p>
  </div>

  <div className="bg-[#fbf8f1] p-7">
    <p className="text-sm text-[#173d32]/55">
      {isSeller ? "Submitted proposals" : "Received proposals"}
    </p>

    <p className="mt-3 font-serif text-4xl font-semibold">
      {proposals?.length ?? 0}
    </p>
  </div>

  <div className="bg-[#fbf8f1] p-7">
    <p className="text-sm text-[#173d32]/55">
      Completed orders
    </p>

    <p className="mt-3 font-serif text-4xl font-semibold">
      {completedOrderCount}
    </p>
  </div>
</section>

        <section className="mt-14">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
                {isSeller ? "Open requests" : "Your requests"}
              </p>

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
                  ? "Bumalik ulit kapag may bagong buyer request."
                  : "I-post ang iyong unang idea para makatanggap ng seller proposals."}
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