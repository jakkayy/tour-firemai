import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl bg-white overflow-hidden shadow-sm">
      <div className="aspect-[4/3] bg-zinc-200 animate-pulse" />
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-zinc-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-zinc-200 rounded animate-pulse" />
        <div className="flex items-end justify-between mt-auto pt-2">
          <div className="space-y-1">
            <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
            <div className="h-6 w-24 bg-zinc-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-zinc-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      <Navbar />

      {/* Hero skeleton */}
      <div className="min-h-[500px] bg-gradient-to-b from-slate-900 via-blue-950 to-teal-950 flex items-center justify-center">
        <div className="text-center w-full max-w-3xl px-4 space-y-4">
          <div className="h-3 w-40 bg-white/20 rounded-full mx-auto animate-pulse" />
          <div className="h-12 w-80 bg-white/20 rounded-xl mx-auto animate-pulse" />
          <div className="h-5 w-64 bg-white/10 rounded mx-auto animate-pulse" />
          <div className="flex gap-2 max-w-xl mx-auto mt-6">
            <div className="flex-1 h-11 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-11 w-28 bg-teal-500/50 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-zinc-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
