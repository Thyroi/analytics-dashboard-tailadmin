export default function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((k) => (
        <div key={k} className="card">
          <div className="card-body">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded bg-gray-200 dark:bg-white/10"
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
