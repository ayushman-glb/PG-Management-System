import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";
import { searchService } from "@services/search.service";

export function useSearch(initialQuery: string = "", delay: number = 300) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, delay);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    searchService
      .globalSearch(debouncedQuery)
      .then((data: any) => setResults(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return { query, setQuery, debouncedQuery, results, loading };
}
