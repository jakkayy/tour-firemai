"use client";

import { useState } from "react";
import ImagePlaceholder from "./ImagePlaceholder";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  // For the placeholder shown if the picture does not load
  countries?: string[];
};

export default function TourImage({ src, alt, priority, countries = [] }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) return <ImagePlaceholder countries={countries} />;

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}
