import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://tour-firemai.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await supabase
    .from("tours")
    .select("id, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1000);

  const tourPages: MetadataRoute.Sitemap = ((res.data ?? []) as Array<{ id: number; updated_at: string }>).map((tour) => ({
    url: `${BASE_URL}/tours/${tour.id}`,
    lastModified: new Date(tour.updated_at),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/tours`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    ...tourPages,
  ];
}
