import { Link } from 'react-router-dom'
import { formatDate, formatMoney } from '../../utils/format'
import Card from '../Card'
import { ArrowDownLeftIcon, ArrowUpRightIcon } from '../icons'
import Spinner from '../Spinner'
import LoadError from './LoadError'

const footerLink =
    'rounded text-sm font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

// data: [{ id, type, title, category, hasNote, date, amount }]
export default function RecentTransactions({ monthLabel, loading, error, data, onRetry }) {
    return (
        <Card title="Recent transactions" description={`Latest in ${monthLabel}`}>
            {loading && <Spinner label="Loading transactions..." />}

            {!loading && error && <LoadError message={error} onRetry={onRetry} />}

            {!loading && !error && data && data.length === 0 && (
                <p className="text-sm text-muted">No transactions in {monthLabel} yet.</p>
            )}

            {!loading && !error && data && data.length > 0 && (
                <ul className="divide-y divide-line">
                    {data.map((row) => {
                        const isIncome = row.type === 'INCOME'
                        return (
                            <li key={row.id} className="flex items-center gap-3 py-3">
                                <span
                                    aria-hidden="true"
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                        isIncome
                                            ? 'bg-positive-soft text-positive'
                                            : 'bg-negative-soft text-negative'
                                    }`}
                                >
                                    {isIncome ? <ArrowDownLeftIcon size={18} /> : <ArrowUpRightIcon size={18} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-ink">
                                        {row.title}
                                    </span>
                                    <span className="block truncate text-xs text-muted">
                                        {formatDate(row.date)}
                                        {row.hasNote ? ` · ${row.category}` : ''}
                                    </span>
                                </span>
                                <span
                                    className={`shrink-0 text-sm font-semibold ${
                                        isIncome ? 'text-positive-ink' : 'text-ink'
                                    }`}
                                >
                                    <span className="sr-only">{isIncome ? 'Income ' : 'Expense '}</span>
                                    {isIncome ? '+' : '−'}
                                    {formatMoney(row.amount)}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}

            <div className="mt-4 flex gap-5 border-t border-line pt-4">
                <Link to="/expenses" className={footerLink}>
                    All expenses
                </Link>
                <Link to="/incomes" className={footerLink}>
                    All incomes
                </Link>
            </div>
        </Card>
    )
}