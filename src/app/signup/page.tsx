"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TERMS_VERSION = "2.0";
const PRIVACY_VERSION = "1.0";

function normalizePhilippineMobile(
  value: string,
): string | null {
  const digits = value.replace(/\D/g, "");

  if (/^09\d{9}$/.test(digits)) {
    return `+63${digits.slice(1)}`;
  }

  if (/^639\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^9\d{9}$/.test(digits)) {
    return `+63${digits}`;
  }

  return null;
}

function normalizeReferralCode(value: string) {
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!cleaned) {
    return "";
  }

  return cleaned.startsWith("LIKHA-")
    ? cleaned
    : `LIKHA-${cleaned}`;
}

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [referralCode, setReferralCode] =
    useState("");

  useEffect(() => {
    const parameters = new URLSearchParams(
      window.location.search,
    );

    const referralFromUrl =
      parameters.get("ref");

    if (referralFromUrl) {
      setReferralCode(
        normalizeReferralCode(referralFromUrl),
      );
    }
  }, []);

  async function handleSignUp(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget,
    );

    setLoading(true);
    setErrorMessage("");

    const fullName = String(
      formData.get("fullName") ?? "",
    ).trim();

    const email = String(
      formData.get("email") ?? "",
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.get("password") ?? "",
    );

    const role = String(
      formData.get("role") ?? "",
    );

    const rawContactNumber = String(
      formData.get("contactNumber") ?? "",
    );

    const contactNumber =
      normalizePhilippineMobile(
        rawContactNumber,
      );

    const normalizedReferralCode =
      normalizeReferralCode(referralCode);

    const acceptedTerms =
      formData.get("acceptTerms") === "on";

    const acceptedPrivacy =
      formData.get("acceptPrivacy") === "on";

    if (fullName.length < 2) {
      setErrorMessage(
        "Maglagay ng iyong buong pangalan.",
      );
      setLoading(false);
      return;
    }

    if (
      role !== "buyer" &&
      role !== "seller"
    ) {
      setErrorMessage(
        "Pumili ng valid na workspace.",
      );
      setLoading(false);
      return;
    }

    if (!contactNumber) {
      setErrorMessage(
        "Maglagay ng valid Philippine mobile number, halimbawa 09171234567.",
      );
      setLoading(false);
      return;
    }

    if (
      normalizedReferralCode &&
      !/^LIKHA-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(
        normalizedReferralCode,
      )
    ) {
      setErrorMessage(
        "Invalid ang referral code. Dapat katulad ito ng LIKHA-7K3M9P2Q.",
      );
      setLoading(false);
      return;
    }

    if (
      !acceptedTerms ||
      !acceptedPrivacy
    ) {
      setErrorMessage(
        "Kailangan mong tanggapin ang Terms and Conditions at Privacy Policy.",
      );
      setLoading(false);
      return;
    }

    const acceptedAt =
      new Date().toISOString();

    const { error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            contact_number: contactNumber,
            referral_code:
              normalizedReferralCode || null,
            terms_accepted: true,
            terms_version: TERMS_VERSION,
            privacy_accepted: true,
            privacy_version:
              PRIVACY_VERSION,
            legal_acceptance_source:
              "signup",
            legal_acceptance_at:
              acceptedAt,
          },
        },
      });

    if (error) {
      const signupMessage =
        error.message.includes(
          "Database error saving new user",
        )
          ? "Hindi magawa ang account. Posibleng ginagamit na ang contact number o invalid ang referral code."
          : error.message;

      setErrorMessage(signupMessage);
      setLoading(false);
      return;
    }

    setLoading(false);

    router.push(
      `/verify-email?email=${encodeURIComponent(
        email,
      )}`,
    );
  }

  return (
    <main className="grid min-h-screen bg-[#f5f0e6] text-[#173d32] lg:grid-cols-2">
      <section className="hidden bg-[#173d32] p-14 text-[#f5f0e6] lg:flex lg:flex-col lg:justify-between">
        <Link
          href="/"
          className="font-serif text-3xl font-semibold tracking-[0.2em]"
        >
          LIKHA
        </Link>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d9c6a5]">
            Sumali sa Likha
          </p>

          <h1 className="mt-5 max-w-xl font-serif text-6xl leading-tight font-semibold">
            May puwang para sa bawat malikhaing
            ideya.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            Maghanap ng lokal na creator o ialok
            ang iyong sariling paggawa sa mga
            buyer na naghahanap ng personalized
            products.
          </p>

          <div className="mt-9 border-t border-white/15 pt-6">
            <p className="font-serif text-2xl font-semibold text-[#d9c6a5]">
              30 Welcome Credits
            </p>

            <p className="mt-2 max-w-md text-sm leading-6 text-white/60">
              Mag-confirm ng email upang maging
              eligible sa complimentary Welcome
              Credits. Subject muna ito sa account
              review habang beta ang LIKHA.
            </p>
          </div>
        </div>

        <p className="text-sm text-white/45">
          Gawang lokal. Para sa iyo.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-lg">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold tracking-[0.18em] lg:hidden"
          >
            LIKHA
          </Link>

          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449] lg:mt-0">
            Gumawa ng account
          </p>

          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Simulan ang iyong Likha journey.
          </h2>

          <form
            onSubmit={handleSignUp}
            className="mt-9 space-y-5"
          >
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold"
              >
               Buong pangalan / Real name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449]"
                placeholder="Juan Dela Cruz"
              />
              <p className="mt-2 text-xs leading-5 text-[#173d32]/50">
  Use your real name as it appears on your valid ID.
  Minor differences, such as an omitted second given name,
  may be accepted during verification. Once your identity is
  verified, changes to your name must be requested through
  LIKHA Support.
