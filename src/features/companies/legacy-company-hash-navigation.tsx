"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { legacyThoughtHashDestination } from "./legacy-navigation";

/** Compatibility only: no data access, draft manipulation or action replay. */
export function LegacyCompanyHashNavigation({
  companyId,
}: {
  companyId: string;
}) {
  const router = useRouter();
  useEffect(() => {
    const dispatch = () => {
      const destination = legacyThoughtHashDestination(
        companyId,
        window.location.hash,
      );
      if (destination) router.replace(destination);
    };
    dispatch();
    window.addEventListener("hashchange", dispatch);
    return () => window.removeEventListener("hashchange", dispatch);
  }, [companyId, router]);
  return null;
}
