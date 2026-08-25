import Link from "next/link";

const rarityOrder = {
  Mythic: 1,
  Legendary: 2,
  Rare: 3,
  Uncommon: 4,
  Common: 5,
};

const badges = [
  {
    slug: "likha-admin",
    name: "LIKHA Admin",
    rarity: "Mythic",
    description: "Official LIKHA administrator.",
    image: "/badges/likha-admin.png",
  },
  {
    slug: "founding-50",
    name: "Founding 50",
    rarity: "Legendary",
    description: "One of the first 50 to call LIKHA home.",
    image: "/badges/founding-50.png",
  },
  {
    slug: "top-seller",
    name: "Top Seller",
    rarity: "Legendary",
    description: "Among LIKHA's most successful sellers.",
    image: "/badges/top-seller.png",
  },
  {
    slug: "top-buyer",
    name: "Top Buyer",
    rarity: "Legendary",
    description: "Among LIKHA's most valued buyers.",
    image: "/badges/top-buyer.png",
  },
  {
    slug: "vip",
    name: "VIP",
    rarity: "Special",
    description: "An active LIKHA VIP status.",
    image: "/badges/vip.png",
  },
  {
    slug: "project-connoisseur",
    name: "Project Connoisseur",
    rarity: "Rare",
    description: "A true collector of great work.",
    image: "/badges/project-connoisseur.png",
  },
  {
    slug: "master-seller",
    name: "Master Seller",
    rarity: "Rare",
    description: "A proven name in the LIKHA marketplace.",
    image: "/badges/master-seller.png",
  },
  {
    slug: "project-collector",
    name: "Project Collector",
    rarity: "Uncommon",
    description: "Building a collection worth having.",
    image: "/badges/project-collector.png",
  },
  {
    slug: "rising-seller",
    name: "Rising Seller",
    rarity: "Uncommon",
    description: "Building a strong track record on LIKHA.",
    image: "/badges/rising-seller.png",
  },
  {
    slug: "credit-regular",
    name: "Credit Regular",
    rarity: "Uncommon",
    description: "A regular when it comes to LIKHA credits.",
    image: "/badges/credit-regular.png",
  },
  {
    slug: "first-collector",
    name: "First Collector",
    rarity: "Common",
    description: "Your LIKHA collection has begun.",
    image: "/badges/first-collector.png",
  },
  {
    slug: "active-seller",
    name: "Active Seller",
    rarity: "Common",
    description: "Making things happen on LIKHA.",
    image: "/badges/active-seller.png",
  },
  {
    slug: "messenger",
    name: "Messenger",
    rarity: "Common",
    description: "Keeping LIKHA connected.",
    image: "/badges/messenger.png",
  },
  {
    slug: "verified-member",
    name: "Verified Member",
    rarity: "Common",
    description: "Your identity has been verified.",
    image: "/badges/verified-member.png",
  },
  {
    slug: "credit-starter",
    name: "Credit Starter",
    rarity: "Common",
    description: "Your LIKHA journey has begun.",
    image: "/badges/credit-starter.png",
  },
];

export default function BadgesPage() {
  const sortedBadges = [...badges].sort(
    (a, b) =>
      rarityOrder[a.rarity as keyof typeof rarityOrder] -
      rarityOrder[b.rarity as keyof typeof rarityOrder],
  );

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10">

        <Link
          href="/dashboard"
          className="text-sm font-semibold text-[#b76449]"
        >
          Back to dashboard
        </Link>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            Achievements
          </p>

          <h1 className="mt-2 font-serif text-5xl font-semibold">
            LIKHA Badges
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#173d32]/60">
            Badges recognize milestones, achievements,
            and special status across LIKHA.
          </p>
        </div>

        <section className="mt-10 rounded-[28px] border border-[#c89b3c]/55 bg-[#fbf8f1] p-6 shadow-[0_10px_35px_rgba(23,61,50,0.06)] md:p-8">

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">

            {sortedBadges.map((badge) => (
              <article
                key={badge.slug}
                className="group rounded-2xl border border-[#173d32]/10 bg-white/40 p-5 text-center transition hover:-translate-y-1 hover:border-[#c89b3c]/50 hover:shadow-lg"
              >

                <div className="flex h-40 items-center justify-center">
                  <img
                    src={badge.image}
                    alt={badge.name}
                    className="h-full w-full object-contain drop-shadow-[0_8px_12px_rgba(23,61,50,0.12)] transition duration-300 group-hover:scale-105"
                  />
                </div>

                <h2 className="mt-4 font-serif text-xl font-semibold">
                  {badge.name}
                </h2>

                <p className="mt-2 min-h-[48px] text-xs leading-5 text-[#173d32]/55">
                  {badge.description}
                </p>

                <span className="mt-3 inline-flex rounded-full border border-[#c89b3c]/40 bg-[#e4c36a]/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a651c]">
                  {badge.rarity}
                </span>

              </article>
            ))}

          </div>

        </section>
      </div>
    </main>
  );
}