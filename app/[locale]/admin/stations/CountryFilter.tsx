'use client';

interface CountryFilterProps {
  countries: { country: string }[];
  currentCountry: string;
}

export function CountryFilter({ countries, currentCountry }: CountryFilterProps) {
  if (countries.length <= 1) return null;

  return (
    <select
      defaultValue={currentCountry}
      onChange={(e) => {
        const url = new URL(window.location.href);
        if (e.target.value) {
          url.searchParams.set('country', e.target.value);
        } else {
          url.searchParams.delete('country');
        }
        window.location.href = url.toString();
      }}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none"
    >
      <option value="">Barcha davlatlar</option>
      {countries.map((c) => (
        <option key={c.country} value={c.country}>{c.country}</option>
      ))}
    </select>
  );
}
