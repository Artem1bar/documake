"use client";

import { useSyncExternalStore } from "react";
import {
  getDocsSnapshot,
  getProfileSnapshot,
  subscribeToStore,
} from "./storage";
import type { CompanyProfile, Doc } from "./types";

const getServerSnapshot = () => null;

/** Reactive doc list; null while server-rendering and hydrating. */
export function useDocs(): Doc[] | null {
  return useSyncExternalStore<Doc[] | null>(
    subscribeToStore,
    getDocsSnapshot,
    getServerSnapshot,
  );
}

/** Reactive company profile; null while server-rendering and hydrating. */
export function useProfile(): CompanyProfile | null {
  return useSyncExternalStore<CompanyProfile | null>(
    subscribeToStore,
    getProfileSnapshot,
    getServerSnapshot,
  );
}
