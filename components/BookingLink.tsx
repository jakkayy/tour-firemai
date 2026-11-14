"use client";

import posthog from "posthog-js";

type Props = {
  href: string;
  tourId: number;
};

export default function BookingLink({ href, tourId }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => posthog.capture("tour_booking_redirected", { tour_id: tourId })}
      className="block w-full text-center bg-slate-800 text-white py-4 rounded-2xl font-semibold text-base hover:bg-slate-700 transition-colors mb-4"
    >
      ดูรายละเอียดและจอง
    </a>
  );
}
