import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortfolioProjectForm from "./portfolio-project-form";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";
import AvatarUpload from "@/app/dashboard/avatar-upload";
import FollowButton from "./follow-button";
import FeatureProjectButton from "@/app/components/feature-project-button";
import ProjectDescription from "./project-description";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PublicProfile = {
  id: string;
  display_name: string;
  workspace_role: string;
};

type RatingSummary = {
  average_rating: number | string;
  total_reviews: number;
};

type IdentityVerification = {
  is_verified: boolean;
  verified_at: string | null;
};

type ProfileReview = {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
};

type PortfolioProject = {
  id: number;
  title: string;
  description: string;
  image_path: string | null;
  created_at: string;
};

type Badge = {
  id: string;
  name: string;
  description: string | null;
  rarity: string;
  image_url: string | null;
};

type EarnedBadge = Badge & {
  earned_at: string;
};

type VipProfile = {
  account_tier: "standard" | "vip" | string | null;
  vip_expires_at: string | null;
};

type ProfileBadgeInfo = {
  created_at: string;
  account_tier: "standard" | "vip" | string | null;
};

type AdminBadgeProfile = {
  is_admin_badge: boolean | null;
};

const rarityOrder: Record<string, number> = {
  Mythic: 1,
  Legendary: 2,
  Rare: 3,
  Uncommon: 4,
  Common: 5,
};

