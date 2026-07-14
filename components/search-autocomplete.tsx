"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, TrendingUp } from "lucide-react";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceFormatted: string;
  comparePriceFormatted: string | null;
  categoryName: string;
};

type Category = { id: string; name: string; slug: string };

/** Highlight the matched substring of a product name. */
function highlight(name: string, q: string) {
  const i = name.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return name;
  return (
    <>
      {name.slice(0, i)}
      <mark className="bg-transparent font-semibold text-accent">{name.slice(i, i + q.length)}</mark>
      {name.slice(i + q.length)}
    </>
  );
}

/**
 * Header search with a modern live-suggestions dropdown. Debounced fetch to
 * /api/search/suggestions; keyboard + mouse navigable. Desktop shows a category
 * select; mobile is a compact full-width bar.
 */
export function SearchAutocomplete({
  categories = [],
  variant = "desktop",
}: {
  categories?: Category[];
  variant?: "desktop" | "mobile";
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced fetch of suggestions, cancelling any in-flight request.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setItems(data.suggestions ?? []);
        setActive(-1);
      } catch {
        /* aborted or failed — leave previous items */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goToSearch() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    setOpen(false);
    router.push(`/products?${params.toString()}`);
  }

  function pick(s: Suggestion) {
    setOpen(false);
    setQ("");
    router.push(`/products/${s.slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      if (active >= 0 && items[active]) {
        e.preventDefault();
        pick(items[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const term = q.trim();
  const showDropdown = open && term.length >= 2;

  return (
    <div ref={boxRef} className={`relative ${variant === "desktop" ? "hidden flex-1 lg:block" : "mt-3 lg:hidden"}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch();
        }}
        className="flex h-10 items-stretch overflow-hidden rounded border border-hairline-strong"
      >
        {variant === "desktop" && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className="border-r border-hairline bg-surface-2 px-3 text-xs text-ink"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          placeholder={variant === "desktop" ? "Search for products (e.g. MacBook, headphones)…" : "Search products…"}
          data-testid={variant === "desktop" ? "header-search" : "header-search-mobile"}
          className="min-w-0 flex-1 px-3 text-sm outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex items-center gap-1.5 bg-accent px-4 text-sm font-medium text-white hover:bg-accent-strong sm:px-5"
        >
          <Search className="h-4 w-4" />
          {variant === "desktop" && <span className="hidden sm:inline">Search</span>}
        </button>
      </form>

      {showDropdown && (
        <div
          data-testid="search-suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-hairline bg-surface text-ink shadow-card-hover"
        >
          {loading && items.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted" data-testid="search-no-results">
              No products found for “{term}”.
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto py-1">
              {items.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(s)}
                    data-testid="search-suggestion"
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                      active === i ? "bg-surface-2" : "hover:bg-surface-2"
                    }`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded border border-hairline bg-surface-2">
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.imageUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <Search className="h-4 w-4 text-muted" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm text-ink">{highlight(s.name, term)}</span>
                      <span className="text-[11px] text-muted">{s.categoryName}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold text-accent">{s.priceFormatted}</span>
                      {s.comparePriceFormatted && (
                        <span className="block text-[11px] text-muted line-through">{s.comparePriceFormatted}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={goToSearch}
            className="flex w-full items-center gap-2 border-t border-hairline px-4 py-2.5 text-sm font-medium text-link hover:bg-surface-2"
          >
            <TrendingUp className="h-4 w-4" /> See all results for “{term}”
          </button>
        </div>
      )}
    </div>
  );
}
