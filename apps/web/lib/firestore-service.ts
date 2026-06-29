import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { functions } from "./firebase-functions";
import { db } from "./firebase-firestore";
import { storage } from "./firebase-storage";
import type { BaseRecord } from "./firebase-types";

export type CollectionName =
  | "members"
  | "packages"
  | "payments"
  | "attendance"
  | "trainers"
  | "expenses"
  | "notifications"
  | "settings"
  | "auditLogs";

function serialize(data: DocumentData) {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    output[key] = value && typeof value === "object" && "toDate" in value ? value.toDate().toISOString() : value;
  }

  return output;
}

export function listenCollection<T extends BaseRecord>(
  name: CollectionName,
  onData: (rows: T[]) => void,
  onError: (error: Error) => void,
  constraints: QueryConstraint[] = [orderBy("updatedAt", "desc")]
) {
  return onSnapshot(
    query(collection(db, name), ...constraints),
    (snapshot) => {
      onData(snapshot.docs.map((item) => ({ id: item.id, ...serialize(item.data()) }) as T));
    },
    onError
  );
}

export async function createRecord<T extends Record<string, unknown>>(name: CollectionName, data: T) {
  const now = new Date().toISOString();
  const refDoc = await addDoc(collection(db, name), {
    ...data,
    createdAt: now,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp()
  });
  return refDoc.id;
}

export async function setRecord<T extends Record<string, unknown>>(name: CollectionName, id: string, data: T) {
  const now = new Date().toISOString();
  await setDoc(
    doc(db, name, id),
    {
      ...data,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function updateRecord<T extends Record<string, unknown>>(name: CollectionName, id: string, data: T) {
  await updateDoc(doc(db, name, id), {
    ...data,
    updatedAt: new Date().toISOString(),
    serverUpdatedAt: serverTimestamp()
  });
}

export async function deleteRecord(name: CollectionName, id: string) {
  await deleteDoc(doc(db, name, id));
}

export async function getRecord<T extends BaseRecord>(name: CollectionName, id: string) {
  const snapshot = await getDoc(doc(db, name, id));
  return snapshot.exists() ? ({ id: snapshot.id, ...serialize(snapshot.data()) } as T) : null;
}

export async function uploadFile(path: string, file: File) {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
  const fileRef = ref(storage, `${path}/${safeName}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function audit(action: string, entity: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  try {
    const recordAudit = httpsCallable(functions, "recordAudit");
    await recordAudit({ action, entity, entityId: entityId ?? "", metadata });
  } catch (error) {
    console.warn("Audit logging failed", error);
  }
}
