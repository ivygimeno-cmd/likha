import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";
import BuyCreditsButton from "./buy-credits-button";

type CreditBalance = {
  balance: number | string;
};

type CreditTransaction = {
  id: number;
  amount: number;
  entry_type: string;
  description: string | null;
  created_at: string;
};

const creditBundles = [
  {
    code: "starter",
    name: "Starter",
    credits: 50,
    price: 99,
    description:
      "Para sa sellers na gustong sumubok ng ilang bagong projects.",
  },
  {
    code: "creator",
    name: "Creator",
    credits: 120,
    price: 199,
    description:
      "Mas maraming credits para sa active LIKHA creators.",
    featured: true,
  },
  {
    code: "studio",
    name: "Studio",
    credits: 300,
    price: 449,
    description:
      "Para sa studios at sellers na regular na nagpapadala ng proposals.",
  },
];

export default async function CreditsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: balanceData, error: balanceError },
    { data: transactionData, error: transactionError },
  ] = await Promise.all([
    supabase
      .rpc("get_my_likha_credit_balance")
      .maybeSingle(),

    supabase
      .from("likha_credit_ledger")
      .select(
        "id, amount, entry_type, description, created_at",
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(20),
  ]);

  const creditBalance = Number(
    (balanceData as CreditBalance | null)?.balance ?? 0,
  );

  const transactions =
    (transactionData ?? []) as CreditTransaction[];

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <AuthenticatedNavbar />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <section className="grid gap-8 border-b border-[#173d32]/15 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="mt-3 max-w-3xl font-serif text-5xl font-semibold leading-tight sm:text-6xl">
              Mas maraming pagkakataong makahanap ng proyekto.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#173d32]/65">
              Gamitin ang LIKHA Credits sa pagpapadala ng
              proposals at sa iba pang premium creator tools.
            </p>
          </div>

          <aside className="min-w-72 rounded-2xl bg-[#173d32] p-7 text-[#f5f0e6]">
            <p className="text-sm uppercase tracking-[0.18em] text-[#d9c6a5]">
              Available balance
            </p>

            <p className="mt-3 font-serif text-5xl font-semibold">
              {creditBalance.toLocaleString("en-PH")}
            </p>

            <p className="mt-1 text-sm text-white/55">
              LIKHA Credits
            </p>
          </aside>
        </section>

        {balanceError && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Hindi makuha ang credit balance:{" "}
            {balanceError.message}
          </div>
        )}

        <section className="py-12">
          <div>
            <h2 className="mt-2 font-serif text-4xl font-semibold">
              Piliin ang bagay sa iyong paggawa.
            </h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {creditBundles.map((bundle) => (
              <article
                key={bundle.code}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  bundle.featured
                    ? "border-[#b76449] bg-[#fbf8f1] shadow-lg"
                    : "border-[#173d32]/15 bg-[#fbf8f1]"
                }`}
              >
                {bundle.featured && (
                  <span className="absolute right-5 top-5 rounded-full bg-[#b76449] px-3 py-1.5 text-xs font-semibold text-white">
                    Pinakasulit
                  </span>
                )}

                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b76449]">
                  {bundle.name}
                </p>

                <p className="mt-6 font-serif text-6xl font-semibold">
                  {bundle.credits}
                </p>

                <p className="mt-1 text-sm text-[#173d32]/55">
                  LIKHA Credits
                </p>

                <p className="mt-6 min-h-14 leading-7 text-[#173d32]/65">
                  {bundle.description}
                </p>

                <div className="mt-8 border-t border-[#173d32]/15 pt-6">
                  <p className="font-serif text-4xl font-semibold">
                    ₱{bundle.price.toLocaleString("en-PH")}
                  </p>

                  <p className="mt-1 text-xs text-[#173d32]/45">
                    One-time credit purchase
                  </p>

                  <BuyCreditsButton
                    bundleCode={bundle.code}
                    credits={bundle.credits}
                    price={bundle.price}
                    featured={bundle.featured === true}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-[#173d32]/15 py-12">
          <h2 className="mt-2 font-serif text-4xl font-semibold">
            Transaction History
          </h2>

          <p className="mt-3 text-[#173d32]/60">
            Makikita rito ang binili, natanggap, ginamit, at
            na-refund na LIKHA Credits.
          </p>

          {transactionError && (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Hindi makuha ang transaction history:{" "}
              {transactionError.message}
            </p>
          )}

          {!transactionError && transactions.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-8 text-center">
              <p className="font-serif text-2xl font-semibold">
                Wala pang credit activity.
              </p>

              <p className="mt-2 text-sm text-[#173d32]/55">
                Lalabas dito ang iyong purchases at paggamit ng
                credits.
              </p>
            </div>
          ) : (
            <div className="mt-8 max-h-[520px] overflow-y-auto rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
              {transactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="flex flex-col justify-between gap-4 border-b border-[#173d32]/10 px-6 py-5 last:border-b-0 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {transaction.description ??
                        "LIKHA Credits activity"}
                    </p>

                    <p className="mt-1 text-sm capitalize text-[#173d32]/50">
                      {transaction.entry_type.replaceAll("_", " ")}
                    </p>

                    <time className="mt-1 block text-xs text-[#173d32]/45">
                      {new Date(
                        transaction.created_at,
                      ).toLocaleString("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>

                  <p
                    className={`font-serif text-3xl font-semibold ${
                      transaction.amount > 0
                        ? "text-[#173d32]"
                        : "text-[#b76449]"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount.toLocaleString("en-PH")}
                    <span className="ml-2 font-sans text-sm font-normal text-[#173d32]/50">
                      credits
                    </span>
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-8 rounded-3xl bg-[#e9e1d2] p-8 lg:grid-cols-3 lg:p-10">
          <div>
            <p className="font-serif text-2xl font-semibold">
              Proposals
            </p>

            <p className="mt-2 text-sm leading-6 text-[#173d32]/60">
              Gagamit ang seller ng credits kapag nagpapadala
              ng proposal sa buyer request.
            </p>
          </div>

          <div>
            <p className="font-serif text-2xl font-semibold">
              Premium visibility
            </p>

            <p className="mt-2 text-sm leading-6 text-[#173d32]/60">
              Magagamit din later sa proposal at profile
              boosts.
            </p>
          </div>

          <div>
            <p className="font-serif text-2xl font-semibold">
              Hindi cash
            </p>

            <p className="mt-2 text-sm leading-6 text-[#173d32]/60">
              Hindi withdrawable o transferable ang LIKHA
              Credits.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}