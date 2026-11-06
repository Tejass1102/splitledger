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
} from '../utils/format'
import Spinner from '../components/Spinner'
import MonthSwitcher from '../components/dashboard/MonthSwitcher'

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
                className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-subtle"
            >
                Retry
            </button>
        </div>
    )
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
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-ink">
                        {greetingFor()}, {firstNameOf(user.name)}
                    </h1>
                    <p className="mt-1 text-sm text-muted">Here is how your money looks.</p>
                </div>

                <MonthSwitcher month={month} onChange={setMonth} />
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
                            <p className="text-sm text-muted">Total income</p>
                            <p className="mt-1 text-lg font-semibold text-ink">
                                {formatMoney(balanceData.totalIncome)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted">Total expenses</p>
                            <p className="mt-1 text-lg font-semibold text-ink">
                                {formatMoney(balanceData.totalExpense)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted">Balance</p>
                            <p
                                className={`mt-1 text-lg font-semibold ${
                                    balanceData.balance < 0 ? 'text-negative' : 'text-positive-ink'
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