"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { attachAutocomplete, type PlaceAddress } from "@/lib/google-places";

export type AddressDraft = PlaceAddress;

export const emptyAddress: AddressDraft = { street: "", unit: "", city: "", state: "", zip: "" };

export const addressComplete = (a: AddressDraft) => a.street.trim() !== "" && a.city.trim() !== "" && /^[A-Z]{2}$/.test(a.state) && /^\d{5}$/.test(a.zip);

// "1 Elm St, Apt 2, Austin, TX 78701" para la solicitud al Agent.
export const addressText = (a: AddressDraft) =>
  [a.street.trim(), a.unit.trim(), a.city.trim(), `${a.state} ${a.zip}`].filter(Boolean).join(", ");

// Dirección nueva con el autocompletado de Google: la sugerencia llena calle, ciudad, estado y ZIP.
// Sin Google los campos se completan a mano; cada campo marca su error recién al salir de él.
export function AddressField({ value, onChange }: { value: AddressDraft; onChange: (value: AddressDraft) => void }) {
  const t = useTranslations("Profile.addressForm");
  const street = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof AddressDraft, boolean>>>({});
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  });

  useEffect(() => {
    if (!street.current) return;
    void attachAutocomplete(street.current, (place) => latest.current.onChange({ ...place, unit: place.unit || latest.current.value.unit }));
  }, []);

  const set = (key: keyof AddressDraft, next: string) => onChange({ ...value, [key]: next });
  const wrong = {
    street: touched.street === true && !value.street.trim(),
    city: touched.city === true && !value.city.trim(),
    state: touched.state === true && !/^[A-Z]{2}$/.test(value.state),
    zip: touched.zip === true && !/^\d{5}$/.test(value.zip),
  };

  return (
    <div
      className="flex flex-col gap-3"
      onBlur={(e) => {
        const key = ({ "change-address": "street", "change-city": "city", "change-state": "state", "change-zip": "zip" } as const)[e.target.id as "change-address"];
        if (key) setTouched((prev) => ({ ...prev, [key]: true }));
      }}
    >
      <Field label={t("street")} htmlFor="change-address">
        <Input
          id="change-address"
          ref={street}
          value={value.street}
          maxLength={120}
          autoComplete="off"
          placeholder={t("streetPlaceholder")}
          aria-invalid={wrong.street}
          onChange={(e) => set("street", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_1.4fr_.7fr_.9fr]">
        <Small id="change-unit" label={t("unit")} value={value.unit} placeholder={t("optional")} onChange={(v) => set("unit", v)} max={30} />
        <Small id="change-city" label={t("city")} value={value.city} onChange={(v) => set("city", v)} max={60} invalid={wrong.city} />
        <Small id="change-state" label={t("state")} value={value.state} placeholder="TX" onChange={(v) => set("state", v.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2))} max={2} invalid={wrong.state} />
        <Small id="change-zip" label={t("zip")} value={value.zip} placeholder="78701" inputMode="numeric" onChange={(v) => set("zip", v.replace(/\D/g, "").slice(0, 5))} max={5} invalid={wrong.zip} />
      </div>
      {(wrong.street || wrong.city || wrong.state || wrong.zip) && <InlineMessage>{t("incomplete")}</InlineMessage>}
    </div>
  );
}

function Small({ id, label, value, onChange, placeholder, max, invalid, inputMode }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; max: number; invalid?: boolean; inputMode?: "numeric" }) {
  return (
    <Field label={label} htmlFor={id}>
      <Input id={id} value={value} maxLength={max} placeholder={placeholder} inputMode={inputMode} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
