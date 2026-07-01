export default function StatementsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="skeleton h-9 w-32" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="space-y-2">
              <div className="skeleton h-4 w-48" />
              <div className="skeleton h-3 w-32" />
            </div>
            <div className="space-y-2 text-right">
              <div className="skeleton h-4 w-20 ml-auto" />
              <div className="skeleton h-3 w-16 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
