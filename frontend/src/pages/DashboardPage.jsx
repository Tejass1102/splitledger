import { useState } from 'react'
import { summaryApi } from '../api/summary'
import BalanceCard from '../components/dashboard/BalanceCard'
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown'
import LoadError from '../components/dashboard/LoadError'
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart'
import MonthSwitcher from '../components/dashboard/MonthSwitcher'
import QuickActions from '../components/dashboard/QuickActions'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import StatCard from '../components/dashboard/StatCard'
import { ExpensesIcon, IncomesIcon, WalletIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { useReminders } from '../context/RemindersContext'
import { useLoad } from '../hooks/useLoad'
import { loadRecent, loadTrend, percentChange } from '../utils/dashboard'
import { currentMonthKey, formatMoney, formatMonthKey, shiftMonth } from '../utils/format'

function toneOf(amount) {
    if (amount < 0) return 'negative'
    if (amount > 0) return 'positive'
    return 'neutral'
}

function greetingFor(date = new Date()) {
    const hour = date.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
}

function firstNameOf(name) {
    return (name || '').trim().split(/\s+/)[0] || 'there'
}

export default function DashboardPage() {
    const { user } = useAuth()
    const { dataVersion } = useReminders()
    const [month, setMonth] = useState(currentMonthKey)
    const [type, setType] = useState('EXPENSE')
    const [refreshKey, setRefreshKey] = useState(0)

    // dataVersion goes up when a salary is confirmed, so the numbers reload
    const version = `${refreshKey}-${dataVersion}`
    const previousMonth = shiftMonth(month, -1)

    const monthly = useLoad(() => summaryApi.monthly(month), `${month}|${version}`)
    const previous = useLoad(() => summaryApi.monthly(previousMonth), `${previousMonth}|${version}`)
    const breakdown = useLoad(() => summaryApi.categories(month, type), `${month}|${type}|${version}`)
    const balance = useLoad(() => summaryApi.balance(), version)
    const trend = useLoad(() => loadTrend(month), `${month}|${version}`)
    const recent = useLoad(() => loadRecent(month), `${month}|${version}`)

    function retry() {
        setRefreshKey((key) => key + 1)
    }

    // Change vs last month; null (hidden) while loading, on error, or when last month is 0
    function changeOf(field) {
        if (!monthly.data || !previous.data) return null
        return percentChange(Number(monthly.data[field]), Number(previous.data[field]))
    }

    const monthLabel = formatMonthKey(month)

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-ink">
                        {greetingFor()}, {firstNameOf(user.name)}
                    </h1>
                    <p className="mt-1 text-sm text-muted">Here is how your money looks.</p>
                    <QuickActions />
                </div>

                <MonthSwitcher month={month} onChange={setMonth} />
            </div>

            {monthly.error ? (
                <LoadError message={monthly.error} onRetry={retry} />
            ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Income"
                        icon={IncomesIcon}
                        accent="positive"
                        value={monthly.data ? formatMoney(monthly.data.totalIncome) : '...'}
                        change={changeOf('totalIncome')}
                        goodDirection="up"
                    />
                    <StatCard
                        label="Expenses"
                        icon={ExpensesIcon}
                        accent="negative"
                        value={monthly.data ? formatMoney(monthly.data.totalExpense) : '...'}
                        change={changeOf('totalExpense')}
                        goodDirection="down"
                    />
                    <StatCard
                        label="Net (income minus expenses)"
                        icon={WalletIcon}
                        accent="brand"
                        value={monthly.data ? formatMoney(monthly.data.net) : '...'}
                        tone={monthly.data ? toneOf(Number(monthly.data.net)) : 'neutral'}
                        change={changeOf('net')}
                        goodDirection="up"
                    />
                </div>
            )}

            <MonthlyTrendChart
                description={`Last 6 months, up to ${monthLabel}`}
                loading={trend.loading}
                error={trend.error}
                data={trend.data}
                onRetry={retry}
            />

            <CategoryBreakdown
                type={type}
                onTypeChange={setType}
                monthLabel={monthLabel}
                loading={breakdown.loading}
                error={breakdown.error}
                data={breakdown.data}
                onRetry={retry}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <BalanceCard
                    loading={balance.loading}
                    error={balance.error}
                    data={balance.data}
                    onRetry={retry}
                />
                <RecentTransactions
                    monthLabel={monthLabel}
                    loading={recent.loading}
                    error={recent.error}
                    data={recent.data}
                    onRetry={retry}
                />
            </div>
        </div>
    )
}