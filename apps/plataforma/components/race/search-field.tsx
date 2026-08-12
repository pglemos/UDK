"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchField({
  name = "q",
  defaultValue = "",
  placeholder = "Buscar",
  debounceMs = 300,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) params.set(name, trimmed);
      else params.delete(name);
      params.delete("page"); // toda nova busca volta para a primeira página
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, name, pathname, router, searchParams, value]);

  return (
    <label className="race-search-field">
      <Search aria-hidden="true" />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
      />
    </label>
  );
}
