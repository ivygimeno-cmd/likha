export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <div className="h-8 w-32 animate-pulse rounded bg-[#173d32]/10" />

          <div className="hidden h-10 w-80 animate-pulse rounded-full bg-[#173d32]/10 md:block" />

          <div className="h-10 w-28 animate-pulse rounded-full bg-[#173d32]/10" />
        </div>
      </header>

      <section className="border-b border-[#173d32]/15">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <div className="h-16 w-4/5 animate-pulse rounded bg-[#173d32]/10 sm:h-20" />

            <div className="mt-6 space-y-3">
              <div className="h-5 w-full animate-pulse rounded bg-[#173d32]/10" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-[#173d32]/10" />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <div className="h-14 flex-1 animate-pulse rounded-md bg-[#173d32]/10" />

            <div className="h-14 w-full animate-pulse rounded-md bg-[#173d32]/10 sm:w-48" />
          </div>

          <div className="mt-6 flex gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-11 w-24 animate-pulse rounded-full bg-[#173d32]/10"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fbf8f1] px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-6 w-48 animate-pulse rounded bg-[#173d32]/10" />

            <div className="h-5 w-36 animate-pulse rounded bg-[#173d32]/10" />
          </div>

          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-[#173d32]/10" />

                <div className="pt-5">
                  <div className="h-4 w-32 animate-pulse rounded bg-[#173d32]/10" />

                  <div className="mt-3 h-7 w-4/5 animate-pulse rounded bg-[#173d32]/10" />

                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-[#173d32]/10" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-[#173d32]/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}