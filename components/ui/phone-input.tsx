"use client";

import { useMemo, useState } from "react";

/**
 * Phone entry with a country-code dropdown. Defaults to Bangladesh (+880) and
 * lets a BD number be typed in the local 11-digit form (01XXXXXXXXX). The value
 * actually submitted is carried by a hidden input named `name`:
 *   • Bangladesh → the local digits as typed (01XXXXXXXXX), so existing
 *     BD-normalisation/login matching keeps working.
 *   • Other countries → dial code + digits (e.g. +9198…), for completeness.
 */
type Country = { code: string; dial: string; flag: string; name: string; digits: number };

const COUNTRIES: Country[] = [
  { code: "BD", dial: "+880", flag: "🇧🇩", name: "Bangladesh", digits: 11 },
  { code: "IN", dial: "+91", flag: "🇮🇳", name: "India", digits: 10 },
  { code: "PK", dial: "+92", flag: "🇵🇰", name: "Pakistan", digits: 10 },
  { code: "NP", dial: "+977", flag: "🇳🇵", name: "Nepal", digits: 10 },
  { code: "LK", dial: "+94", flag: "🇱🇰", name: "Sri Lanka", digits: 9 },
  { code: "MY", dial: "+60", flag: "🇲🇾", name: "Malaysia", digits: 10 },
  { code: "SG", dial: "+65", flag: "🇸🇬", name: "Singapore", digits: 8 },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE", digits: 9 },
  { code: "SA", dial: "+966", flag: "🇸🇦", name: "Saudi Arabia", digits: 9 },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "UK", digits: 10 },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "USA", digits: 10 },
];

const BD = COUNTRIES[0]!;

/** Best-effort split of a stored value into a country + local digits. */
function parseDefault(v?: string): { code: string; number: string } {
  const raw = (v ?? "").trim();
  if (!raw) return { code: "BD", number: "" };
  if (raw.startsWith("+")) {
    const match = [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => raw.startsWith(c.dial));
    if (match) return { code: match.code, number: raw.slice(match.dial.length).replace(/\D/g, "") };
  }
  return { code: "BD", number: raw.replace(/\D/g, "") };
}

export function PhoneInput({
  name,
  defaultValue,
  required,
  id,
  testId,
  placeholder = "01XXXXXXXXX",
  className,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  id?: string;
  testId?: string;
  placeholder?: string;
  className?: string;
}) {
  const init = useMemo(() => parseDefault(defaultValue), [defaultValue]);
  const [code, setCode] = useState(init.code);
  const [number, setNumber] = useState(init.number);
  const country = COUNTRIES.find((c) => c.code === code) ?? BD;

  // BD keeps its local form; others carry the dial code so the number is complete.
  const submitValue = number === "" ? "" : code === "BD" ? number : `${country.dial}${number}`;

  return (
    <div
      className={
        "flex items-stretch overflow-hidden rounded border border-hairline-strong bg-surface focus-within:border-accent " +
        (className ?? "")
      }
    >
      <input type="hidden" name={name} value={submitValue} />
      <select
        aria-label="Country code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        data-testid={testId ? `${testId}-country` : undefined}
        className="border-r border-hairline-strong bg-surface-2 px-2 text-sm outline-none"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        required={required}
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, country.digits))}
        placeholder={placeholder}
        data-testid={testId}
        className="min-w-0 flex-1 bg-surface px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}
