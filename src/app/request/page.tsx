"use client";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { FormEvent, useState } from "react";

const productTypes = [
  "Custom Apparel",
  "Gifts & Souvenirs",
  "Business Packaging",
  "Print Materials",
  "Digital Design",
  "Iba pa",
];

export default function RequestPage() {
const supabase = createClient();

const [submitted, setSubmitted] = useState(false);
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setLoading(true);
  setErrorMessage("");

  const formData = new FormData(event.currentTarget);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "/login";
    return;
  }

  const minimumBudget = Number(formData.get("minimumBudget"));
  const maximumBudget = Number(formData.get("maximumBudget"));

  if (maximumBudget < minimumBudget) {
    setErrorMessage(
      "Ang maximum budget ay dapat mas mataas sa minimum budget.",
    );
    setLoading(false);
    return;
  }

const { data: newRequest, error: requestError } = await supabase
  .from("project_requests")
  .insert({
    buyer_id: user.id,
    title: String(formData.get("title")),
    product_type: String(formData.get("productType")),
    description: String(formData.get("description")),
    quantity: Number(formData.get("quantity")),
    deadline: String(formData.get("deadline")),
    minimum_budget: minimumBudget,
    maximum_budget: maximumBudget,
    location: String(formData.get("location")),
  })
  .select("id")
  .single();

if (requestError || !newRequest) {
  setErrorMessage(
    requestError?.message ?? "Hindi na-save ang project request.",
  );
  setLoading(false);
  return;
}

const { error: deliveryError } = await supabase
  .from("project_request_delivery_details")
  .insert({
    request_id: newRequest.id,
    buyer_id: user.id,
    recipient_name: String(formData.get("recipientName")),
    contact_number: String(formData.get("contactNumber")),
    address_line: String(formData.get("addressLine")),
    barangay: String(formData.get("barangay")),
    city: String(formData.get("city")),
    province: String(formData.get("province")),
    postal_code: String(formData.get("postalCode") || "") || null,
    delivery_notes: String(formData.get("deliveryNotes") || "") || null,
  });

