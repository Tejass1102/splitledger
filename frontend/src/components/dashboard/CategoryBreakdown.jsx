import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useChartTheme } from '../../hooks/useChartTheme'
import { formatMoney } from '../../utils/format'
import Card from '../Card'
import Spinner from '../Spinner'
import LoadError from './LoadError'
import SegmentedControl from '../SegmentedControl'

const TABS = [
    { value: 'EXPENSE', label: 'Expenses' },
    { value: 'INCOME', label: 'Income' },
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
    const theme = useChartTheme()
    const colors = theme.palette
    const typeLabel = type === 'EXPENSE' ? 'expenses' : 'income'
    const items = (data?.items ?? []).map((item) => ({ ...item, amount: Number(item.amount) }))

    return (
        <Card title="By category" description={monthLabel}>
            <div className="mb-5">
                <SegmentedControl label="Show" options={TABS} value={type} onChange={onTypeChange} />
            </div>

            {loading && <Spinner label="Loading breakdown..." />}

            {!loading && error && <LoadError message={error} onRetry={onRetry} />}

            {!loading && !error && data && items.length === 0 && (
                <p className="text-sm text-muted">
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
                                    stroke={theme.surface}
                                    isAnimationActive={false}
                                >
                                    {items.map((item, index) => (
                                        <Cell
                                            key={item.categoryId ?? 'none'}
                                            fill={colors[index % colors.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip {...theme.tooltip} formatter={(value) => formatMoney(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full min-w-0 flex-1">
                        <p className="mb-2 text-sm text-muted">
                            Total{' '}
                            <span className="font-semibold text-ink">{formatMoney(data.total)}</span>
                        </p>
                        <ul className="divide-y divide-line">
                            {items.map((item, index) => (
                                <li
                                    key={item.categoryId ?? 'none'}
                                    className="flex items-center justify-between gap-3 py-2"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="h-3 w-3 shrink-0 rounded-full"
                                            style={{ backgroundColor: colors[index % colors.length] }}
                                            aria-hidden="true"
                                        />
                                        <span className="truncate text-sm text-ink">{item.categoryName}</span>
                                    </span>
                                    <span className="shrink-0 text-sm text-muted">
                                        {formatMoney(item.amount)}
                                        <span className="ml-2 text-xs text-muted">
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