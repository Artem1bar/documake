"use client";

import {
  Field,
  NumberInput,
  SectionCard,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/fields";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import {
  createProfile,
  deleteProfile,
  saveProfile,
  setActiveProfile,
} from "@/lib/storage";
import { useProfileStore } from "@/lib/store-hooks";
import type { BrandProfile } from "@/lib/types";

const CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "CHF",
  "SEK", "NOK", "DKK", "PLN", "CZK", "UAH", "JPY",
] as const;

export default function SettingsPage() {
  const store = useProfileStore();

  if (store === null) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  const profile =
    store.profiles.find((entry) => entry.id === store.activeProfileId) ??
    store.profiles[0];

  const set = <K extends keyof BrandProfile>(
    key: K,
    value: BrandProfile[K],
  ) => {
    saveProfile({ ...profile, [key]: value });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete the profile "${profile.label}"?`)) return;
    deleteProfile(profile.id);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Used to pre-fill every document you create. Changes save
          automatically to this browser.
        </p>
      </div>

      <SectionCard
        title="Profile"
        description="Keep separate details for each company or brand you send documents from."
      >
        <ProfileSwitcher
          store={store}
          onSelect={setActiveProfile}
          onCreate={() => createProfile("New profile")}
          onDelete={handleDelete}
          onRename={(label) => set("label", label)}
        />
      </SectionCard>

      <SectionCard title="Company">
        <Field label="Company name">
          <TextInput
            value={profile.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Weblux AI LLC"
          />
        </Field>
        <Field label="Address" hint="One line per row, as it should appear on documents.">
          <TextArea
            value={profile.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder={"100 Startup Way, Suite 5\nAustin, TX 78701"}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <TextInput
              type="email"
              value={profile.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="hello@company.com"
            />
          </Field>
          <Field label="Phone">
            <TextInput
              value={profile.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
        </div>
        <Field label="Tax / VAT ID">
          <TextInput
            value={profile.taxId}
            onChange={(e) => set("taxId", e.target.value)}
            placeholder="EIN 12-3456789"
          />
        </Field>
      </SectionCard>

      <SectionCard title="Invoicing defaults">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency">
            <SelectInput
              value={profile.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Default tax rate (%)">
            <NumberInput
              value={profile.defaultTaxRate}
              min={0}
              step={0.1}
              onValueChange={(rate) => set("defaultTaxRate", rate)}
            />
          </Field>
          <Field label="Invoice number prefix">
            <TextInput
              value={profile.invoicePrefix}
              onChange={(e) => set("invoicePrefix", e.target.value)}
            />
          </Field>
          <Field label="Next invoice number" hint="Increments automatically with each new invoice.">
            <NumberInput
              value={profile.nextInvoiceNumber}
              min={1}
              step={1}
              onValueChange={(value) =>
                set("nextInvoiceNumber", Math.max(1, Math.round(value)))
              }
            />
          </Field>
          <Field label="Payment terms (days)">
            <NumberInput
              value={profile.paymentTermsDays}
              min={0}
              step={1}
              onValueChange={(value) =>
                set("paymentTermsDays", Math.max(0, Math.round(value)))
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Legal defaults">
        <Field
          label="Governing law"
          hint="Pre-fills new NDAs. For example: the State of Delaware, USA"
        >
          <TextInput
            value={profile.defaultGoverningLaw}
            onChange={(e) => set("defaultGoverningLaw", e.target.value)}
            placeholder="the State of Delaware, USA"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
