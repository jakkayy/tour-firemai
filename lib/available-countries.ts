import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { COUNTRY_LIST, extractCountries } from "@/lib/countries";
import { notDepartedFilter } from "@/lib/tours";

const PAGE = 1000;

// One column of every tour still on offer. Read in pages because a request returns at most 1000 rows,
// and in a fixed order so the pages don't overlap or skip rows. Null when the query fails, e.g.
// because the column doesn't exist yet.
async function listActive<T>(column: "countries" | "title"): Promise<T[] | null> {
  const rows: T[] = [];
  for (let from = 0; from < 50 * PAGE; from += PAGE) {
    const { data, error } = await supabase
      .from("tours")
      .select(column)
      .eq("is_active", true)
      .or(notDepartedFilter())
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return null;
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

// Countries that at least one tour on offer visits, in the order of COUNTRY_LIST. Used for the
// filter on /tours and the search box on the home page, so neither offers a country with no tours.
export const getAvailableCountries = unstable_cache(
  async (): Promise<string[]> => {
    const found = new Set<string>();
    const lists = await listActive<{ countries: string[] | null }>("countries");
    if (lists) {
      lists.forEach((row) => (row.countries ?? []).forEach((country) => found.add(country)));
    } else {
      // No countries column yet (migration 008 not applied): work it out from the titles
      const titles = await listActive<{ title: string }>("title");
      titles?.forEach((row) => extractCountries(row.title).forEach((country) => found.add(country)));
    }
    return COUNTRY_LIST.filter((country) => found.has(country));
  },
  // "v2": the data cache outlives deploys, so a new key avoids serving the old title-based list
  ["available-countries-v2"],
  // The tag lets /api/revalidate refresh this right after a scrape
  { revalidate: 21600, tags: ["tours"] }
);
