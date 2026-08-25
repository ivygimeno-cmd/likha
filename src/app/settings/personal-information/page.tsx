import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PersonalInformationForm from "./personal-information-form";

export default async function PersonalInformationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "contact_number, address_country, address_province, address_city_municipality, address_barangay, address_lot_unit, address_street, address_postal_code",
    )
    .eq("id", user.id)
    .maybeSingle();

  async function updatePersonalInformation(
    formData: FormData,
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const contactNumber = String(
      formData.get("contactNumber") ?? "",
    ).trim();

    const addressCountry = String(
      formData.get("addressCountry") ?? "Philippines",
    ).trim();

    const addressProvince = String(
      formData.get("addressProvince") ?? "",
    ).trim();

    const addressCityMunicipality = String(
      formData.get("addressCityMunicipality") ?? "",
    ).trim();

    const addressBarangay = String(
      formData.get("addressBarangay") ?? "",
    ).trim();

    const addressLotUnit = String(
      formData.get("addressLotUnit") ?? "",
    ).trim();

    const addressStreet = String(
      formData.get("addressStreet") ?? "",
    ).trim();

    const postalCode = String(
      formData.get("postalCode") ?? "",
    ).trim();

    const { error } = await supabase
      .from("profiles")
      .update({
        contact_number: contactNumber || null,
        address_country:
          addressCountry || "Philippines",
        address_province:
          addressProvince || null,
        address_city_municipality:
          addressCityMunicipality || null,
        address_barangay:
          addressBarangay || null,
        address_lot_unit:
          addressLotUnit || null,
        address_street:
          addressStreet || null,
        address_postal_code:
          postalCode || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw new Error(
        `Hindi ma-update ang personal information: ${error.message}`,
      );
    }

    redirect(
      "/settings/personal-information?updated=1",
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/10 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/settings"
            className="font-serif text-3xl tracking-[0.22em]"
          >
            LIKHA
          </Link>

          <Link
            href="/settings"
            className="text-sm font-medium transition hover:text-[#b76449]"
          >
             Settings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b76449]">
          Account
        </p>

        <h1 className="mt-4 font-serif text-5xl font-normal">
          Personal information
        </h1>

        <p className="mt-5 max-w-2xl leading-7 text-[#173d32]/55">
          Maaari mong baguhin ang iyong address at contact
          number anumang oras.
        </p>

        <section className="mt-10 rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
  <PersonalInformationForm
    action={updatePersonalInformation}
    contactNumber={profile?.contact_number}
    addressProvince={profile?.address_province}
    addressCityMunicipality={
      profile?.address_city_municipality
    }
    addressBarangay={profile?.address_barangay}
    addressLotUnit={profile?.address_lot_unit}
    addressStreet={profile?.address_street}
    addressPostalCode={
      profile?.address_postal_code
    }
  />
</section>
      </div>
    </main>
  );
}