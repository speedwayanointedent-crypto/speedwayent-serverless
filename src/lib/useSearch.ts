"use client";

import { useEffect, useMemo, useState } from "react";
import { search, SearchResult } from "./search";
import { useDebounce } from "./useDebounce";

type Opts = {
  fields: string[];
  debounceMs?: number;
  keepResultsOnEmpty?: boolean;
};

export function useSearch<T>(data: T[], opts: Opts) {
  const { fields, debounceMs = 300, keepResultsOnEmpty = true } = opts;
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, debounceMs);

  const results: SearchResult<T>[] = useMemo(() => search(data, debounced, { fields }), [data, debounced, fields]);

  return {
    query,
    setQuery,
    debouncedQuery: debounced,
    results,
    items: results.map((r) => r.item),
    isSearching: debounced.length > 0,
    clearSearch: () => setQuery(""),
    totalResults: keepResultsOnEmpty ? (debounced ? results.length : data.length) : results.length,
  };
}

export function useFilteredSearch<T>(data: T[], opts: Opts & { filterFn?: (item: T) => boolean; sortFn?: (a: T, b: T) => number }) {
  const { filterFn, sortFn, ...rest } = opts;
  const filtered = useMemo(() => {
    let out = data;
    if (filterFn) out = out.filter(filterFn);
    if (sortFn) out = [...out].sort(sortFn);
    return out;
  }, [data, filterFn, sortFn]);
  const search = useSearch(filtered, rest);
  return { ...search, all: filtered };
}
