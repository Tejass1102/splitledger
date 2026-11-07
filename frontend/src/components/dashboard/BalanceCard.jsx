import { savingsRate } from '../../utils/dashboard'
import { formatMoney } from '../../utils/format'
import Card from '../Card'
import Spinner from '../Spinner'
import LoadError from './LoadError'

// data is a balance response { totalIncome, totalExpense, balance }
export default function BalanceCard({ loading, error, data, onRetry }) {
    const totalIncome = data ? Number(data.totalIncome) : 0
    const totalExpense = data ? Number(data.totalExpense) : 0
    const balance = data ? Number(data.balance) : 0
    const rate = data ? savingsRate(totalIncome, totalExpense) : null
    const barWidth = rate === null ? 0 : Math.min(100, Math.max(0, rate))

    let rateNote = 'Add some income to see your savings rate.'
    if (rate !== null) {
        rateNote = rate < 0 ? 'You have spent more than you have earned.' : 'Share of your income that was not spent.'
    }

    return (
        <Card
            title="Overall balance"
            description="All your income minus all your expenses, across every month."
        >
            {loading && <Spinner label="Loading balance..." />}

            {!loading && error && <LoadError message={error} onRetry={onRetry} />}

            {!loading && !error && data && (
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-muted">Balance</p>
                        <p
                            className={`mt-1 text-3xl font-bold ${
                                balance < 0 ? 'text-negative' : 'text-positive-ink'
                            }`}
                        >
                            {formatMoney(balance)}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm text-muted">Savings rate (all time)</p>
                            <p
                                className={`text-sm font-semibold ${
                                    rate === null
                                        ? 'text-muted'
                                        : rate < 0
                                            ? 'text-negative'
                                            : 'text-positive-ink'
                                }`}
                            >
                                {rate === null ? '—' : `${rate.toFixed(1)}%`}
                            </p>
                        </div>
                        <div
                            role="progressbar"
                            aria-label="Savings rate"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(barWidth)}
                            className="mt-2 h-2 overflow-hidden rounded-full bg-subtle"
                        >
                            <div
                                className="h-full rounded-full bg-positive"
                                style={{ width: `${barWidth}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-muted">{rateNote}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
                        <div>
                            <p className="text-sm text-muted">Total income</p>
                            <p className="mt-1 text-lg font-semibold text-ink">
                                {formatMoney(totalIncome)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted">Total expenses</p>
                            <p className="mt-1 text-lg font-semibold text-ink">
                                {formatMoney(totalExpense)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}