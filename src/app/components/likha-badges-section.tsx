"use client";

import Link from "next/link";

type BadgeRarity =
  | "Legendary"
  | "Epic"
  | "Rare"
  | "Uncommon"
  | "Common";

type Badge = {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  icon: string;
};

const rarityOrder: Record<BadgeRarity, number> = {
  Legendary: 1,
  Epic: 2,
  Rare: 3,
  Uncommon: 4,
  Common: 5,
};

const badges: Badge[] = [
  {
    id: "founding-50",
    name: "Founding 50",
    description: "One of the first 50 LIKHA accounts.",
    rarity: "Legendary",
    icon: "50",
  },
  {
    id: "top-buyer",
    name: "Top Buyer",
    description: "Purchased 100 projects.",
    rarity: "Epic",
    icon: "🛒",
  },
  {
    id: "active-buyer",
    name: "Active Buyer",
    description: "Purchased 50 projects.",
    rarity: "Epic",
    icon: "🛒",
  },
  {
    id: "project-collector",
    name: "Project Collector",
    description: "Purchased 10 projects.",
    rarity: "Rare",
    icon: "10",
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Viewed 500 projects.",
    rarity: "Rare",
    icon: "500",
  },
  {
    id: "communicator",
    name: "Communicator",
    description: "Sent 50 messages.",
    rarity: "Rare",
    icon: "50",
  },
  {
    id: "profile-complete",
    name: "Profile Complete",
    description: "Completed your LIKHA profile.",
    rarity: "Uncommon",
    icon: "✓",
  },
  {
    id: "consistent",
    name: "Consistent",
    description: "Used LIKHA for 7 days.",
    rarity: "Uncommon",
    icon: "7",
  },
  {
    id: "supporter",
    name: "Supporter",
    description: "Liked 10 projects.",
    rarity: "Common",
    icon: "♥",
  },
  {
    id: "connector",
    name: "Connector",
    description: "Followed 5 users.",
    rarity: "Common",
    icon: "5",
  },
];

const sortedBadges = [...badges].sort(
  (a, b) =>
    rarityOrder[a.rarity] -
    rarityOrder[b.rarity],
);

function rarityStyle(rarity: BadgeRarity) {
  switch (rarity) {
    case "Legendary":
      return "border-[#c89b3c]/60 bg-[#e4c36a]/20 text-[#8a651c]";

    case "Epic":
      return "border-[#8b6fa8]/40 bg-[#8b6fa8]/10 text-[#70568c]";

    case "Rare":
      return "border-[#5d88b8]/40 bg-[#5d88b8]/10 text-[#426d9d]";

    case "Uncommon":
      return "border-[#8ba76b]/40 bg-[#8ba76b]/10 text-[#58733d]";

    default:
      return "border-[#173d32]/15 bg-[#173d32]/5 text-[#173d32]/55";
  }
}

export default function LikhaBadgesSection() {
  const previewBadges = sortedBadges.slice(0, 6);

  return (
    <section className="rounded-[24px] border border-[#c89b3c]/55 bg-[#fbf8f1] p-5 shadow-[0_8px_25px_rgba(23,61,50,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            Achievements
          </p>

          <h2 className="mt-1 font-serif text-2xl font-semibold text-[#173d32]">
            LIKHA Badges
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#173d32]/55">
            Collect badges as you use LIKHA.
          </p>
        </div>

        <Link
          href="/badges"
          className="shrink-0 rounded-full border border-[#c89b3c]/60 bg-[#e4c36a] px-4 py-2 text-xs font-semibold text-[#173d32] transition hover:bg-[#d9b85c]"
        >
          View all
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {previewBadges.map((badge) => (
          <div
            key={badge.id}
            className="rounded-xl border border-[#173d32]/10 bg-white/50 px-2 py-3 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#c89b3c]/60 bg-[#173d32] font-serif text-sm font-semibold text-[#e4c36a]">
              {badge.icon}
            </div>

            <p className="mt-2 truncate text-[11px] font-semibold text-[#173d32]">
              {badge.name}
            </p>

            <p className="mt-1 line-clamp-2 min-h-[28px] text-[9px] leading-3.5 text-[#173d32]/50">
              {badge.description}
            </p>

            <span
              className={`mt-2 inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.05em] ${rarityStyle(
                badge.rarity,
              )}`}
            >
              {badge.rarity}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}