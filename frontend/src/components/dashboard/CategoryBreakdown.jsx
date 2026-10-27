import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatMoney } from '../../utils/format'
import Alert from '../Alert'
import Card from '../Card'
import Spinner from '../Spinner'

const COLORS = [
    '#4f46e5',
    '#0891b2',
    '#16a34a',
    '#ca8a04',
    '#dc2626',
    '#9333ea',
    '#db2777',
    '#ea580c',
    '#64748b',
]

const TABS = [
    { type: 'EXPENSE', label: 'Expenses' },
    { type: 'INCOME', label: 'Income' },
]

// data is a CategorySummaryResponse { month, type, total, items: [{ categoryId, categoryName, amount, percentage }] }
export default function CategoryBreakdown({
                                              type,
                                              onTypeChange,
                                              monthLabel,
                                              loading,
                                              error,
                                              data,
                                              onRetry,
                                          }) {
    const typeLabel = type === 'EXPENSE' ? 'expenses' : 'income'
    const items = (data?.items ?? []).map((item) => ({ ...item, amount: Number(item.amount) }))

    return (
        <Card title="By category" description={monthLabel}>
            <div className="mb-5 inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
                {TABS.map((tab) => (
                    <button
                        key={tab.type}
                        role="tab"
                        aria-selected={type === tab.type}
                        onClick={() => onTypeChange(tab.type)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                            type === tab.type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <Spinner label="Loading breakdown..." />}

            {!loading && error && (
                <div className="space-y-3">
                    <Alert type="error">{error}</Alert>
                    <button
                        onClick={onRetry}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && data && items.length === 0 && (
                <p className="text-sm text-slate-500">
                    No {typeLabel} recorded in {monthLabel}.
                </p>
            )}

            {!loading && !error && items.length > 0 && (
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div
                        className="h-56 w-56 shrink-0"
                        role="img"
                        aria-label={`Donut chart of ${typeLabel} by category for ${monthLabel}`}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={items}
                                    dataKey="amount"
                                    nameKey="categoryName"
                                    innerRadius="60%"
                                    outerRadius="90%"
                                    paddingAngle={items.length > 1 ? 2 : 0}
                                    isAnimationActive={false}
                                >
                                    {items.map((item, index) => (
                                        <Cell key={item.categoryId ?? 'none'} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatMoney(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full min-w-0 flex-1">
                        <p className="mb-2 text-sm text-slate-600">
                            Total{' '}
                            <span className="font-semibold text-slate-900">{formatMoney(data.total)}</span>
                        </p>
                        <ul className="divide-y divide-slate-100">
                            {items.map((item, index) => (
                                <li
                                    key={item.categoryId ?? 'none'}
                                    className="flex items-center justify-between gap-3 py-2"
                                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        aria-hidden="true"
                    />
                    <span className="truncate text-sm text-slate-900">{item.categoryName}</span>
                  </span>
                                    <span className="shrink-0 text-sm text-slate-600">
                    {formatMoney(item.amount)}
                                        <span className="ml-2 text-xs text-slate-400">
                      {Number(item.percentage).toFixed(1)}%
                    </span>
                  </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </Card>
    )
}