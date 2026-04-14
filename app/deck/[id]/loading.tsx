export default function DeckLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-7 w-56 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
