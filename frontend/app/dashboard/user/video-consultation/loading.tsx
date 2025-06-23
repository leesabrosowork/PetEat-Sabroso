export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Loading Video Consultation</h2>
        <p className="text-gray-600 dark:text-gray-400">Setting up your secure video connection...</p>
      </div>
    </div>
  )
}