</p>
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-semibold"
              >
                Ano ang gagawin mo sa Likha?
              </label>

              <select
                id="role"
                name="role"
                required
                defaultValue="buyer"
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449]"
              >
                <option value="buyer">
                  Buyer — May ipapagawa ako
                </option>

                <option value="seller">
                  Seller — Tatanggap ako ng
                  projects
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="contactNumber"
                className="mb-2 block text-sm font-semibold"
              >
                Contact number
              </label>

              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="09171234567"
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449]"
              />

              <p className="mt-2 text-xs leading-5 text-[#173d32]/50">
                Isang LIKHA account lang ang
                maaaring gumamit ng bawat contact
                number. Hindi ito ipapakita sa
                public profile. Hindi pa ito
                verified sa pamamagitan ng SMS.
              </p>
            </div>

            <div>
              <label
                htmlFor="referralCode"
                className="mb-2 block text-sm font-semibold"
              >
                Referral code{" "}
                <span className="font-normal text-[#173d32]/45">
                  (optional)
                </span>
              </label>

              <input
                id="referralCode"
                name="referralCode"
                type="text"
                value={referralCode}
                onChange={(event) =>
                  setReferralCode(
                    event.target.value.toUpperCase(),
                  )
                }
                maxLength={14}
                autoComplete="off"
                placeholder="LIKHA-7K3M9P2Q"
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 uppercase outline-none focus:border-[#b76449]"
              />

              <p className="mt-2 text-xs leading-5 text-[#173d32]/50">
                Ang nag-invite sa iyo ay
                makakatanggap ng 30 Credits
                pagkatapos ng iyong unang
                qualifying paid Credit purchase.
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449]"
                placeholder="name@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449]"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="space-y-4 rounded-lg border border-[#173d32]/15 bg-[#fbf8f1] p-4">
              <label className="flex items-start gap-3 text-sm leading-6">
                <input
                  name="acceptTerms"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 accent-[#b76449]"
                />

                <span>
                  Nabasa at tinatanggap ko ang{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#b76449] underline"
                  >
                    Terms and Conditions
                  </Link>
                  .
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm leading-6">
                <input
                  name="acceptPrivacy"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 accent-[#b76449]"
                />

                <span>
                  Nabasa ko ang{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#b76449] underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  at nauunawaan ko kung paano
                  pinoprotektahan at ginagamit ang
                  aking data.
                </span>
              </label>
            </div>

            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#b76449] px-6 py-4 font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Gumagawa ng account..."
                : "Gumawa ng Account →"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#173d32]/65">
            May account ka na?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#b76449]"
            >
              Mag-sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}