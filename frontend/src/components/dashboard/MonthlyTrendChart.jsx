import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { useChartTheme } from '../../hooks/useChartTheme'
import { formatMoney, formatMoneyCompact } from '../../utils/format'
import Card from '../Card'
import Spinner from '../Spinner'
import LoadError from './LoadError'

// data: [{ key, label, fullLabel, income, expense }]
export default function MonthlyTrendChart({ description, loading, error, data, onRetry }) {
    const theme = useChartTheme()
    const hasAny = data?.some((point) => point.income !== 0 || point.expense !== 0)

    return (
        <Card title="Income vs expenses" description={description}>
            {loading && <Spinner label="Loading trend..." />}

            {!loading && error && <LoadError message={error} onRetry={onRetry} />}

            {!loading && !error && data && !hasAny && (
                <p className="text-sm text-muted">No income or expenses recorded in these months yet.</p>
            )}

            {!loading && !error && data && hasAny && (
                <>
                    <div className="mb-4 flex items-center gap-5 text-sm text-muted">
                        <span className="flex items-center gap-2">
                            <span
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: theme.income }}
                                aria-hidden="true"
                            />
                            Income
                        </span>
                        <span className="flex items-center gap-2">
                            <span
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: theme.expense }}
                                aria-hidden="true"
                            />
                            Expenses
                        </span>
                    </div>

                    <div
                        className="h-64 w-full"
                        role="img"
                        aria-label={`Bar chart of income and expenses for the last ${data.length} months`}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                                <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: theme.axis, fontSize: 12 }}
                                    axisLine={{ stroke: theme.grid }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={formatMoneyCompact}
                                    tick={{ fill: theme.axis, fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={56}
                                />
                                <Tooltip
                                    {...theme.tooltip}
                                    cursor={{ fill: theme.cursor }}
                                    formatter={(value, name) => [formatMoney(value), name]}
                                    labelFormatter={(label, payload) =>
                                        payload?.[0]?.payload?.fullLabel ?? label
                                    }
                                />
                                <Bar
                                    dataKey="income"
                                    name="Income"
                                    fill={theme.income}
                                    radius={[4, 4, 0, 0]}
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="Expenses"
                                    fill={theme.expense}
                                    radius={[4, 4, 0, 0]}
                                    isAnimationActive={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </Card>
    )
}