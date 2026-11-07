import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { notDepartedFilter } from "@/lib/tours";
import { SITE_URL } from "@/lib/site";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await supabase
    .from("tours")
    .select("id, updated_at")
    .eq("is_active", true)
    .or(notDepartedFilter())
    .order("updated_at", { ascending: false })
    .limit(1000);

  const tourPages: MetadataRoute.Sitemap = ((res.data ?? []) as Array<{ id: number; updated_at: string }>).map((tour) => ({
    url: `${SITE_URL}/tours/${tour.id}`,
    lastModified: new Date(tour.updated_at),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/tours`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    ...tourPages,
  ];
}
