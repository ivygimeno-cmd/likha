"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import AddressForm from "./address-form";

type PersonalInformationFormProps = {
  action: (formData: FormData) => void | Promise<void>;

  contactNumber?: string | null;

  addressProvince?: string | null;
  addressCityMunicipality?: string | null;
  addressBarangay?: string | null;
  addressLotUnit?: string | null;
  addressStreet?: string | null;
  addressPostalCode?: string | null;
};

function SaveButton({
  hasChanges,
}: {
  hasChanges: boolean;
}) {
  const { pending } = useFormStatus();

  const disabled = !hasChanges || pending;

  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:bg-[#173d32]/20 disabled:text-[#173d32]/40"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}

export default function PersonalInformationForm({
  action,
  contactNumber,
  addressProvince,
  addressCityMunicipality,
  addressBarangay,
  addressLotUnit,
  addressStreet,
  addressPostalCode,
}: PersonalInformationFormProps) {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <form
      action={action}
      onChange={() => setHasChanges(true)}
      className="space-y-7"
    >
      <AddressForm
        defaultProvince={addressProvince}
        defaultCityMunicipality={addressCityMunicipality}
        defaultBarangay={addressBarangay}
        defaultLotUnit={addressLotUnit}
        defaultStreet={addressStreet}
        defaultPostalCode={addressPostalCode}
      />

      <div>
        <label
          htmlFor="contactNumber"
          className="mb-2 block text-sm font-medium"
        >
          Contact number
        </label>

        <input
          id="contactNumber"
          name="contactNumber"
          type="tel"
          defaultValue={contactNumber ?? ""}
          placeholder="09xxxxxxxxx"
          className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449]"
        />
      </div>

      <div className="border-t border-[#173d32]/10 pt-6">
        <SaveButton hasChanges={hasChanges} />
      </div>
    </form>
  );
}