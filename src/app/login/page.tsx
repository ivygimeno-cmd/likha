"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

if (error) {
  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes("banned") ||
    normalizedMessage.includes("suspended")
  ) {
    setErrorMessage(
      "Your account has been suspended from using LIKHA. If you believe this was a mistake, please contact likha.support@gimenodesignsolutions.asia.",
    );
  } else {
    setErrorMessage(error.message);
  }

  setLoading(false);
  return;
}

    router.push("/dashboard");
    router.refresh();
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
        

          <h1 className="mt-5 max-w-xl font-serif text-6xl leading-tight font-semibold">
            Balikan ang mga ideyang nais mong malikha.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            Tingnan ang iyong requests, proposals at kasalukuyang orders sa
            iisang lugar.
          </p>
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

    

          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Maligayang pagbabalik.
          </h2>

          <form onSubmit={handleLogin} className="mt-9 space-y-5">
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
    placeholder="name@email.com"
    className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449]"
  />
</div>

<div>
  <div className="mb-2 flex items-center justify-between">
    <label
      htmlFor="password"
      className="text-sm font-semibold"
    >
      Password
    </label>
  </div>

  <div className="relative">
    <input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      required
      autoComplete="current-password"
      placeholder="Ilagay ang password"
      className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] py-4 pl-4 pr-16 outline-none focus:border-[#b76449]"
    />

    <button
      type="button"
      onClick={() =>
        setShowPassword((current) => !current)
      }
      aria-label={
        showPassword ? "Hide password" : "Show password"
      }
      className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-xs font-semibold text-[#173d32]/45 transition hover:text-[#173d32]"
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  </div>
</div>

 {errorMessage && (
  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
    <p>{errorMessage}</p>

    {errorMessage.includes("suspended from using LIKHA") && (
<a
  href="mailto:likha.support@gimenodesignsolutions.asia"
className="mt-2 inline-block text-xs font-medium text-blue-600 underline underline-offset-2 transition hover:text-blue-800"
>
  Contact LIKHA Support
</a>
    )}
  </div>
)}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#b76449] px-6 py-4 font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Nagsa-sign in..." : "Mag-sign in "}
            </button>
          </form>
<div className="mt-10 space-y-3 text-center">
  <Link
    href="/forgot-password"
    className="block text-sm font-semibold text-[#b76449] transition hover:text-[#9f503c]"
  >
    Nakalimutan ang password?
  </Link>

  <p className="text-sm text-[#173d32]/65">
    Wala ka pang account?{" "}
    <Link
      href="/signup"
      className="font-semibold text-[#b76449]"
    >
      Gumawa ng account
    </Link>
  </p>
</div>
        </div>
      </section>
    </main>
  );
}