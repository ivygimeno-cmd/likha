import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";

type FeaturedProject = {
  id: number;
  title: string;
  description: string | null;
  image_path: string | null;
  owner_id: string;
  created_at: string;
};

type ProfileInfo = {
  id: string;
  display_name: string | null;
  role: string | null;
};

const categories = [
  "Lahat",
  "Apparel",
  "Gifts",
  "Souvenirs",
  "Business",
  "Digital",
];

const fallbackProducts = [
  {
    name: "Custom Event T-Shirts",
    seller: "Habi Studio",
    location: "Quezon City",
    price: "Starts at ₱180",
    category: "Apparel",
    color: "bg-[#b76449]",
    accent: "bg-[#f5d8c8]",
  },
  {
    name: "Personalized Ceramic Mugs",
    seller: "Luwad & Co.",
    location: "Antipolo City",
    price: "Starts at ₱250",
    category: "Gifts",
    color: "bg-[#768674]",
    accent: "bg-[#e5dfcc]",
  },
  {
    name: "Branded Product Packaging",
    seller: "Tatak Creative",
    location: "Makati City",
    price: "Starts at ₱1,500",
    category: "Business",
    color: "bg-[#173d32]",
    accent: "bg-[#d9c6a5]",
  },
  {
    name: "Wedding Souvenir Sets",
    seller: "Gunita Handmade",
    location: "Cavite",
    price: "Starts at ₱95",
    category: "Souvenirs",
    color: "bg-[#a67c52]",
    accent: "bg-[#f1e2cc]",
  },
  {
    name: "Custom Tote Bags",
    seller: "Sining Lokal",
    location: "Pasig City",
    price: "Starts at ₱160",
    category: "Apparel",
    color: "bg-[#c2946c]",
    accent: "bg-[#f5f0e6]",
  },
  {
    name: "Logo Sticker Packages",
    seller: "Guhit Prints",
    location: "Manila",
    price: "Starts at ₱350",
    category: "Business",
    color: "bg-[#455b4e]",
    accent: "bg-[#d3ab83]",
  },
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
  }>;
}) {
  const params = await searchParams;

  const requestedCategory =
    params.category ?? "Lahat";

  const selectedCategory =
    categories.includes(requestedCategory)
      ? requestedCategory
      : "Lahat";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const isSeller =
    profile?.role === "seller";

  const [
    { data: openRequests, error: openRequestsError },
    { data: featuredRows, error: featuredError },
  ] = await Promise.all([
    isSeller
      ? supabase
          .from("project_requests")
          .select(
            "id, buyer_id, title, product_type, minimum_budget, maximum_budget, deadline, location, status, created_at",
          )
          .eq("status", "open")
          .neq("buyer_id", user!.id)
          .order("created_at", {
            ascending: false,
          })
      : Promise.resolve({
          data: [],
          error: null,
        }),

    supabase
      .from("featured_projects")
      .select("project_id")
      .eq("is_active", true),
  ]);

  if (openRequestsError) {
    throw new Error(
      `Hindi ma-load ang marketplace requests: ${openRequestsError.message}`,
    );
  }

  if (featuredError) {
    console.error(
      "Featured projects error:",
      featuredError.message,
    );
  }

  const featuredProjectIds =
    (featuredRows ?? []).map(
      (row) => row.project_id,
    );

  let featuredProjects: FeaturedProject[] =
    [];

  if (featuredProjectIds.length > 0) {
    const {
      data: projectData,
      error: projectError,
    } = await supabase
      .from("portfolio_projects")
      .select(
        "id, title, description, image_path, owner_id, created_at",
      )
      .in("id", featuredProjectIds)
      .order("created_at", {
        ascending: false,
      });

    if (projectError) {
      console.error(
        "Featured portfolio projects error:",
        projectError.message,
      );
    } else {
      featuredProjects =
        (projectData ?? []) as FeaturedProject[];
    }
  }

  const ownerIds = [
    ...new Set(
      featuredProjects.map(
        (project) => project.owner_id,
      ),
    ),
  ];

  let ownerProfiles: ProfileInfo[] =
    [];

  if (ownerIds.length > 0) {
    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, display_name, role",
      )
      .in("id", ownerIds);

    if (profileError) {
      console.error(
        "Featured creator profiles error:",
        profileError.message,
      );
    } else {
      ownerProfiles =
        (profileData ?? []) as ProfileInfo[];
    }
  }

  const profileMap = new Map(
    ownerProfiles.map((profile) => [
      profile.id,
      profile,
    ]),
  );

  const dynamicFeaturedProjects =
    featuredProjects.map((project) => {
      const owner = profileMap.get(
        project.owner_id,
      );

      const imageUrl = project.image_path
        ? supabase.storage
            .from("portfolio-images")
            .getPublicUrl(
              project.image_path,
            ).data.publicUrl
        : null;

      return {
        id: project.id,
        name: project.title,
        description:
          project.description,
        seller:
          owner?.display_name ??
          "LIKHA Creator",
        imageUrl,
      };
    });

  const fallbackFilteredProducts =
    selectedCategory === "Lahat"
      ? fallbackProducts
      : fallbackProducts.filter(
          (product) =>
            product.category ===
            selectedCategory,
        );

  const hasFeaturedProjects =
    dynamicFeaturedProjects.length > 0;

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      {user ? (
        <AuthenticatedNavbar />
      ) : (
        <header className="sticky top-0 z-50 border-b border-[#173d32]/15 bg-[#f5f0e6]/95 shadow-sm backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
            <Link
              href="/"
              className="font-serif text-3xl font-semibold tracking-[0.2em]"
            >
              LIKHA
            </Link>

            <div className="flex items-center gap-8">
              <div className="hidden items-center gap-9 text-sm font-medium md:flex">
                <Link
                  href="/marketplace"
                  className="text-[#b76449]"
                >
                  Marketplace
                </Link>

                <Link
                  href="/#how-it-works"
                  className="hover:text-[#b76449]"
                >
                  Paano Gumagana
                </Link>
              </div>

              <Link
                href="/login"
                className="rounded-md bg-[#173d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b76449]"
              >
                Mag-sign in
              </Link>
            </div>
          </nav>
        </header>
      )}

      <section className="border-b border-[#173d32]/15">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <div className="mt-4 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl font-serif text-5xl leading-tight font-semibold sm:text-6xl">
                Tuklasin ang gawang lokal.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#173d32]/70">
                Maghanap ng Filipino creators
                para sa custom apparel,
                personalized gifts, souvenirs
                at branded business materials.
              </p>
            </div>

            <Link
              href="/request"
              className="w-fit rounded-md bg-[#b76449] px-7 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#9f503c]"
            >
              May ipapagawa ako
            </Link>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-md border border-[#173d32]/20 bg-[#fbf8f1] px-5 py-4">
              <span aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                placeholder="Maghanap ng produkto o creator..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#173d32]/45"
                aria-label="Maghanap sa marketplace"
              />
            </label>

            <button
              type="button"
              className="rounded-md border border-[#173d32]/20 bg-[#fbf8f1] px-6 py-4 text-left text-sm font-semibold"
            >
              Location: Lahat
            </button>
          </div>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {categories.map(
              (category) => (
                <Link
                  key={category}
                  href={
                    category === "Lahat"
                      ? "/marketplace"
                      : `/marketplace?category=${encodeURIComponent(
                          category,
                        )}`
                  }
                  className={
                    category ===
                    selectedCategory
                      ? "shrink-0 rounded-full bg-[#173d32] px-5 py-2.5 text-sm font-semibold text-white"
                      : "shrink-0 rounded-full border border-[#173d32]/20 px-5 py-2.5 text-sm font-semibold transition hover:border-[#b76449] hover:text-[#b76449]"
                  }
                >
                  {category}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {isSeller && (
        <section className="border-y border-[#173d32]/15 bg-[#f5f0e6] px-6 py-14 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
                  Open Buyer Requests
                </p>

                <h2 className="mt-2 font-serif text-4xl font-semibold">
                  Mga naghahanap ng creator
                </h2>

                <p className="mt-3 text-[#173d32]/60">
                  Tingnan ang mga open requests
                  at mag-submit ng proposal.
                </p>
              </div>

              <p className="text-sm font-semibold text-[#173d32]/55">
                {openRequests?.length ?? 0}{" "}
                {(openRequests?.length ?? 0) ===
                1
                  ? "request"
                  : "requests"}
              </p>
            </div>

            {!openRequests ||
            openRequests.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] px-6 py-12 text-center">
                <p className="font-serif text-2xl font-semibold">
                  Wala pang open buyer
                  requests.
                </p>

                <p className="mt-2 text-sm text-[#173d32]/55">
                  Bumalik ulit kapag may bagong
                  project na available.
                </p>
              </div>
            ) : (
              <div className="mt-8 divide-y divide-[#173d32]/15 border-y border-[#173d32]/15">
                {openRequests.map(
                  (request) => (
                    <article
                      key={request.id}
                      className="grid gap-6 py-7 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] md:items-center"
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
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                          Budget
                        </p>

                        <p className="mt-1 font-semibold">
                          ₱
                          {Number(
                            request.minimum_budget,
                          ).toLocaleString(
                            "en-PH",
                          )}
                          –₱
                          {Number(
                            request.maximum_budget,
                          ).toLocaleString(
                            "en-PH",
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                          Deadline
                        </p>

                        <p className="mt-1 font-semibold">
                          {new Date(
                            request.deadline,
                          ).toLocaleDateString(
                            "en-PH",
                            {
                              month:
                                "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>

                      <Link
                        href={`/requests/${request.id}`}
                        className="w-fit rounded-lg bg-[#173d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245646]"
                      >
                        Tingnan Request
                      </Link>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-[#fbf8f1] px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <p className="font-semibold">
              Featured creations{" "}
              <span className="font-normal text-[#173d32]/50">
                (
                {hasFeaturedProjects
                  ? dynamicFeaturedProjects.length
                  : fallbackFilteredProducts.length}
                )
              </span>
            </p>

            <button
              type="button"
              className="text-sm font-semibold text-[#b76449]"
            >
              Sort: Recommended
            </button>
          </div>

          {hasFeaturedProjects ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {dynamicFeaturedProjects.map(
                (project) => (
                  <article
                    key={project.id}
                    className="group"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#e9e1d2]">
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-serif text-2xl font-semibold text-[#173d32]/35">
                            LIKHA
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/30 bg-white/15 p-5 text-white backdrop-blur-sm">
                        <p className="text-xs uppercase tracking-[0.2em] opacity-75">
                          Featured
                        </p>

                        <p className="mt-2 font-serif text-2xl font-semibold">
                          {project.name}
                        </p>
                      </div>
                    </div>

                    <div className="pt-5">
                      <p className="text-sm text-[#b76449]">
                        {project.seller}
                      </p>

                      <h2 className="mt-1 font-serif text-2xl font-semibold">
                        {project.name}
                      </h2>

                      {project.description && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#173d32]/60">
                          {project.description}
                        </p>
                      )}

                      <p className="mt-4 text-sm font-semibold text-[#173d32]/55">
                        Featured portfolio project
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackFilteredProducts.map(
                (product) => (
                  <article
                    key={product.name}
                    className="group"
                  >
                    <div
                      className={`relative aspect-[4/3] overflow-hidden rounded-2xl ${product.color}`}
                    >
                      <div
                        className={`absolute -right-10 -top-12 h-48 w-48 rotate-12 rounded-3xl ${product.accent} opacity-80 transition duration-500 group-hover:rotate-6 group-hover:scale-110`}
                      />

                      <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/30 bg-white/15 p-5 text-white backdrop-blur-sm">
                        <p className="text-xs uppercase tracking-[0.2em] opacity-75">
                          {product.category}
                        </p>

                        <p className="mt-2 font-serif text-2xl font-semibold">
                          Gawang may sariling kuwento.
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-label={`Save ${product.name}`}
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#fbf8f1] text-[#173d32] shadow-sm"
                      >
                        ♡
                      </button>
                    </div>

                    <div className="pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-[#b76449]">
                            {product.seller} ·{" "}
                            {product.location}
                          </p>

                          <h2 className="mt-1 font-serif text-2xl font-semibold">
                            {product.name}
                          </h2>
                        </div>

                        <span className="shrink-0 text-sm">
                          ★ 4.9
                        </span>
                      </div>

                      <p className="mt-3 font-semibold">
                        {product.price}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}