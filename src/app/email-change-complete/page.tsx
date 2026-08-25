import Link from "next/link";

export default async function EmailChangeCompletePage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  const email = params.email;
  const error = params.error;

  return (
    <main className="min-h-screen bg-[#f5f0e6] px-6 py-16 text-[#173d32]">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="font-serif text-3xl tracking-[0.22em]"
        >
          LIKHA
        </Link>

        <section className="mt-12 rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-8 sm:p-10">
          {error ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Confirmation failed
              </p>

              <h1 className="mt-4 font-serif text-4xl font-normal">
                We couldn’t confirm your new email.
              </h1>

              <p className="mt-5 leading-7 text-[#173d32]/60">
                The confirmation link may be invalid or
                expired. Please return to Email Settings and
                send another confirmation email.
              </p>

              <Link
                href="/settings/email"
                className="mt-7 inline-flex rounded-xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white"
              >
                Return to email settings
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                Email confirmed
              </p>

              <h1 className="mt-4 font-serif text-4xl font-normal">
                Your email has been changed.
              </h1>

              {email && (
                <div className="mt-6 rounded-xl border border-[#173d32]/10 bg-[#f5f0e6] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#173d32]/45">
                    New login email
                  </p>

                  <p className="mt-2 font-medium">
                    {email}
                  </p>
                </div>
              )}

              <p className="mt-6 leading-7 text-[#173d32]/60">
                For security, you have been signed out of
                LIKHA. Sign in again using your new email
                address.
              </p>

              <Link
                href="/login"
                className="mt-7 inline-flex rounded-xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#245646]"
              >
                Sign in with new email 
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}