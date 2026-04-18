export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 lg:p-8">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6">
            <div className="skeleton h-10 w-10 rounded-xl mb-4" />
            <div className="skeleton h-7 w-20 rounded mb-2" />
            <div className="skeleton h-4 w-28 rounded" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="skeleton h-4 w-32 rounded mb-5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