if (deliveryError) {
  setErrorMessage(
    `Na-create ang request pero hindi na-save ang delivery details: ${deliveryError.message}`,
  );
  setLoading(false);
  return;
}
  setSubmitted(true);
  setLoading(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0e6] px-6 text-[#173d32]">
        <section className="w-full max-w-2xl rounded-3xl border border-[#173d32]/15 bg-[#fbf8f1] p-8 text-center shadow-xl sm:p-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#173d32] text-2xl text-white">
            ✓
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            Request received
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold sm:text-5xl">
            Hahanapan ka namin ng tamang creator.
          </h1>

          <p className="mx-auto mt-5 max-w-lg leading-7 text-[#173d32]/70">
            Kapag live na ang marketplace, makatatanggap dito ang buyer ng
            proposals at quotations mula sa qualified local sellers.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded-md bg-[#b76449] px-7 py-4 font-semibold text-white"
            >
              Gumawa ng panibagong request
            </button>

            <Link
              href="/marketplace"
              className="rounded-md border border-[#173d32] px-7 py-4 font-semibold"
            >
              Bumalik sa Marketplace
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <Link
            href="/marketplace"
            className="text-sm font-semibold hover:text-[#b76449]"
          >
            ← Bumalik sa Marketplace
          </Link>
        </nav>
      </header>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-20">
        <aside>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#b76449]">
            Ipagawa Mo
          </p>

          <h1 className="mt-4 font-serif text-5xl leading-tight font-semibold sm:text-6xl">
            Ano ang gusto mong malikha?
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-[#173d32]/70">
            Ibigay ang project details at ipapakita namin ang request mo sa mga
            creator na may tamang skills at kagamitan.
          </p>

          <div className="mt-10 space-y-6">
            {[
              "Libre ang pag-post ng request",
              "Ikaw ang pipili ng seller",
              "Makukumpara mo ang presyo at timeline",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#173d32] text-sm text-white">
                  ✓
                </span>
                <p className="font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-[#173d32]/15 bg-[#fbf8f1] p-6 shadow-sm sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold"
              >
                Ano ang ipapagawa mo?
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="Halimbawa: Custom shirts para sa company event"
                className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none transition focus:border-[#b76449] focus:ring-2 focus:ring-[#b76449]/15"
              />
            </div>


            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold"
              >
                Project description
              </label>

              <textarea
                id="description"
                name="description"
                required
                rows={6}
                placeholder="Ilagay ang design, kulay, materyales at iba pang importanteng detalye..."
                className="w-full resize-none rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none transition focus:border-[#b76449] focus:ring-2 focus:ring-[#b76449]/15"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-semibold"
                >
                  Quantity
                </label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  placeholder="Halimbawa: 50"
                  className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
                />
              </div>

              <div>
                <label
                  htmlFor="deadline"
                  className="mb-2 block text-sm font-semibold"
                >
                  Kailan kailangan?
                </label>

                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  required
                  className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="minimumBudget"
                  className="mb-2 block text-sm font-semibold"
                >
                  Minimum budget
                </label>

                <div className="flex rounded-lg border border-[#173d32]/20 bg-white focus-within:border-[#b76449]">
                  <span className="px-4 py-4 text-[#173d32]/55">₱</span>
                  <input
                    id="minimumBudget"
                    name="minimumBudget"
                    type="number"
                    min="0"
                    required
                    placeholder="8,000"
                    className="w-full bg-transparent py-4 pr-4 outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="maximumBudget"
                  className="mb-2 block text-sm font-semibold"
                >
                  Maximum budget
                </label>

                <div className="flex rounded-lg border border-[#173d32]/20 bg-white focus-within:border-[#b76449]">
                  <span className="px-4 py-4 text-[#173d32]/55">₱</span>
                  <input
                    id="maximumBudget"
                    name="maximumBudget"
                    type="number"
                    min="0"
                    required
                    placeholder="12,000"
                    className="w-full bg-transparent py-4 pr-4 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-semibold"
              >
                Delivery location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                required
                placeholder="City o province"
                className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
              />
            </div>



<div className="space-y-6 rounded-2xl border border-[#173d32]/15 bg-[#f5f0e6]/60 p-5 sm:p-6">
  <div>
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
      Delivery details
    </p>

    <h2 className="mt-2 font-serif text-2xl font-semibold">
      Saan ipapadala ang finished order?
    </h2>

    <p className="mt-2 text-sm leading-6 text-[#173d32]/65">
      Ang city/province lang ang makikita ng sellers habang open pa ang
      request. Ang buong pangalan, contact number, at address ay magiging
      visible lamang sa seller na tatanggapin mo.
    </p>
  </div>

  <div className="grid gap-6 sm:grid-cols-2">
    <div>
      <label
        htmlFor="recipientName"
        className="mb-2 block text-sm font-semibold"
      >
        Recipient name
      </label>

      <input
        id="recipientName"
        name="recipientName"
        type="text"
        required
        placeholder="Buong pangalan ng tatanggap"
        className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
      />
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
        placeholder="09XXXXXXXXX"
        className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
      />
    </div>
  </div>

  <div>
    <label
      htmlFor="addressLine"
      className="mb-2 block text-sm font-semibold"
    >
      House / Unit / Street
    </label>

    <input
      id="addressLine"
      name="addressLine"
      type="text"
      required
      placeholder="House no., unit, building, street"
      className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
    />
  </div>

  <div className="grid gap-6 sm:grid-cols-2">
    <div>
      <label
        htmlFor="barangay"
        className="mb-2 block text-sm font-semibold"
      >
        Barangay
      </label>

      <input
        id="barangay"
        name="barangay"
        type="text"
        required
        className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
      />
    </div>

    <div>
      <label
        htmlFor="city"
        className="mb-2 block text-sm font-semibold"
      >
        City / Municipality
      </label>

      <input
        id="city"
        name="city"
        type="text"
        required
        className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
      />
    </div>
  </div>

  <div className="grid gap-6 sm:grid-cols-2">
    <div>
      <label
        htmlFor="province"
        className="mb-2 block text-sm font-semibold"
      >
        Province
      </label>

      <input
        id="province"
        name="province"
        type="text"
        required
        className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
      />
    </div>

    <div>
      <label
        htmlFor="postalCode"
        className="mb-2 block text-sm font-semibold"
      >
        Postal code
      </label>

      <input
        id="postalCode"
        name="postalCode"
        type="text"
        placeholder="Optional"
        className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
      />
    </div>
  </div>

  <div>
    <label
      htmlFor="deliveryNotes"
      className="mb-2 block text-sm font-semibold"
    >
      Delivery notes
    </label>

    <textarea
      id="deliveryNotes"
      name="deliveryNotes"
      rows={3}
      placeholder="Landmark, gate instructions, preferred receiving hours, etc."
      className="w-full resize-none rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
    />
  </div>

  <div>
    <label
      htmlFor="location"
      className="mb-2 block text-sm font-semibold"
    >
      Public delivery location
    </label>

    <input
      id="location"
      name="location"
      type="text"
      required
      placeholder="Halimbawa: Iloilo City"
      className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-4 outline-none focus:border-[#b76449]"
    />

    <p className="mt-2 text-xs leading-5 text-[#173d32]/55">
      Ito lang ang location na makikita ng sellers bago ka pumili ng proposal.
    </p>
  </div>
</div>
{errorMessage && (
  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
    {errorMessage}
  </p>
)}
            <label className="flex items-start gap-3 rounded-xl bg-[#f5f0e6] p-4">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 accent-[#b76449]"
              />

              <span className="text-sm leading-6 text-[#173d32]/70">
                Kinukumpirma kong tama ang project details at maaari itong
                makita ng verified Likha sellers.
              </span>
            </label>

 <button
  type="submit"
  disabled={loading}
  className="w-full rounded-lg bg-[#b76449] px-7 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-60"
>
  {loading ? "Sine-save ang request..." : "I-post ang Request →"}
</button>
          </form>
        </section>
      </div>
    </main>
  );
}