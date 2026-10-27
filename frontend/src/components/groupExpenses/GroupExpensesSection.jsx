import { useEffect, useState } from 'react'
import { describeError } from '../../api/client'
import { groupExpensesApi } from '../../api/groupExpenses'
import { currentMonthRange, formatMoney } from '../../utils/format'
import Alert from '../Alert'
import Card from '../Card'
import FormField from '../FormField'
import SelectField from '../SelectField'
import GroupExpenseForm from './GroupExpenseForm'
import GroupExpenseItem from './GroupExpenseItem'
import Spinner from '../Spinner'

export default function GroupExpensesSection({ group, currentUserId, onChanged }) {
    const groupId = group.id
    // Group expenses are read as a whole (a trip, a flat), so all time is the default
    const [filters, setFilters] = useState({ from: '', to: '', paidByMemberId: '' })
    // result.key says which filters the stored list belongs to
    const [result, setResult] = useState({ key: null, expenses: [], error: '' })
    const [refreshKey, setRefreshKey] = useState(0)
    const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }

    const rangeError =
        filters.from && filters.to && filters.from > filters.to
            ? "The 'From' date must not be after the 'To' date."
            : ''
    const filterKey = `${groupId}|${filters.from}|${filters.to}|${filters.paidByMemberId}`
    const loading = !rangeError && result.key !== filterKey

    // Loads the list when the filters change, and again after every refresh()
    useEffect(() => {
        if (rangeError) return undefined
        let cancelled = false

        async function load() {
            try {
                const data = await groupExpensesApi.list(groupId, {
                    from: filters.from,
                    to: filters.to,
                    paidByMemberId: filters.paidByMemberId,
                })
                if (!cancelled) setResult({ key: filterKey, expenses: data, error: '' })
            } catch (err) {
                if (!cancelled) {
                    setResult({ key: filterKey, expenses: [], error: describeError(err).message })
                }
            }
        }

        load()
        return () => {
            cancelled = true // ignore a slow response for filters we already changed
        }
    }, [groupId, filterKey, filters.from, filters.to, filters.paidByMemberId, refreshKey, rangeError])

    function refresh() {
        setRefreshKey((key) => key + 1)
    }

    function updateFilter(name, value) {
        setFilters((current) => ({ ...current, [name]: value }))
        setNotice(null)
    }

    function showThisMonth() {
        setFilters((current) => ({ ...current, ...currentMonthRange() }))
        setNotice(null)
    }

    function showAllTime() {
        setFilters((current) => ({ ...current, from: '', to: '' }))
        setNotice(null)
    }

    function matchesFilters(expense) {
        if (filters.from && expense.expenseDate < filters.from) return false
        if (filters.to && expense.expenseDate > filters.to) return false
        if (filters.paidByMemberId && String(expense.paidByMemberId) !== filters.paidByMemberId) {
            return false
        }
        return true
    }

    function handleSaved(saved, wasEdit) {
        const base = wasEdit ? 'Expense updated.' : 'Expense added.'
        const hidden = matchesFilters(saved)
            ? ''
            : " It is outside the current filters, so it isn't shown below."
        setNotice({ type: 'success', text: base + hidden })
        refresh()
        onChanged?.()
    }

    function handleDeleted(id) {
        setResult((current) => ({
            ...current,
            expenses: current.expenses.filter((e) => e.id !== id),
        }))
        setNotice({ type: 'success', text: 'Expense deleted.' })
        onChanged?.()
    }

    // Something no longer exists on the server: say so and reload the real data
    function handleStale(message) {
        setNotice({ type: 'error', text: message })
        refresh()
        onChanged?.()
    }

    const expenses = result.expenses
    // Add up in whole paise so totals never show floating-point noise
    const totalPaise = expenses.reduce((sum, e) => sum + Math.round(e.amount * 100), 0)

    return (
        <section className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Group expenses</h2>

            {notice && <Alert type={notice.type}>{notice.text}</Alert>}

            <Card
                title="Add an expense"
                description="Say who paid and how the cost is shared between members."
            >
                <GroupExpenseForm
                    groupId={groupId}
                    members={group.members}
                    currentUserId={currentUserId}
                    idPrefix="add-"
                    onSaved={handleSaved}
                    onStale={handleStale}
                />
            </Card>

            <Card title="Filters" description="Showing all expenses by default.">
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                            label="From"
                            name="group-filter-from"
                            type="date"
                            value={filters.from}
                            onChange={(e) => updateFilter('from', e.target.value)}
                        />
                        <FormField
                            label="To"
                            name="group-filter-to"
                            type="date"
                            value={filters.to}
                            onChange={(e) => updateFilter('to', e.target.value)}
                        />
                        <SelectField
                            label="Paid by"
                            name="group-filter-payer"
                            value={filters.paidByMemberId}
                            onChange={(e) => updateFilter('paidByMemberId', e.target.value)}
                        >
                            <option value="">Anyone</option>
                            {group.members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.displayName}
                                </option>
                            ))}
                        </SelectField>
                    </div>

                    <Alert type="error">{rangeError}</Alert>

                    <div className="flex gap-2">
                        <button
                            onClick={showThisMonth}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            This month
                        </button>
                        <button
                            onClick={showAllTime}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            All time
                        </button>
                    </div>
                </div>
            </Card>

            {!rangeError && (
                <Card title="Expenses">
                    {loading && <Spinner label="Loading expenses..." />}

                    {!loading && result.error && (
                        <div className="space-y-3">
                            <Alert type="error">{result.error}</Alert>
                            <button
                                onClick={refresh}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !result.error && expenses.length === 0 && (
                        <p className="text-sm text-slate-500">No expenses match these filters.</p>
                    )}

                    {!loading && !result.error && expenses.length > 0 && (
                        <>
                            <p className="mb-2 text-sm text-slate-600">
                                {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} · Total{' '}
                                <span className="font-semibold text-slate-900">{formatMoney(totalPaise / 100)}</span>
                            </p>
                            <ul className="divide-y divide-slate-100">
                                {expenses.map((expense) => (
                                    <GroupExpenseItem
                                        key={expense.id}
                                        expense={expense}
                                        group={group}
                                        currentUserId={currentUserId}
                                        onSaved={handleSaved}
                                        onDeleted={handleDeleted}
                                        onStale={handleStale}
                                    />
                                ))}
                            </ul>
                        </>
                    )}
                </Card>
            )}
        </section>
    )
}