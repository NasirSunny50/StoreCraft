export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PER_PAGE = 10;

export type PageParams = {
  page: number;
  perPage: number;
  skip: number;
  take: number;
};

/**
 * Parse offset-pagination values out of search params. Defaults to the `page`
 * + `perPage` keys, but custom keys let multiple independent paginators live on
 * the same page (e.g. `logPage` + `logPerPage`).
 */
export function parsePageParams(
  sp: Record<string, string | undefined>,
  keys: { page?: string; perPage?: string } = {},
): PageParams {
  const pageKey = keys.page ?? "page";
  const perPageKey = keys.perPage ?? "perPage";
  let perPage = Number(sp[perPageKey]);
  if (!PER_PAGE_OPTIONS.includes(perPage as (typeof PER_PAGE_OPTIONS)[number])) {
    perPage = DEFAULT_PER_PAGE;
  }
  let page = Math.floor(Number(sp[pageKey]));
  if (!Number.isFinite(page) || page < 1) page = 1;
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}
