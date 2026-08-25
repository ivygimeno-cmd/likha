import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    success?: string;
    accepted?: string;
    error?: string;
  }>;
};

type PublicProfile = {
  display_name: string;
};

type RatingSummary = {
  average_rating: number | string;
  total_reviews: number;
};

type IdentityVerification = {
  is_verified: boolean;
};

type ReceivedProposal = {
  id: string;
  proposed_price: number;
  delivery_days: number;
  message: string;
  status: string;
  seller_id: string;
  seller_name: string;
  seller_average_rating: number;
  seller_total_reviews: number;
  seller_avatar_url: string | null;
  seller_is_verified: boolean;
};

export default async function RequestDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: request } = await supabase
    .from("project_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) {
    notFound();
  }

  const isSeller = profile?.role === "seller";
  const isOwner = request.buyer_id === user.id;
  const canSubmitProposal = isSeller && !isOwner;

  let buyerProfile: PublicProfile | null = null;
  let buyerRating: RatingSummary | null = null;
  let buyerAvatarUrl: string | null = null;
  let buyerIsVerified = false;

  if (canSubmitProposal) {
    const [
      { data: buyerProfileData },
      { data: buyerRatingData },
      { data: buyerAvatarData },
      { data: buyerVerificationData },
    ] = await Promise.all([
      supabase
        .rpc("get_public_profile", {
          p_profile_id: request.buyer_id,
        })
        .maybeSingle(),

      supabase
        .rpc("get_profile_rating", {
          p_profile_id: request.buyer_id,
        })
        .maybeSingle(),

      supabase.rpc("get_public_avatar", {
        p_profile_id: request.buyer_id,
      }),

      supabase
        .rpc("get_public_identity_verification", {
          p_profile_id: request.buyer_id,
        })
        .maybeSingle(),
    ]);

    buyerProfile =
      buyerProfileData as PublicProfile | null;

    buyerRating =
      buyerRatingData as RatingSummary | null;

    buyerAvatarUrl =
      buyerAvatarData as string | null;

    const buyerVerification =
      buyerVerificationData as
        | IdentityVerification
        | null;

    buyerIsVerified =
      buyerVerification?.is_verified === true;
  }

  const buyerAverageRating = Number(
    buyerRating?.average_rating ?? 0,
  );

  const buyerTotalReviews = Number(
    buyerRating?.total_reviews ?? 0,
  );

  let existingProposal = null;

  if (isSeller) {
    const { data } = await supabase
      .from("proposals")
      .select(
        "id, proposed_price, delivery_days, message, status",
      )
      .eq("request_id", request.id)
      .eq("seller_id", user.id)
      .maybeSingle();

    existingProposal = data;
  }

  let receivedProposals: ReceivedProposal[] = [];

  if (isOwner) {
    const { data } = await supabase
      .from("proposals")
      .select(
        "id, proposed_price, delivery_days, message, status, seller_id",
      )
      .eq("request_id", request.id)
      .order("created_at", {
        ascending: true,
      });

    const proposalRows = data ?? [];

    receivedProposals = await Promise.all(
      proposalRows.map(async (proposal) => {
        const [
          { data: sellerProfileData },
          { data: sellerRatingData },
          { data: sellerAvatarData },
          { data: sellerVerificationData },
        ] = await Promise.all([
          supabase
            .rpc("get_public_profile", {
              p_profile_id: proposal.seller_id,
            })
            .maybeSingle(),

          supabase
            .rpc("get_profile_rating", {
              p_profile_id: proposal.seller_id,
            })
            .maybeSingle(),

          supabase.rpc("get_public_avatar", {
            p_profile_id: proposal.seller_id,
          }),

          supabase
            .rpc(
              "get_public_identity_verification",
              {
                p_profile_id: proposal.seller_id,
              },
            )
            .maybeSingle(),
        ]);

        const sellerProfile =
          sellerProfileData as PublicProfile | null;

        const sellerRating =
          sellerRatingData as RatingSummary | null;

        const sellerAvatarUrl =
          sellerAvatarData as string | null;

        const sellerVerification =
          sellerVerificationData as
            | IdentityVerification
            | null;

        return {
          ...proposal,

          seller_name:
            sellerProfile?.display_name ??
            "Likha Seller",

          seller_average_rating: Number(
            sellerRating?.average_rating ?? 0,
          ),

          seller_total_reviews: Number(
            sellerRating?.total_reviews ?? 0,
          ),

          seller_avatar_url: sellerAvatarUrl,

          seller_is_verified:
            sellerVerification?.is_verified ===
            true,
        };
      }),
    );
  }

  async function submitProposal(
    formData: FormData,
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const requestId = String(
      formData.get("requestId"),
    );

    const proposedPrice = Number(
      formData.get("proposedPrice"),
    );

    const deliveryDays = Number(
      formData.get("deliveryDays"),
    );

    const message = String(
      formData.get("message"),
    ).trim();

    if (
      proposedPrice <= 0 ||
      deliveryDays <= 0 ||
      !message
    ) {
      redirect(
        `/requests/${requestId}?error=${encodeURIComponent(
          "Kumpletuhin nang tama ang lahat ng fields.",
        )}`,
      );
    }

 const { error } = await supabase.rpc(
  "submit_proposal_with_credits",
  {
    p_request_id: requestId,
    p_proposed_price: proposedPrice,
    p_delivery_days: deliveryDays,
    p_message: message,
  },
);

if (error) {
  redirect(
    `/requests/${requestId}?error=${encodeURIComponent(
      error.message,
    )}`,
  );
}

    redirect(
      `/requests/${requestId}?success=1`,
    );
  }

  async function acceptProposal(
    formData: FormData,
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const proposalId = String(
      formData.get("proposalId"),
    );

    const requestId = String(
      formData.get("requestId"),
    );

    const { error } = await supabase.rpc(
      "accept_proposal",
      {
        p_proposal_id: proposalId,
      },
    );

    if (error) {
      redirect(
        `/requests/${requestId}?error=${encodeURIComponent(
          error.message,
        )}`,
      );
    }

    redirect(
      `/requests/${requestId}?accepted=1`,
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
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

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[1.35fr_0.65fr] lg:px-10">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            {request.product_type}
          </p>

          <h1 className="mt-3 max-w-3xl font-serif text-5xl font-semibold leading-tight">
            {request.title}
          </h1>

          <div className="mt-8 grid gap-px overflow-hidden border border-[#173d32]/15 bg-[#173d32]/15 sm:grid-cols-3">
            <div className="bg-[#fbf8f1] p-5">
              <p className="text-xs uppercase tracking-wider text-[#173d32]/45">
                Budget
              </p>

              <p className="mt-2 font-semibold">
                ₱
                {Number(
                  request.minimum_budget,
                ).toLocaleString()}
                –₱
                {Number(
                  request.maximum_budget,
                ).toLocaleString()}
              </p>
            </div>

            <div className="bg-[#fbf8f1] p-5">
              <p className="text-xs uppercase tracking-wider text-[#173d32]/45">
                Quantity
              </p>

              <p className="mt-2 font-semibold">
                {request.quantity}
              </p>
            </div>

            <div className="bg-[#fbf8f1] p-5">
              <p className="text-xs uppercase tracking-wider text-[#173d32]/45">
                Deadline
              </p>

              <p className="mt-2 font-semibold">
                {new Date(
                  request.deadline,
                ).toLocaleDateString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="mt-10 border-y border-[#173d32]/15 py-9">
            <h2 className="font-serif text-3xl font-semibold">
              Tungkol sa request
            </h2>

            <p className="mt-5 whitespace-pre-line leading-8 text-[#173d32]/75">
              {request.description}
            </p>
          </div>

          {canSubmitProposal && buyerProfile && (
            <div className="mt-6 border border-[#173d32]/15 bg-[#fbf8f1] p-5">
              <div className="flex items-center gap-4">
                <div
                  role="img"
                  aria-label={`${buyerProfile.display_name} profile picture`}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#173d32]/15 bg-[#e9e1d2] bg-cover bg-center font-serif text-2xl font-semibold"
                  style={
                    buyerAvatarUrl
                      ? {
                          backgroundImage: `url(${buyerAvatarUrl})`,
                        }
                      : undefined
                  }
                >
                  {!buyerAvatarUrl &&
                    buyerProfile.display_name
                      .charAt(0)
                      .toUpperCase()}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#b76449]">
                    Buyer
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="font-serif text-2xl font-semibold">
                      {
                        buyerProfile.display_name
                      }
                    </p>

                    {buyerIsVerified ? (
                      <span
                        title="Government ID and selfie/liveness were confirmed."
                        className="inline-flex items-center gap-1 rounded-full bg-[#173d32] px-2.5 py-1 text-[11px] font-semibold text-white"
                      >
                        <span aria-hidden="true">
                          ✓
                        </span>
                        Identity Verified
                      </span>
                    ) : (
                      <span
                        title="This buyer has not completed optional identity verification."
                        className="inline-flex items-center rounded-full border border-[#b76449]/40 bg-[#b76449]/10 px-2.5 py-1 text-[11px] font-semibold text-[#9f503c]"
                      >
                        Not Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm font-semibold text-[#b76449]">
                    ★{" "}
                    {buyerAverageRating.toFixed(
                      1,
                    )}

                    <span className="ml-2 font-normal text-[#173d32]/50">
                      ({buyerTotalReviews}{" "}
                      {buyerTotalReviews === 1
                        ? "review"
                        : "reviews"}
                      )
                    </span>
                  </p>
                </div>
              </div>

              <Link
                href={`/profile/${request.buyer_id}`}
                className="mt-5 inline-flex items-center border border-[#173d32]/20 px-5 py-3 text-sm font-semibold transition hover:border-[#b76449] hover:text-[#b76449]"
              >
                View Buyer Profile 
              </Link>
            </div>
          )}

          <div className="mt-8">
            <p className="text-sm text-[#173d32]/50">
              Delivery location
            </p>

            <p className="mt-1 font-semibold">
              {request.location}
            </p>
          </div>
        </section>

        <aside>
          {messages.accepted && (
            <div className="mb-5 border border-[#173d32]/20 bg-[#dfe9df] p-5 text-sm">
              Tinanggap mo na ang proposal. In
              progress na ang request.
            </div>
          )}

          {messages.success && (
            <div className="mb-5 border border-[#173d32]/20 bg-[#dfe9df] p-5 text-sm">
            Naipadala na ang proposal mo sa buyer. Nabawas ang 15 LIKHA Credits sa iyong balance.
            </div>
          )}

          {messages.error && (
            <div className="mb-5 border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {messages.error}
            </div>
          )}

          {canSubmitProposal &&
          existingProposal ? (
            <div className="border border-[#173d32]/20 bg-[#fbf8f1] p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Your proposal
              </p>

              <h2 className="mt-3 font-serif text-3xl font-semibold">
                Proposal submitted
              </h2>

              <dl className="mt-7 space-y-5">
                <div>
                  <dt className="text-sm text-[#173d32]/50">
                    Proposed price
                  </dt>

                  <dd className="mt-1 text-xl font-semibold">
                    ₱
                    {Number(
                      existingProposal.proposed_price,
                    ).toLocaleString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-[#173d32]/50">
                    Completion time
                  </dt>

                  <dd className="mt-1 font-semibold">
                    {
                      existingProposal.delivery_days
                    }{" "}
                    days
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-[#173d32]/50">
                    Status
                  </dt>

                  <dd className="mt-1 font-semibold capitalize text-[#b76449]">
                    {existingProposal.status}
                  </dd>
                </div>
              </dl>

              <p className="mt-6 border-t border-[#173d32]/15 pt-6 leading-7 text-[#173d32]/70">
                {existingProposal.message}
              </p>
            </div>
          ) : canSubmitProposal ? (
            <form
              action={submitProposal}
              className="border border-[#173d32]/20 bg-[#fbf8f1] p-7"
            >
              <input
                type="hidden"
                name="requestId"
                value={request.id}
              />

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Send a proposal
              </p>

              <h2 className="mt-3 font-serif text-3xl font-semibold">
                Kaya mo bang likhain ito?
              </h2>
  {!buyerIsVerified && (
  <div className="mt-5 border border-[#b76449]/35 bg-[#b76449]/10 p-4">
    <p className="text-sm font-semibold text-[#9f503c]">
      Hindi pa identity verified ang buyer na ito.
    </p>

    <p className="mt-2 text-sm leading-6 text-[#173d32]/65">
      Optional ang verification sa LIKHA. Tingnan ang
      buyer profile, ratings, at reviews bago magsumite
      ng proposal. Panatilihin ang messages at
      transactions sa loob ng LIKHA.
    </p>
  </div>
)}

              <div className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="proposedPrice"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Presyo ng proposal
                  </label>

                  <input
                    id="proposedPrice"
                    name="proposedPrice"
                    type="number"
                    min="1"
                    required
                    placeholder="Halimbawa: 2500"
                    className="w-full border border-[#173d32]/20 bg-white px-4 py-3.5 outline-none focus:border-[#b76449]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deliveryDays"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Ilang araw bago matapos?
                  </label>

                  <input
                    id="deliveryDays"
                    name="deliveryDays"
                    type="number"
                    min="1"
                    required
                    placeholder="Halimbawa: 7"
                    className="w-full border border-[#173d32]/20 bg-white px-4 py-3.5 outline-none focus:border-[#b76449]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Mensahe para sa buyer
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    placeholder="Ipakilala ang iyong paggawa at ipaliwanag kung paano mo gagawin ang request."
                    className="w-full resize-none border border-[#173d32]/20 bg-white px-4 py-3.5 outline-none focus:border-[#b76449]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#b76449] px-6 py-4 font-semibold text-white transition hover:bg-[#9f503c]"
                >
                Ipadala ang Proposal — 15 LIKHA Credits 
                </button>
              </div>
            </form>
          ) : isOwner ? (
            <div className="border border-[#173d32]/20 bg-[#fbf8f1] p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Received proposals
              </p>

              <h2 className="mt-3 font-serif text-3xl font-semibold">
                Mga alok ng sellers
              </h2>

              {receivedProposals.length === 0 ? (
                <p className="mt-5 leading-7 text-[#173d32]/65">
                  Wala pang proposal para sa request
                  na ito.
                </p>
              ) : (
                <div className="mt-7 divide-y divide-[#173d32]/15 border-t border-[#173d32]/15">
                  {receivedProposals.map(
                    (proposal) => (
                      <article
                        key={proposal.id}
                        className="py-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <div
                                role="img"
                                aria-label={`${proposal.seller_name} profile picture`}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#173d32]/15 bg-[#e9e1d2] bg-cover bg-center font-serif text-xl font-semibold"
                                style={
                                  proposal.seller_avatar_url
                                    ? {
                                        backgroundImage: `url(${proposal.seller_avatar_url})`,
                                      }
                                    : undefined
                                }
                              >
                                {!proposal.seller_avatar_url &&
                                  proposal.seller_name
                                    .charAt(0)
                                    .toUpperCase()}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {
                                      proposal.seller_name
                                    }
                                  </p>

                                  {proposal.seller_is_verified ? (
                                    <span
                                      title="Government ID and selfie/liveness were confirmed."
                                      className="inline-flex items-center gap-1 rounded-full bg-[#173d32] px-2.5 py-1 text-[11px] font-semibold text-white"
                                    >
                                      <span aria-hidden="true">
                                        ✓
                                      </span>
                                      Identity
                                      Verified
                                    </span>
                                  ) : (
                                    <span
                                      title="This seller has not completed optional identity verification."
                                      className="inline-flex items-center rounded-full border border-[#b76449]/40 bg-[#b76449]/10 px-2.5 py-1 text-[11px] font-semibold text-[#9f503c]"
                                    >
                                      Not Verified
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-sm font-semibold text-[#b76449]">
                                  ★{" "}
                                  {proposal.seller_average_rating.toFixed(
                                    1,
                                  )}

                                  <span className="ml-2 font-normal text-[#173d32]/50">
                                    (
                                    {
                                      proposal.seller_total_reviews
                                    }{" "}
                                    {proposal.seller_total_reviews ===
                                    1
                                      ? "review"
                                      : "reviews"}
                                    )
                                  </span>
                                </p>
                              </div>
                            </div>

                            <p className="mt-2 font-serif text-3xl font-semibold">
                              ₱
                              {Number(
                                proposal.proposed_price,
                              ).toLocaleString()}
                            </p>
                          </div>

                          <span className="text-sm font-semibold capitalize text-[#b76449]">
                            {proposal.status}
                          </span>
                        </div>

                        <p className="mt-4 text-sm font-semibold">
                          Completion time:{" "}
                          {proposal.delivery_days} days
                        </p>

                        <p className="mt-4 leading-7 text-[#173d32]/70">
                          {proposal.message}
                        </p>

                        <Link
                          href={`/profile/${proposal.seller_id}`}
                          className="mt-5 inline-flex items-center border border-[#173d32]/20 px-4 py-2.5 text-sm font-semibold transition hover:border-[#b76449] hover:text-[#b76449]"
                        >
                          View Seller Profile 
                        </Link>

                        {proposal.status ===
                          "pending" &&
                          request.status ===
                            "open" &&
                          (proposal.seller_is_verified ? (
                            <form
                              action={
                                acceptProposal
                              }
                              className="mt-6"
                            >
                              <input
                                type="hidden"
                                name="proposalId"
                                value={
                                  proposal.id
                                }
                              />

                              <input
                                type="hidden"
                                name="requestId"
                                value={
                                  request.id
                                }
                              />

                              <button
                                type="submit"
                                className="w-full bg-[#b76449] px-6 py-4 font-semibold text-white transition hover:bg-[#9f503c]"
                              >
                                Tanggapin ang
                                Proposal 
                              </button>
                            </form>
                          ) : (
                            <details className="mt-6 border border-[#b76449]/35 bg-[#b76449]/10 p-5">
                              <summary className="cursor-pointer list-none font-semibold text-[#9f503c]">
                                Review verification
                                warning 
                              </summary>

                              <div className="mt-4 border-t border-[#b76449]/25 pt-4">
                                <p className="text-sm font-semibold text-[#9f503c]">
                                  Hindi pa identity
                                  verified ang seller
                                  na ito.
                                </p>

                                <p className="mt-2 text-sm leading-6 text-[#173d32]/65">
                                  Optional ang
                                  verification sa
                                  LIKHA. Bago tanggapin
                                  ang proposal, tingnan
                                  ang profile, projects,
                                  ratings, at reviews
                                  ng seller. Panatilihin
                                  ang messages at
                                  transactions sa loob
                                  ng LIKHA.
                                </p>

                                <form
                                  action={
                                    acceptProposal
                                  }
                                  className="mt-5"
                                >
                                  <input
                                    type="hidden"
                                    name="proposalId"
                                    value={
                                      proposal.id
                                    }
                                  />

                                  <input
                                    type="hidden"
                                    name="requestId"
                                    value={
                                      request.id
                                    }
                                  />

                                  <button
                                    type="submit"
                                    className="w-full bg-[#b76449] px-6 py-4 font-semibold text-white transition hover:bg-[#9f503c]"
                                  >
                                    Nauunawaan ko —
                                    Tanggapin pa rin 
                                  </button>
                                </form>
                              </div>
                            </details>
                          ))}
                      </article>
                    ),
                  )}
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}