"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "@/lib/analytics";

// The card's link, as a client component so TourCard itself can stay a server component.
export default function TourCardLink({ tourId, ...rest }: ComponentProps<typeof Link> & { tourId: number }) {
  return <Link {...rest} onClick={() => track("view_tour", { tour_id: tourId })} />;
}
