export default function StatsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
    </div>
  );
}
