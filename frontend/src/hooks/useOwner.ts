import { useState, useEffect } from "react";
import { ownerService } from "@services/owner.service";
import type { Owner } from "@types";

export function useOwner(ownerId?: string) {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (ownerId) {
      ownerService
        .getOnboardingStatus(ownerId)
        .then((data) => setOwner(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [ownerId]);

  return { owner, loading };
}
