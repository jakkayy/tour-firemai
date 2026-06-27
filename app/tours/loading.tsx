import Navbar from "@/components/Navbar";

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

function SkeletonSidebar() {
  return (
    <aside className="w-56 shrink-0 hidden md:block">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="h-5 w-16 bg-zinc-200 rounded animate-pulse mb-5" />
        {[100, 80, 90].map((w, i) => (
          <div key={i} className="mb-5">
            <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse mb-2" />
            <div className={`h-10 w-full bg-zinc-200 rounded-xl animate-pulse`} />
          </div>
        ))}
        <div className="h-10 w-full bg-zinc-200 rounded-xl animate-pulse" />
      </div>
    </aside>
  );
}

export default function Loading() {
  return (
    <>
      <Navbar />

      <div className="bg-zinc-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-6 space-y-2">
            <div className="h-8 w-56 bg-zinc-200 rounded animate-pulse" />
            <div className="h-4 w-28 bg-zinc-200 rounded animate-pulse" />
          </div>

          <div className="flex gap-7">
            <SkeletonSidebar />
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
