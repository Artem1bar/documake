"use client";

import { useSyncExternalStore } from "react";
import {
  getDocsSnapshot,
  getProfileSnapshot,
  getProfileStoreSnapshot,
  subscribeToStore,
} from "./storage";
import type { BrandProfile, Doc, ProfileStore } from "./types";

const getServerSnapshot = () => null;

/** Reactive doc list; null while server-rendering and hydrating. */
export function useDocs(): Doc[] | null {
  return useSyncExternalStore<Doc[] | null>(
    subscribeToStore,
    getDocsSnapshot,
    getServerSnapshot,
  );
}

/** The active brand profile; null while server-rendering and hydrating. */
export function useProfile(): BrandProfile | null {
  return useSyncExternalStore<BrandProfile | null>(
    subscribeToStore,
    getProfileSnapshot,
    getServerSnapshot,
  );
}

/** Every profile plus the active id; null while server-rendering and hydrating. */
export function useProfileStore(): ProfileStore | null {
  return useSyncExternalStore<ProfileStore | null>(
    subscribeToStore,
    getProfileStoreSnapshot,
    getServerSnapshot,
  );
}
