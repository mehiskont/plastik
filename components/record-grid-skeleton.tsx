export function RecordGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-md bg-gray-200 h-64 w-full"></div>
          <div className="mt-2">
            <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded-md mt-1 w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

