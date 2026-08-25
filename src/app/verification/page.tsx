import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StartVerificationButton from "./start-verification-button";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";

type IdentityVerification = {
  is_verified: boolean;
  verified_at: string | null;
};

export default async function VerificationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: verificationData } =
    await supabase
      .rpc(
        "get_public_identity_verification",
        {
          p_profile_id: user.id,
        },
      )
      .maybeSingle();

  const verification =
    verificationData as
      | IdentityVerification
      | null;

  const isVerified =
    verification?.is_verified === true;

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
    <AuthenticatedNavbar />

      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-16">
        {isVerified ? (
          <section className="rounded-3xl bg-[#173d32] p-8 text-[#f5f0e6] sm:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              ✓ Identity Verified
            </span>

            <h1 className="mt-6 font-serif text-5xl font-semibold">
              Verified na ang iyong identity.
            </h1>

            <p className="mt-5 max-w-2xl leading-8 text-white/70">
              Makikita na ang Identity Verified
              badge sa iyong profile, proposals, at
              request details.
            </p>

            <Link
              href={`/profile/${user.id}`}
              className="mt-8 inline-flex rounded-lg bg-[#b76449] px-6 py-4 font-semibold text-white"
            >
              Tingnan ang Profile 
            </Link>
          </section>
        ) : (
          <section className="grid overflow-hidden rounded-3xl border border-[#173d32]/15 bg-[#fbf8f1] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-[#173d32] p-8 text-[#f5f0e6] sm:p-12">
              <span className="inline-flex rounded-full bg-[#b76449] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em]">
                Optional verification
              </span>

              <h1 className="mt-7 font-serif text-5xl leading-tight font-semibold">
                Patunay ng tunay na pagkakakilanlan.
              </h1>

              <p className="mt-5 leading-8 text-white/70">
                Ang verification badge ay tumutulong
                sa buyers at sellers na magkaroon ng
                mas malinaw na trust signal bago
                makipagtransaksyon.
              </p>

              <div className="mt-9 space-y-5">
                <div className="border-t border-white/15 pt-5">
                  <p className="font-semibold">
                    Government ID
                  </p>

                  <p className="mt-1 text-sm leading-6 text-white/60">
                    Passport, national ID, o
                    driver&apos;s license.
                  </p>
                </div>

                <div className="border-t border-white/15 pt-5">
                  <p className="font-semibold">
                    Selfie at liveness
                  </p>

                  <p className="mt-1 text-sm leading-6 text-white/60">
                    Para makumpirmang totoong tao at
                    tugma sa ID holder.
                  </p>
                </div>

                <div className="border-t border-white/15 pt-5">
                  <p className="font-semibold">
                    Secure processing
                  </p>

                  <p className="mt-1 text-sm leading-6 text-white/60">
                    Hindi ipinapakita sa buyers o
                    sellers ang ID at selfie.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Bago magsimula
              </p>

              <h2 className="mt-3 font-serif text-4xl font-semibold">
                Ihanda ang mga ito
              </h2>

              <ul className="mt-7 space-y-4 text-sm leading-7 text-[#173d32]/70">
                <li>
                  • Valid at hindi expired na
                  government ID
                </li>

                <li>
                  • Phone o device na may malinaw na
                  camera
                </li>

                <li>
                  • Maliwanag na lugar at walang
                  takip ang mukha
                </li>

                <li>
                  • Ilang minutong tuloy-tuloy na
                  oras
                </li>
              </ul>

              <div className="mt-7 rounded-xl border border-[#173d32]/15 bg-[#f5f0e6] p-4 text-sm leading-6 text-[#173d32]/65">
                Ang LIKHA ay nagse-save lamang ng
                verification status, provider
                reference, consent record, at
                verification date—hindi ang iyong ID
                image o selfie.
              </div>

              <StartVerificationButton />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}