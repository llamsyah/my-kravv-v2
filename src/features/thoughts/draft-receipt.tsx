"use client";
import { useEffect } from "react";
import {
  clearAcknowledgedDraft,
  clearPrivateDrafts,
  draftEvent,
} from "./drafts";
export function DraftReceipt({
  userId,
  companyId,
  operationId,
  original,
}: {
  userId: string;
  companyId: string;
  operationId: string;
  original: string;
}) {
  useEffect(() => {
    try {
      clearAcknowledgedDraft(
        window.localStorage,
        userId,
        companyId,
        operationId,
        original,
      );
      window.dispatchEvent(new Event(draftEvent));
    } catch {
      /* Retain the draft if storage cannot acknowledge the save. */
    }
  }, [userId, companyId, operationId, original]);
  return null;
}
export function SignedOutDraftCleanup() {
  useEffect(() => {
    try {
      clearPrivateDrafts(window.localStorage);
    } catch {
      /* Account-scoped keys still prevent cross-account display. */
    }
  }, []);
  return null;
}
