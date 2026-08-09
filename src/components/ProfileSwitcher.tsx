"use client";

import type { ProfileStore } from "@/lib/types";
import { Field, SelectInput, TextInput } from "./fields";

interface ProfileSwitcherProps {
  store: ProfileStore;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
}

export function ProfileSwitcher({
  store,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: ProfileSwitcherProps) {
  const active = store.profiles.find(
    (profile) => profile.id === store.activeProfileId,
  );
  // The store guarantees at least one profile, so this is defensive only.
  if (!active) return null;

  const isOnlyProfile = store.profiles.length === 1;

  return (
    <>
      <Field
        label="Active profile"
        hint="New documents use this profile's details and branding."
      >
        <div className="flex gap-2">
          <SelectInput
            value={active.id}
            onChange={(event) => onSelect(event.target.value)}
          >
            {store.profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </SelectInput>
          <button
            type="button"
            onClick={onCreate}
            className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            New
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isOnlyProfile}
            title={
              isOnlyProfile ? "You need at least one profile." : undefined
            }
            className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
          >
            Delete
          </button>
        </div>
      </Field>

      <Field label="Profile name" hint="Only shown here, to tell profiles apart.">
        <TextInput
          value={active.label}
          onChange={(event) => onRename(event.target.value)}
          placeholder="Weblux AI LLC"
        />
      </Field>
    </>
  );
}
