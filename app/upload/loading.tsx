export default function UploadLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="h-7 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-16 flex flex-col items-center gap-4 animate-pulse">
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
        <div className="h-5 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
    </div>
  );
}