export default async function PublicProfilePage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * PUBLIC PROFILE
   */
  const { data: profileData } = await supabase
    .rpc("get_public_profile", {
      p_profile_id: id,
    })
    .maybeSingle();

  const profile = profileData as PublicProfile | null;

  if (!profile) {
    notFound();
  }

  /*
   * LOAD PROFILE DATA
   */
  const [
    { data: avatarData },
    { data: ratingData },
    { data: verificationData },
    { data: reviewData },
    { data: profileBadgesData },
    { data: earnedBadgesData },
    { data: projectData },
    { data: featuredProjectData },
    { count: followerCount },
    { count: followingCount },
    { count: completedProjects },
    { count: purchasedProjects },
    { data: creditBalanceData },
    { data: vipProfileData },
    { data: adminBadgeData },
  ] = await Promise.all([
    /*
     * Avatar
     */
    supabase.rpc("get_public_avatar", {
      p_profile_id: id,
    }),

    /*
     * Rating
     */
    supabase
      .rpc("get_profile_rating", {
        p_profile_id: id,
      })
      .maybeSingle(),

    /*
     * Identity verification
     */
    supabase
      .rpc("get_public_identity_verification", {
        p_profile_id: id,
      })
      .maybeSingle(),

    /*
     * Reviews
     */
    supabase.rpc("get_profile_reviews", {
      p_profile_id: id,
    }),

    /*
     * Existing badge/profile information
     */
    supabase
      .rpc("get_public_profile_badges", {
        p_profile_id: id,
      })
      .maybeSingle(),

    /*
     * Earned badges
     */
    supabase.rpc("get_public_profile_badges", {
      p_profile_id: id,
    }),

    /*
     * Portfolio projects
     */
    supabase
      .from("portfolio_projects")
      .select(
        "id, title, description, image_path, created_at",
      )
      .eq("owner_id", id)
      .order("created_at", {
        ascending: false,
      }),

    /*
     * Featured projects
     */
    supabase
      .from("featured_projects")
      .select("project_id")
      .eq("profile_id", id)
      .eq("is_active", true),

    /*
     * Followers
     */
    supabase
      .from("follows")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("following_id", id),

    /*
     * Following
     */
    supabase
      .from("follows")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("follower_id", id),

    /*
     * Completed creator projects
     */
    supabase
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("creator_id", id)
      .eq("status", "completed"),

    /*
     * Purchased projects
     */
    supabase
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("buyer_id", id)
      .eq("status", "completed"),

    /*
     * Credits — own profile only
     */
    user.id === id
      ? supabase
          .rpc("get_my_likha_credit_balance")
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    /*
     * VIP
     */
    supabase
      .from("profiles")
      .select("account_tier, vip_expires_at")
      .eq("id", id)
      .maybeSingle(),

    /*
     * ADMIN BADGE
     *
     * IMPORTANT:
     * We read is_admin_badge directly from profiles.
     */
    supabase
      .from("profiles")
      .select("is_admin_badge")
      .eq("id", id)
      .maybeSingle(),
  ]);

  const avatarUrl = avatarData as string | null;

  const rating =
    ratingData as RatingSummary | null;

  const identityVerification =
    verificationData as IdentityVerification | null;

  const isIdentityVerified =
    identityVerification?.is_verified === true;

  const reviews =
    (reviewData ?? []) as ProfileReview[];

  const profileBadges =
    profileBadgesData as ProfileBadgeInfo | null;

  const vipProfile =
    vipProfileData as VipProfile | null;

  /*
   * ADMIN BADGE
   *
   * This now comes directly from:
   * profiles.is_admin_badge
   */
  const adminBadge =
    adminBadgeData as AdminBadgeProfile | null;

  const hasAdminBadge =
    adminBadge?.is_admin_badge === true;

  /*
   * EARNED BADGES
   */
  const earnedBadges =
    (earnedBadgesData ?? []) as EarnedBadge[];

  const visibleBadges =
    earnedBadges.slice(0, 6);

  const hasMoreBadges =
    earnedBadges.length > 6;

  /*
   * ACCOUNT AGE
   */
  const profileCreatedAt =
    profileBadges?.created_at
      ? new Date(profileBadges.created_at)
      : null;

  let accountAgeLabel: string | null = null;

  if (profileCreatedAt) {
    const now = new Date();

    let totalMonths =
      (now.getFullYear() -
        profileCreatedAt.getFullYear()) *
        12 +
      (now.getMonth() -
        profileCreatedAt.getMonth());

    if (
      now.getDate() <
      profileCreatedAt.getDate()
    ) {
      totalMonths -= 1;
    }

    totalMonths = Math.max(
      0,
      totalMonths,
    );

    const accountAgeDays = Math.max(
      0,
      Math.floor(
        (now.getTime() -
          profileCreatedAt.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    accountAgeLabel =
      totalMonths < 1
        ? `${accountAgeDays}d old`
        : totalMonths < 12
          ? `${totalMonths}m old`
          : `${Math.floor(
              totalMonths / 12,
            )}y ${
              totalMonths % 12
            }m old`;
  }

  /*
   * VIP
   */
  const isVip =
    vipProfile?.account_tier === "vip" &&
    vipProfile?.vip_expires_at !== null &&
    new Date(
      vipProfile.vip_expires_at,
    ).getTime() > Date.now();

  /*
   * PROJECTS
   */
  const projects = (
    (projectData ?? []) as PortfolioProject[]
  ).map((project) => {
    const imageUrl = project.image_path
      ? supabase.storage
          .from("portfolio-images")
          .getPublicUrl(
            project.image_path,
          )
          .data.publicUrl
      : null;

    return {
      ...project,
      imageUrl,
    };
  });

  /*
   * FEATURED PROJECTS
   */
  const featuredProjectIds =
    new Set(
      (featuredProjectData ?? []).map(
        (item) => item.project_id,
      ),
    );

  /*
   * RATINGS
   */
  const averageRating = Number(
    rating?.average_rating ?? 0,
  );

  const totalReviews = Number(
    rating?.total_reviews ?? 0,
  );

  const roundedRating = Math.min(
    5,
    Math.max(
      0,
      Math.round(averageRating),
    ),
  );

  /*
   * AVATAR INITIAL
   */
  const avatarInitial =
    profile.display_name
      .trim()
      .charAt(0)
      .toUpperCase() || "L";

  /*
   * OWN PROFILE
   */
  const isOwnProfile =
    user.id === profile.id;

  /*
   * CREDITS
   */
  let creditBalance = 0;

  if (isOwnProfile) {
    const creditBalanceResult =
      creditBalanceData as {
        balance: number | string;
      } | null;

    creditBalance = Number(
      creditBalanceResult?.balance ?? 0,
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <AuthenticatedNavbar />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <section className="border-b border-[#173d32]/15 pb-10">
          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_620px] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-col gap-9 sm:flex-row sm:items-start sm:pl-6">
                {isOwnProfile ? (
                  <AvatarUpload
                    userId={profile.id}
                    currentAvatarUrl={avatarUrl}
                    displayName={
                      profile.display_name
                    }
                    editable={true}
                    size="profile"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`${profile.display_name} profile picture`}
                    className="flex h-[150px] w-[150px] shrink-0 items-center justify-center rounded-full border border-[#173d32]/15 bg-[#e9e1d2] bg-cover bg-center font-serif text-5xl font-semibold"
                    style={
                      avatarUrl
                        ? {
                            backgroundImage: `url(${avatarUrl})`,
                          }
                        : undefined
                    }
                  >
                    {!avatarUrl &&
                      avatarInitial}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <h1 className="font-serif text-5xl font-semibold">
                      {profile.display_name}
                    </h1>

                    {isIdentityVerified && (
                      <span
                        title="Government ID and selfie/liveness were successfully confirmed."
                        className="inline-flex items-center gap-2 rounded-full bg-[#789b82] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <span aria-hidden="true">
                          ✓
                        </span>

                        Identity Verified
                      </span>
                    )}
                  </div>

                  {!isIdentityVerified && (
                    <>
                      <span
                        title="This user has not completed optional identity verification."
                        className="mt-4 inline-flex items-center rounded-full border border-[#b76449]/40 bg-[#b76449]/10 px-3 py-1.5 text-xs font-semibold text-[#9f503c]"
                      >
                        Not Verified
                      </span>

                      {isOwnProfile && (
                        <Link
                          href="/verification"
                          className="ml-3 text-sm font-semibold text-[#b76449] underline decoration-[#b76449]/30 underline-offset-4 transition hover:text-[#9f503c]"
                        >
                          Verify Identity
                        </Link>
                      )}
                    </>
                  )}

                  <p className="mt-3 text-[#173d32]/60">
                    {profile.workspace_role ===
                    "creator"
                      ? "creator workspace"
                      : "Buyer workspace"}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {accountAgeLabel && (
                      <span className="inline-flex items-center rounded-full border border-[#173d32]/15 bg-[#fbf8f1] px-3 py-1.5 text-xs font-semibold text-[#173d32]/65">
                        {accountAgeLabel}
                      </span>
                    )}

                    {isVip && (
                      <span
                        title="VIP member — priority service and dedicated LIKHA support."
                        className="inline-flex items-center gap-2 rounded-full border border-[#b38a3e]/60 bg-[#173d32] px-3.5 py-2 text-xs font-semibold tracking-[0.08em] text-[#f3dfad] shadow-[0_2px_8px_rgba(23,61,50,0.12)]"
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-5 w-5 items-center justify-center rounded-full border border-[#e4c36a]/70 bg-[#0f2f27] text-[15px] leading-none text-[#e4c36a]"
                        >
                          ♝
                        </span>

                        <span>
                          VIP
                        </span>
                      </span>
                    )}

                    {hasAdminBadge && (
                      <span
                        title="Official LIKHA administrator."
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#b38a3e]/50 bg-[#173d32] px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-[#f3dfad] shadow-sm"
                      >
                        <span aria-hidden="true">
                          ♛
                        </span>

                        LIKHA ADMIN
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-8 text-sm">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <span className="font-semibold">
                          {followerCount ?? 0}
                        </span>{" "}
                        <span className="text-[#173d32]/55">
                          {followerCount === 1
                            ? "Follower"
                            : "Followers"}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold">
                          {followingCount ?? 0}
                        </span>{" "}
                        <span className="text-[#173d32]/55">
                          Following
                        </span>
                      </div>
                    </div>

                    {!isOwnProfile && (
                      <FollowButton
                        viewerId={user.id}
                        profileId={profile.id}
                      />
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <div
                      className="text-2xl tracking-[0.1em] text-[#b76449]"
                      aria-label={`${averageRating} out of 5 stars`}
                    >
                      {"★".repeat(
                        roundedRating,
                      )}

                      <span className="text-[#173d32]/15">
                        {"★".repeat(
                          5 - roundedRating,
                        )}
                      </span>
                    </div>

                    <p className="font-semibold">
                      {averageRating.toFixed(
                        1,
                      )}

                      <span className="ml-2 font-normal text-[#173d32]/55">
                        ({totalReviews}{" "}
                        {totalReviews === 1
                          ? "review"
                          : "reviews"}
                        )
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 ml-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/45">
                  LIKHA Activity
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-10">
                  <div>
                    <p className="font-serif text-3xl font-semibold">
                      {completedProjects ??
                        0}
                    </p>

                    <p className="mt-1 text-sm text-[#173d32]/55">
                      Projects completed
                    </p>
                  </div>

                  <div>
                    <p className="font-serif text-3xl font-semibold">
                      {purchasedProjects ??
                        0}
                    </p>

                    <p className="mt-1 text-sm text-[#173d32]/55">
                      Projects purchased
                    </p>
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <div className="mt-6 ml-6 flex flex-wrap items-center gap-4">
                  <div className="min-w-36 rounded-xl border border-[#173d32]/15 bg-[#fbf8f1] px-5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/45">
                      Available credits
                    </p>

                    <p className="mt-1 font-serif text-3xl font-semibold">
                      {creditBalance.toLocaleString(
                        "en-PH",
                      )}
                    </p>
                  </div>

                  <Link
                    href="/credits"
                    className="inline-flex rounded-lg bg-[#173d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245646]"
                  >
                    Bumili ng Credits
                  </Link>
                </div>
              )}
            </div>

            {earnedBadges.length > 0 && (
              <aside className="w-full self-start lg:-mt-16 lg:-translate-x-6">
                <div className="flex min-h-[480px] w-full flex-col rounded-[24px] border border-[#c89b3c]/55 bg-[#fbf8f1] p-6 shadow-[0_8px_30px_rgba(23,61,50,0.05)]">
                  <div>
                    <h2 className="mt-1 font-serif text-3xl font-semibold">
                      LIKHA Badges
                    </h2>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-7">
                    {visibleBadges.map(
                      (badge) => {
                        return (
                          <div
                            key={badge.id}
                            className="group min-w-0 text-center"
                          >
                            <div className="mx-auto flex h-[100px] w-[100px] items-center justify-center">
                              {badge.image_url ? (
                                <img
                                  src={
                                    badge.image_url
                                  }
                                  alt={
                                    badge.name
                                  }
                                  className="h-full w-full object-contain drop-shadow-[0_5px_8px_rgba(23,61,50,0.12)] transition duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#173d32] font-serif text-sm font-semibold text-[#e4c36a]">
                                  {badge.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>

                            <p className="mt-2 line-clamp-1 text-xs font-semibold text-[#173d32]">
                              {badge.name}
                            </p>

                            {badge.description && (
                              <p className="mx-auto mt-1 line-clamp-2 max-w-[120px] text-[10px] leading-4 text-[#173d32]/45">
                                {
                                  badge.description
                                }
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                    <p className="text-[10px] leading-4 text-[#173d32]/40">
                      Badges are displayed
                      from rarest to most common.
                    </p>

                    {hasMoreBadges && (
                      <Link
                        href={`/profile/${profile.id}/badges`}
                        className="shrink-0 rounded-full border border-[#c89b3c]/60 bg-[#e4c36a] px-4 py-2 text-xs font-semibold text-[#173d32] transition hover:bg-[#d9b85d]"
                      >
                        View all
                      </Link>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </section>

        <section className="grid gap-10 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div className="border-b border-[#173d32]/15 pb-10 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12">
            <h2 className="mt-2 font-serif text-4xl font-semibold">
              Feedback from Likha users
            </h2>

            {reviews.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-8 text-center">
                <p className="font-serif text-2xl font-semibold">
                  Wala pang review ang
                  profile na ito.
                </p>
              </div>
            ) : (
              <div className="mt-8 divide-y divide-[#173d32]/15 border-y border-[#173d32]/15">
                {reviews.map(
                  (review) => (
                    <article
                      key={review.id}
                      className="py-7"
                    >
                      <div
                        className="text-2xl tracking-[0.1em] text-[#b76449]"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {"★".repeat(
                          review.rating,
                        )}

                        <span className="text-[#173d32]/15">
                          {"★".repeat(
                            5 -
                              review.rating,
                          )}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="mt-4 leading-7 text-[#173d32]/75">
                          “{review.comment}”
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-x-3 text-sm text-[#173d32]/50">
                        <span className="font-semibold text-[#173d32]/70">
                        {review.reviewer_name.split(" ")[0]} {review.reviewer_name.split(" ").slice(-1)[0].charAt(0)}.
                        </span>

                        <span>•</span>

                        <time
                          dateTime={
                            review.created_at
                          }
                        >
                          {new Date(
                            review.created_at,
                          ).toLocaleDateString(
                            "en-PH",
                            {
                              month:
                                "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </time>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="mt-2 font-serif text-4xl font-semibold">
                  Mga Proyekto
                </h2>
              </div>

              <p className="text-sm text-[#173d32]/55">
                {projects.length} / 6
                projects
              </p>
            </div>

            {isOwnProfile && (
              <details className="mt-6 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-5">
                <summary className="cursor-pointer list-none font-semibold text-[#b76449]">
                  + Magdagdag ng
                  project
                </summary>

                <PortfolioProjectForm />
              </details>
            )}

            {projects.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-[#173d32]/25 bg-[#fbf8f1] p-10 text-center">
                <p className="font-serif text-2xl font-semibold">
                  Wala pang project na
                  ipinapakita.
                </p>

                <p className="mt-2 text-sm leading-6 text-[#173d32]/55">
                  Dito makikita ang mga
                  larawan at kuwento tungkol
                  sa mga natapos na gawa.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {projects.map(
                  (project) => (
                    <article
                      key={project.id}
                      className="overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]"
                    >
                      {project.imageUrl ? (
                        <div
                          role="img"
                          aria-label={`${project.title} project picture`}
                          className="aspect-[4/3] bg-[#e9e1d2] bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${project.imageUrl})`,
                          }}
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center bg-[#e9e1d2] text-sm text-[#173d32]/45">
                          Walang larawan
                        </div>
                      )}

                      <div className="p-5">
                        <h3 className="font-serif text-2xl font-semibold">
                          {project.title}
                        </h3>

                        {project.description && (
                          <ProjectDescription
                            description={
                              project.description
                            }
                          />
                        )}

                        {isOwnProfile && (
                          <FeatureProjectButton
                            projectId={
                              project.id
                            }
                            isVip={isVip}
                            isFeatured={featuredProjectIds.has(
                              project.id,
                            )}
                          />
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {isOwnProfile && (
          <section className="border-t border-[#173d32]/15 py-10">
            <h2 className="mt-2 font-serif text-3xl font-semibold">
              Mga patakaran ng LIKHA
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-[#173d32]/65">
              Maaari mong basahin anumang
              oras kung paano gumagana ang
              marketplace at kung paano
              pinoprotektahan ang iyong
              impormasyon.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/terms"
                className="rounded-lg border border-[#173d32]/20 px-5 py-3 text-center text-sm font-semibold transition hover:border-[#b76449] hover:text-[#b76449]"
              >
                Terms and Conditions
              </Link>

              <Link
                href="/privacy"
                className="rounded-lg border border-[#173d32]/20 px-5 py-3 text-center text-sm font-semibold transition hover:border-[#b76449] hover:text-[#b76449]"
              >
                Privacy Policy
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}