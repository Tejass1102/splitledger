import { useEffect, useState } from 'react'
import { categoriesApi } from '../api/categories'
import { describeError } from '../api/client'
import { expensesApi } from '../api/expenses'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import ExpenseForm from '../components/expenses/ExpenseForm'
import ExpenseItem from '../components/expenses/ExpenseItem'
import FormField from '../components/FormField'
import { ReceiptIcon } from '../components/icons'
import LoadError from '../components/LoadError'
import PageHeader from '../components/PageHeader'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import { currentMonthRange, formatMoney } from '../utils/format'

function byName(a, b) {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

export default function ExpensesPage() {
    const [filters, setFilters] = useState(() => ({ ...currentMonthRange(), categoryId: '' }))
    const [categories, setCategories] = useState([])
    // result.key says which filters the stored list belongs to
    const [result, setResult] = useState({ key: null, expenses: [], error: '' })
    const [refreshKey, setRefreshKey] = useState(0)
    const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }

    const rangeError =
        filters.from && filters.to && filters.from > filters.to
            ? "The 'From' date must not be after the 'To' date."
            : ''
    const filterKey = `${filters.from}|${filters.to}|${filters.categoryId}`
    const loading = !rangeError && result.key !== filterKey

    // Loads the list when the filters change, and again after every refresh()
    useEffect(() => {
        if (rangeError) return undefined
        let cancelled = false

        async function load() {
            try {
                const data = await expensesApi.list({
                    from: filters.from,
                    to: filters.to,
                    categoryId: filters.categoryId,
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
    }, [filterKey, filters.from, filters.to, filters.categoryId, refreshKey, rangeError])

    // Expense categories for the dropdowns; reloaded together with the list
    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await categoriesApi.list('EXPENSE')
                if (!cancelled) setCategories([...data].sort(byName))
            } catch {
                // The form and filters still work with "No category" only
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [refreshKey])

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
        if (filters.categoryId && String(expense.categoryId) !== filters.categoryId) return false
        return true
    }

    function handleSaved(saved, wasEdit) {
        const base = wasEdit ? 'Expense updated.' : 'Expense added.'
        const hidden = matchesFilters(saved)
            ? ''
            : " It is outside the current filters, so it isn't shown below."
        setNotice({ type: 'success', text: base + hidden })
        refresh()
    }

    function handleDeleted(id) {
        setResult((current) => ({
            ...current,
            expenses: current.expenses.filter((e) => e.id !== id),
        }))
        setNotice({ type: 'success', text: 'Expense deleted.' })
    }

    // Something no longer exists on the server: say so and reload the real data
    function handleStale(message) {
        setNotice({ type: 'error', text: message })
        refresh()
    }

    const expenses = result.expenses
    // Add up in whole paise so totals never show floating-point noise
    const totalPaise = expenses.reduce((sum, e) => sum + Math.round(e.amount * 100), 0)

    return (
        <div className="mx-auto max-w-content space-y-6">
            <PageHeader title="Expenses" description="Record and review what you spend." />

            {notice && <Alert type={notice.type}>{notice.text}</Alert>}

            <Card title="Add an expense">
                <ExpenseForm
                    categories={categories}
                    idPrefix="add-"
                    onSaved={handleSaved}
                    onStale={handleStale}
                />
            </Card>

            <Card title="Filters" description="Showing this month by default.">
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                            label="From"
                            name="filter-from"
                            type="date"
                            value={filters.from}
                            onChange={(e) => updateFilter('from', e.target.value)}
                        />
                        <FormField
                            label="To"
                            name="filter-to"
                            type="date"
                            value={filters.to}
                            onChange={(e) => updateFilter('to', e.target.value)}
                        />
                        <SelectField
                            label="Category"
                            name="filter-category"
                            value={filters.categoryId}
                            onChange={(e) => updateFilter('categoryId', e.target.value)}
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </SelectField>
                    </div>

                    <Alert type="error">{rangeError}</Alert>

                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={showThisMonth}>
                            This month
                        </Button>
                        <Button variant="secondary" size="sm" onClick={showAllTime}>
                            All time
                        </Button>
                    </div>
                </div>
            </Card>

            {!rangeError && (
                <Card title="Your expenses">
                    {loading && <Spinner label="Loading expenses..." />}

                    {!loading && result.error && <LoadError message={result.error} onRetry={refresh} />}

                    {!loading && !result.error && expenses.length === 0 && (
                        <EmptyState
                            icon={ReceiptIcon}
                            title="No expenses found"
                            description="Nothing matches these filters. Try a different date range or category, or add an expense above."
                            action={
                                filters.from || filters.to ? (
                                    <Button variant="secondary" size="sm" onClick={showAllTime}>
                                        Show all time
                                    </Button>
                                ) : null
                            }
                        />
                    )}

                    {!loading && !result.error && expenses.length > 0 && (
                        <>
                            <div className="mb-2 flex items-baseline justify-between gap-3 rounded-lg bg-subtle px-4 py-3">
                                <p className="text-sm text-muted">
                                    {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
                                </p>
                                <p className="text-sm text-muted">
                                    Total{' '}
                                    <span className="text-lg font-bold text-ink">
                                        {formatMoney(totalPaise / 100)}
                                    </span>
                                </p>
                            </div>
                            <ul className="divide-y divide-line">
                                {expenses.map((expense) => (
                                    <ExpenseItem
                                        key={expense.id}
                                        expense={expense}
                                        categories={categories}
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
        </div>
    )
}