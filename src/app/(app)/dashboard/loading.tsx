export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-4 w-28" />
        </div>
        <div className="skeleton h-9 w-64" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-7 w-7 rounded-lg" />
            </div>
            <div className="skeleton h-8 w-24" />
            <div className="skeleton h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="skeleton h-4 w-32 mb-2" />
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="skeleton h-3 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
