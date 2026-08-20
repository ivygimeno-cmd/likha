"use client";

import { useEffect, useMemo, useState } from "react";

type LocationItem = {
  code: string;
  name: string;
};

type AddressFormProps = {
  defaultProvince?: string | null;
  defaultCityMunicipality?: string | null;
  defaultBarangay?: string | null;
  defaultLotUnit?: string | null;
  defaultStreet?: string | null;
  defaultPostalCode?: string | null;
};
function extractItems(payload: unknown): LocationItem[] {
  let source: unknown[] = [];

  if (Array.isArray(payload)) {
    source = payload;
  } else if (
    payload &&
    typeof payload === "object" &&
    "data" in payload
  ) {
    const data = (payload as { data?: unknown }).data;

    if (Array.isArray(data)) {
      source = data;
    }
  }

  return source
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const value = item as Record<string, unknown>;

      const code = String(value.code ?? "").trim();
      const name = String(value.name ?? "").trim();

      if (!code || !name) {
        return null;
      }

      return {
        code,
        name,
      };
    })
    .filter(
      (item): item is LocationItem => item !== null,
    );
}

export default function AddressForm({
  defaultProvince = null,
  defaultCityMunicipality = null,
  defaultBarangay = null,
  defaultLotUnit = null,
  defaultStreet = null,
  defaultPostalCode = null,
}: AddressFormProps) {
  const [provinces, setProvinces] = useState<
    LocationItem[]
  >([]);

  const [cities, setCities] = useState<
    LocationItem[]
  >([]);

  const [barangays, setBarangays] = useState<
    LocationItem[]
  >([]);

  const [provinceCode, setProvinceCode] =
    useState("");

  const [cityCode, setCityCode] = useState("");

  const [barangayCode, setBarangayCode] =
    useState("");

  const [loadingProvinces, setLoadingProvinces] =
    useState(true);

  const [loadingCities, setLoadingCities] =
    useState(false);

  const [loadingBarangays, setLoadingBarangays] =
    useState(false);

  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvinces(true);

      try {
const response = await fetch("/api/psgc/provinces");

if (!response.ok) {
  console.error(
    "Failed to load provinces:",
    response.status,
  );
  setProvinces([]);
  return;
}

const payload = await response.json();
const items = extractItems(payload);

console.log("Loaded provinces:", items.length);
        setProvinces(
          items.sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } finally {
        setLoadingProvinces(false);
      }
    }

    void loadProvinces();
  }, []);

  useEffect(() => {
    if (!defaultProvince || provinces.length === 0) {
      return;
    }

    const match = provinces.find(
      (province) => province.name === defaultProvince,
    );

    if (match) {
      setProvinceCode(match.code);
    }
  }, [defaultProvince, provinces]);

  useEffect(() => {
    if (!provinceCode) {
      setCities([]);
      setCityCode("");
      setBarangays([]);
      setBarangayCode("");
      return;
    }

    async function loadCities() {
      setLoadingCities(true);

      try {
      const response = await fetch(
  `/api/psgc/cities/${provinceCode}`,
);

        if (!response.ok) {
          setCities([]);
          return;
        }

        const payload = await response.json();
        const items = extractItems(payload);

        setCities(
          items.sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } finally {
        setLoadingCities(false);
      }
    }

    void loadCities();
  }, [provinceCode]);

  useEffect(() => {
    if (
      !defaultCityMunicipality ||
      cities.length === 0
    ) {
      return;
    }

    const match = cities.find(
      (city) =>
        city.name === defaultCityMunicipality,
    );

    if (match) {
      setCityCode(match.code);
    }
  }, [defaultCityMunicipality, cities]);

  useEffect(() => {
    if (!cityCode) {
      setBarangays([]);
      setBarangayCode("");
      return;
    }

    async function loadBarangays() {
      setLoadingBarangays(true);

      try {
      const response = await fetch(
  `/api/psgc/barangays/${cityCode}`,
);

        if (!response.ok) {
          setBarangays([]);
          return;
        }

        const payload = await response.json();
        const items = extractItems(payload);

        setBarangays(
          items.sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } finally {
        setLoadingBarangays(false);
      }
    }

    void loadBarangays();
  }, [cityCode]);

  useEffect(() => {
    if (!defaultBarangay || barangays.length === 0) {
      return;
    }

    const match = barangays.find(
      (barangay) => barangay.name === defaultBarangay,
    );

    if (match) {
      setBarangayCode(match.code);
    }
  }, [defaultBarangay, barangays]);

  const selectedProvince = useMemo(
    () =>
      provinces.find(
        (province) => province.code === provinceCode,
      ),
    [provinceCode, provinces],
  );

  const selectedCity = useMemo(
    () =>
      cities.find((city) => city.code === cityCode),
    [cityCode, cities],
  );

  const selectedBarangay = useMemo(
    () =>
      barangays.find(
        (barangay) => barangay.code === barangayCode,
      ),
    [barangayCode, barangays],
  );

  return (
    <div className="space-y-6">
      <input
        type="hidden"
        name="addressCountry"
        value="Philippines"
      />

      <input
        type="hidden"
        name="addressProvince"
        value={selectedProvince?.name ?? ""}
      />

      <input
        type="hidden"
        name="addressCityMunicipality"
        value={selectedCity?.name ?? ""}
      />

      <input
        type="hidden"
        name="addressBarangay"
        value={selectedBarangay?.name ?? ""}
      />

      <div>
        <label className="mb-2 block text-sm font-medium">
          Country
        </label>

  <select
  id="country"
  name="country"
  defaultValue="Philippines"
  className="w-full cursor-pointer rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449]"
>
  <option value="Philippines">Philippines</option>
</select>

      </div>

      <div>
        <label
          htmlFor="province"
          className="mb-2 block text-sm font-medium"
        >
          Province
        </label>

        <select
          id="province"
          value={provinceCode}
          onChange={(event) => {
            setProvinceCode(event.target.value);
            setCityCode("");
            setBarangayCode("");
          }}
          required
          disabled={loadingProvinces}
          className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449] disabled:opacity-50"
        >
          <option value="">
            {loadingProvinces
              ? "Loading provinces..."
              : "Select province"}
          </option>

          {provinces.map((province) => (
            <option
              key={province.code}
              value={province.code}
            >
              {province.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="cityMunicipality"
          className="mb-2 block text-sm font-medium"
        >
          City / Municipality
        </label>

        <select
          id="cityMunicipality"
          value={cityCode}
          onChange={(event) => {
            setCityCode(event.target.value);
            setBarangayCode("");
          }}
          required
          disabled={!provinceCode || loadingCities}
          className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449] disabled:opacity-50"
        >
          <option value="">
            {loadingCities
              ? "Loading cities and municipalities..."
              : "Select city or municipality"}
          </option>

          {cities.map((city) => (
            <option
              key={city.code}
              value={city.code}
            >
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="barangay"
          className="mb-2 block text-sm font-medium"
        >
          Barangay
        </label>

        <select
          id="barangay"
          value={barangayCode}
          onChange={(event) =>
            setBarangayCode(event.target.value)
          }
          required
          disabled={!cityCode || loadingBarangays}
          className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449] disabled:opacity-50"
        >
          <option value="">
            {loadingBarangays
              ? "Loading barangays..."
              : "Select barangay"}
          </option>

          {barangays.map((barangay) => (
            <option
              key={barangay.code}
              value={barangay.code}
            >
              {barangay.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="addressLotUnit"
            className="mb-2 block text-sm font-medium"
          >
            Lot / House / Unit No.
          </label>

          <input
            id="addressLotUnit"
            name="addressLotUnit"
            type="text"
            defaultValue={defaultLotUnit ?? ""}
            placeholder="Lot 12 Block 4"
            className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449]"
          />
        </div>

        <div>
          <label
            htmlFor="postalCode"
            className="mb-2 block text-sm font-medium"
          >
            Postal code
          </label>

          <input
            id="postalCode"
            name="postalCode"
            type="text"
            inputMode="numeric"
            defaultValue={defaultPostalCode ?? ""}
            placeholder="4114"
            className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449]"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="addressStreet"
          className="mb-2 block text-sm font-medium"
        >
          Street / Subdivision
        </label>

        <input
          id="addressStreet"
          name="addressStreet"
          type="text"
          defaultValue={defaultStreet ?? ""}
          placeholder="Sampaguita Street, Greenwoods"
          className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449]"
        />
      </div>
    </div>
  );
}