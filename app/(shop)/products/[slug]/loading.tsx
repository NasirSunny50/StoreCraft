import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="space-y-24">
      <Skeleton className="h-3 w-40" />
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full max-w-sm" />
          <Skeleton className="h-11 w-full max-w-sm" />
        </div>
      </div>
    </div>
  );
}
