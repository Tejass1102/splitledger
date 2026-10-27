import { useEffect, useState } from 'react'
import { describeError } from '../api/client'
import { summaryApi } from '../api/summary'
import Alert from '../components/Alert'
import Card from '../components/Card'
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown'
import StatCard from '../components/dashboard/StatCard'
import { useAuth } from '../context/AuthContext'
import { useReminders } from '../context/RemindersContext'
import {
    currentMonthKey,
    formatMoney,
    formatMonthKey,
    shiftMonth,
} from '../utils/format'
import Spinner from '../components/Spinner'

function toneOf(amount) {
    if (amount < 0) return 'negative'
    if (amount > 0) return 'positive'
    return 'neutral'
}

function LoadError({ message, onRetry }) {
    return (
        <div className="space-y-3">
            <Alert type="error">{message}</Alert>
            <button
                onClick={onRetry}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
                Retry
            </button>
        </div>
    )
}

const navButton =
    'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'

export default function DashboardPage() {
    const { user } = useAuth()
    const { dataVersion } = useReminders()
    const [month, setMonth] = useState(currentMonthKey)
    const [type, setType] = useState('EXPENSE')
    const [refreshKey, setRefreshKey] = useState(0)

    // Stored results remember which request they belong to (key); a result is only
    // shown when its key matches what is on screen now, which also hides stale ones.
    const [monthly, setMonthly] = useState({ key: null, data: null, error: '' })
    const [breakdown, setBreakdown] = useState({ key: null, data: null, error: '' })
    const [balance, setBalance] = useState({ key: null, data: null, error: '' })

    // dataVersion goes up when a salary is confirmed, so the numbers reload
    const version = `${refreshKey}-${dataVersion}`
    const monthlyKey = `${month}|${version}`
    const breakdownKey = `${month}|${type}|${version}`
    const balanceKey = version

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await summaryApi.monthly(month)
                if (!cancelled) setMonthly({ key: monthlyKey, data, error: '' })
            } catch (err) {
                if (!cancelled) {
                    setMonthly({ key: monthlyKey, data: null, error: describeError(err).message })
                }
            }
        }

        load()
        return () => {
            cancelled = true // ignore a slow response for a month we already left
        }
    }, [month, monthlyKey])

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await summaryApi.categories(month, type)
                if (!cancelled) setBreakdown({ key: breakdownKey, data, error: '' })
            } catch (err) {
                if (!cancelled) {
                    setBreakdown({ key: breakdownKey, data: null, error: describeError(err).message })
                }
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [month, type, breakdownKey])

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await summaryApi.balance()
                if (!cancelled) setBalance({ key: balanceKey, data, error: '' })
            } catch (err) {
                if (!cancelled) {
                    setBalance({ key: balanceKey, data: null, error: describeError(err).message })
                }
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [balanceKey])

    const monthlyLoading = monthly.key !== monthlyKey
    const breakdownLoading = breakdown.key !== breakdownKey
    const balanceLoading = balance.key !== balanceKey

    const monthlyData = monthlyLoading ? null : monthly.data
    const monthlyError = monthlyLoading ? '' : monthly.error
    const breakdownData = breakdownLoading ? null : breakdown.data
    const breakdownError = breakdownLoading ? '' : breakdown.error
    const balanceData = balanceLoading ? null : balance.data
    const balanceError = balanceLoading ? '' : balance.error

    function retry() {
        setRefreshKey((key) => key + 1)
    }

    const monthLabel = formatMonthKey(month)

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.name}</h1>
                    <p className="mt-1 text-sm text-slate-500">Here is how your money looks.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMonth(shiftMonth(month, -1))}
                        aria-label="Previous month"
                        className={navButton}
                    >
                        ‹
                    </button>
                    <span className="min-w-32 text-center text-sm font-semibold text-slate-900">
            {monthLabel}
          </span>
                    <button
                        onClick={() => setMonth(shiftMonth(month, 1))}
                        aria-label="Next month"
                        className={navButton}
                    >
                        ›
                    </button>
                    {month !== currentMonthKey() && (
                        <button onClick={() => setMonth(currentMonthKey())} className={navButton}>
                            This month
                        </button>
                    )}
                </div>
            </div>

            {monthlyError ? (
                <LoadError message={monthlyError} onRetry={retry} />
            ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Income"
                        value={monthlyData ? formatMoney(monthlyData.totalIncome) : '...'}
                    />
                    <StatCard
                        label="Expenses"
                        value={monthlyData ? formatMoney(monthlyData.totalExpense) : '...'}
                    />
                    <StatCard
                        label="Net (income minus expenses)"
                        value={monthlyData ? formatMoney(monthlyData.net) : '...'}
                        tone={monthlyData ? toneOf(monthlyData.net) : 'neutral'}
                    />
                </div>
            )}

            <CategoryBreakdown
                type={type}
                onTypeChange={setType}
                monthLabel={monthLabel}
                loading={breakdownLoading}
                error={breakdownError}
                data={breakdownData}
                onRetry={retry}
            />

            <Card
                title="Overall balance"
                description="All your income minus all your expenses, across every month."
            >
                {balanceLoading && <Spinner label="Loading balance..." />}

                {balanceError && <LoadError message={balanceError} onRetry={retry} />}

                {balanceData && (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-sm text-slate-500">Total income</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                                {formatMoney(balanceData.totalIncome)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total expenses</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                                {formatMoney(balanceData.totalExpense)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Balance</p>
                            <p
                                className={`mt-1 text-lg font-semibold ${
                                    balanceData.balance < 0 ? 'text-red-700' : 'text-green-700'
                                }`}
                            >
                                {formatMoney(balanceData.balance)}
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}