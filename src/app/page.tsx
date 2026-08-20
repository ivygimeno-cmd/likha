import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const categories = [
  {
    title: "Custom Apparel",
    description: "T-shirts, uniforms, tote bags at embroidered pieces.",
    href: "/marketplace?category=Apparel",
  },
  {
    title: "Gifts & Souvenirs",
    description: "Personalized gifts para sa weddings, birthdays at events.",
    href: "/marketplace?category=Gifts",
  },
  {
    title: "Business Essentials",
    description: "Packaging, stickers at branded materials para sa negosyo.",
    href: "/marketplace?category=Business",
  },
];

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
<main
  id="top"
  className="min-h-screen bg-[#f5f0e6] text-[#173d32]"
>
  <header className="sticky top-0 z-50 border-b border-[#173d32]/15 bg-[#f5f0e6]/95 backdrop-blur">
  <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
<a
  href="#top"
  className="font-serif text-3xl font-semibold tracking-[0.2em]"
>
  LIKHA
</a>

    <div className="flex items-center gap-8">
      <div className="hidden items-center gap-9 text-sm font-medium md:flex">
<a
  href="#marketplace"
  className="hover:text-[#b76449]"
>
  Marketplace
</a>

<a
  href="#how-it-works"
  className="hover:text-[#b76449]"
>
  Paano Gumagana
</a>
      </div>

   <Link
  href={user ? "/dashboard" : "/login"}
  className="rounded-md bg-[#173d32] px-5 py-3 text-sm font-semibold text-[#f5f0e6] transition hover:bg-[#b76449]"
>
  {user ? "Dashboard" : "Mag-sign in"}
</Link>
    </div>
  </nav>
</header>

      <section className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div>
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-[#b76449]">
            Gawang lokal. Para sa iyo.
          </p>

          <h1 className="max-w-3xl font-serif text-6xl leading-[0.98] font-semibold tracking-tight sm:text-7xl lg:text-[86px]">
            May naiisip ka?
            <span className="block italic text-[#b76449]">
              Ipagawa mo.
            </span>
          </h1>

  <p className="mt-8 max-w-2xl text-lg leading-8 text-[#173d32]/75">
            Ikuwento ang gusto mong produkto at makipag-ugnayan sa mga lokal na
            creator na kayang gumawa nito—mula custom apparel hanggang
            personalized gifts at business packaging.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
  href={user ? "/request" : "/login"}
  className="rounded-md bg-[#b76449] px-8 py-4 text-center font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#9f503c]"
>
  Magpagawa →
</Link>

<Link
  href={user ? "/marketplace" : "/login"}
  className="rounded-md border border-[#173d32] px-8 py-4 text-center font-semibold transition hover:bg-[#173d32] hover:text-white"
>
  Maghanap ng Proyekto →
</Link>
          </div>

          <div className="mt-14 flex gap-10 border-t border-[#173d32]/15 pt-7">
            <div>
              <p className="font-serif text-3xl font-semibold">120+</p>
              <p className="mt-1 text-sm text-[#173d32]/65">Local creators</p>
            </div>

            <div>
              <p className="font-serif text-3xl font-semibold">35+</p>
              <p className="mt-1 text-sm text-[#173d32]/65">Creative services</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 -top-6 h-32 w-32 border border-[#b76449]/40" />
          <div className="absolute -bottom-7 -right-5 h-40 w-40 bg-[#d9c6a5]" />

          <div className="relative overflow-hidden rounded-[2rem] bg-[#173d32] p-8 text-[#f5f0e6] shadow-2xl sm:p-12">
            <p className="text-sm uppercase tracking-[0.2em] text-[#d9c6a5]">
              Ipagawa Mo
            </p>

            <h2 className="mt-5 max-w-md font-serif text-4xl leading-tight font-semibold sm:text-5xl">
              Isang request. Maraming malikhaing posibilidad.
            </h2>

            <div className="mt-12 space-y-4">
              {[
                "Ilarawan ang gusto mong ipagawa",
                "Tumanggap ng proposals mula sa creators",
                "Piliin ang alok na swak sa iyo",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 border-b border-white/15 pb-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b76449] text-sm font-bold">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl bg-[#f5f0e6] p-5 text-[#173d32]">
              <p className="text-sm font-semibold text-[#b76449]">
                Sample request
              </p>
              <p className="mt-2 font-serif text-xl font-semibold">
                “Kailangan ko ng 50 custom shirts para sa company event.”
              </p>
              <p className="mt-3 text-sm text-[#173d32]/65">
                Budget: ₱8,000–₱12,000 · Needed in 3 weeks
              </p>
            </div>
          </div>
        </div>
      </section>
<section
  id="marketplace"
  className="scroll-mt-32 border-t border-[#173d32]/15 bg-[#fbf8f1] px-6 py-20 lg:px-10"
>
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
                Tuklasin
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
                Ano ang gusto mong ipagawa?
              </h2>
            </div>

     <Link
  href="/marketplace"
  className="hidden font-semibold text-[#b76449] sm:block"
>
  Tingnan lahat →
</Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.title}
                className="group min-h-64 rounded-2xl border border-[#173d32]/15 bg-[#f5f0e6] p-7 transition hover:-translate-y-1 hover:border-[#b76449]"
              >
                <h3 className="mt-12 font-serif text-3xl font-semibold">
                  {category.title}
                </h3>
                <p className="mt-4 leading-7 text-[#173d32]/65">
                  {category.description}
                </p>
  <Link
  href={category.href}
  className="mt-6 inline-block font-semibold text-[#b76449] hover:text-[#9f503c]"
>
  Explore →
</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 bg-[#173d32] px-6 py-24 text-[#f5f0e6] lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d9c6a5]">
                Paano Gumagana
              </p>

              <h2 className="mt-4 max-w-2xl font-serif text-5xl leading-tight font-semibold sm:text-6xl">
                Mula idea hanggang
                <span className="block italic text-[#d27a5c]">
                  finished product.
                </span>
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-white/65 lg:justify-self-end">
              I-post ang gusto mong ipagawa, ikumpara ang proposals ng local
              creators, at pamahalaan ang buong project sa loob ng LIKHA.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                number: "01",
                title: "I-post ang request",
                description:
                  "Ilarawan ang produkto, budget, quantity, location, at deadline na kailangan mo.",
              },
              {
                number: "02",
                title: "Tumanggap ng proposals",
                description:
                  "Makakatanggap ka ng presyo, delivery time, at proposal mula sa interested creators.",
              },
              {
                number: "03",
                title: "Piliin ang creator",
                description:
                  "Tingnan ang profile, ratings, at reviews bago tanggapin ang proposal na swak sa iyo.",
              },
              {
                number: "04",
                title: "Tapusin ang order",
                description:
                  "Mag-usap sa LIKHA inbox, i-review ang submitted work, at mag-iwan ng rating pagkatapos.",
              },
            ].map((step, index) => (
              <article
                key={step.number}
                className={`group border-white/15 py-10 md:px-8 ${
                  index > 0 ? "border-t md:border-t-0" : ""
                } ${
                  index % 2 !== 0
                    ? "md:border-l"
                    : ""
                } ${
                  index > 0
                    ? "xl:border-l"
                    : ""
                }`}
              >


              <h3 className="font-serif text-3xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-4 leading-7 text-white/60">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}