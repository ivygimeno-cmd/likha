"use client";

import { useState } from "react";

type AdminUserSearchProps = {
  totalUsers: number;
};

export default function AdminUserSearch({
  totalUsers,
}: AdminUserSearchProps) {
  const [visibleCount, setVisibleCount] =
    useState(totalUsers);

  function handleSearch(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const query = event.target.value
      .trim()
      .toLowerCase();

    const rows =
      document.querySelectorAll<HTMLTableRowElement>(
        "[data-admin-user-row]",
      );

    let visible = 0;

    rows.forEach((row) => {
      const searchable =
        row.dataset.searchText?.toLowerCase() ?? "";

      const matches =
        query === "" || searchable.includes(query);

      row.style.display = matches ? "" : "none";

      if (matches) {
        visible += 1;
      }
    });

    setVisibleCount(visible);
  }
return (
  <div className="w-full sm:w-80">
    <div className="mb-2 flex items-center justify-between gap-3">
      <label
        htmlFor="admin-user-search"
        className="text-xs font-semibold uppercase tracking-[0.12em] text-[#173d32]/55"
      >
        Search users
      </label>

      <span className="text-xs text-[#173d32]/45">
        {visibleCount}{" "}
        {visibleCount === 1 ? "account" : "accounts"}
      </span>
    </div>

    <input
      id="admin-user-search"
      type="search"
      onChange={handleSearch}
    placeholder="Name, email or phone"
      className="w-full rounded-xl border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-3 text-sm text-[#173d32] outline-none transition placeholder:text-[#173d32]/35 focus:border-[#b76449]"
    />
  </div>
);
}