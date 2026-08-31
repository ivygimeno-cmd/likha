"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PersonResult = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

type ProjectResult = {
  id: string;
  title: string;
  product_type: string | null;
  location: string | null;
};

type SearchResults = {
  people: PersonResult[];
  projects: ProjectResult[];
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    people: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = query.trim();

    if (value.length < 2) {
      setResults({ people: [], projects: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(value)}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();

        setResults({
          people: data.people ?? [],
          projects: data.projects ?? [],
        });

        setOpen(true);
      } catch {
        setResults({ people: [], projects: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasResults =
    results.people.length > 0 ||
    results.projects.length > 0;

  return (
    <div
      ref={searchRef}
      className="relative hidden min-w-0 flex-1 md:block md:max-w-xl"
    >
      <div className="flex items-center rounded-full border border-[#173d32]/15 bg-[#fbf8f1] px-4 py-2.5 transition focus-within:border-[#b76449]/50">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="mr-3 h-5 w-5 shrink-0 text-[#173d32]/45"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path
            strokeLinecap="round"
            d="m16 16 4 4"
          />
        </svg>

        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setOpen(true);
            }
          }}
          placeholder="Search people or projects"
          aria-label="Search people or projects"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#173d32]/40"
        />

        {loading && (
          <span className="ml-2 text-xs text-[#173d32]/40">
            Searching
          </span>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] shadow-xl">
          {!hasResults && !loading ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm font-semibold">
                No results found
              </p>
              <p className="mt-1 text-xs text-[#173d32]/50">
                Try another name or project.
              </p>
            </div>
          ) : (
            <div className="max-h-[430px] overflow-y-auto">
              {results.people.length > 0 && (
                <section className="border-b border-[#173d32]/10">
                  <div className="px-5 pb-2 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                      People
                    </p>
                  </div>

                  {results.people.map((person) => {
                   const name = (() => {
  if (person.full_name) {
    const parts = person.full_name
      .trim()
      .split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    }

    return parts[0];
  }

  return person.business_name || "LIKHA member";
})();

                    return (
                      <Link
                        key={person.id}
                        href={`/profile/${person.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 transition hover:bg-[#173d32]/5"
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173d32] bg-cover bg-center text-sm font-semibold text-white"
                          style={
                            person.avatar_url
                              ? {
                                  backgroundImage: `url(${person.avatar_url})`,
                                }
                              : undefined
                          }
                        >
                          {!person.avatar_url &&
                            name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {name}
                          </p>

                          <p className="text-xs text-[#b76449]">
                            {person.role === "creator"
                              ? "creator"
                              : "Buyer"}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </section>
              )}

              {results.projects.length > 0 && (
                <section>
                  <div className="px-5 pb-2 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                      Projects
                    </p>
                  </div>

                  {results.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/requests/${project.id}`}
                      onClick={() => setOpen(false)}
                      className="block px-5 py-3 transition hover:bg-[#173d32]/5"
                    >
                      <p className="text-sm font-semibold">
                        {project.title}
                      </p>

                      <p className="mt-1 text-xs text-[#173d32]/50">
                        {project.product_type || "Custom project"}
                        {project.location
                          ? ` · ${project.location}`
                          : ""}
                      </p>
                    </Link>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}