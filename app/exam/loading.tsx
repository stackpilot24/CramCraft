export default function ExamLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="h-8 w-36 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
