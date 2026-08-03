import { useState, useEffect } from "react";
import { residentService } from "@services/resident.service";
import type { Resident } from "@types";

export function useResident(residentId?: string) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [currentResident, setCurrentResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (residentId) {
      residentService
        .getResidentById(residentId)
        .then((data) => setCurrentResident(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      residentService
        .getResidents()
        .then((data) => setResidents(data.residents || data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [residentId]);

  return { residents, currentResident, loading, setResidents };
}
