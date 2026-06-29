"use client";

import { useEffect, useMemo, useState } from "react";
import type { QueryConstraint } from "firebase/firestore";
import { listenCollection, type CollectionName } from "@/lib/firestore-service";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { BaseRecord } from "@/lib/firebase-types";

type RealtimeCollectionOptions = {
  enabled?: boolean;
};

export function useRealtimeCollection<T extends BaseRecord>(name: CollectionName, constraints?: QueryConstraint[], options: RealtimeCollectionOptions = {}) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const stableConstraints = useMemo(() => constraints, [constraints]);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured()) {
      setData([]);
      setError("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values to .env.local to load live records.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenCollection<T>(
      name,
      (rows) => {
        setData(rows);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      stableConstraints
    );

    return unsubscribe;
  }, [enabled, name, stableConstraints]);

  return { data, loading, error };
}
