"use client";

import type { ComponentProps } from "react";
import { track } from "@/lib/analytics";

type Props = ComponentProps<"a"> & { event: string; eventProps?: Record<string, unknown> };

// A plain <a> that reports a click. For server components, which can't attach onClick themselves.
export default function TrackedLink({ event, eventProps, onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        track(event, { ...eventProps, url: rest.href });
        onClick?.(e);
      }}
    />
  );
}
