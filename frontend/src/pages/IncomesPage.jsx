import { useEffect, useState } from 'react'
import { categoriesApi } from '../api/categories'
import { describeError } from '../api/client'
import { incomesApi } from '../api/incomes'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import FormField from '../components/FormField'
import { WalletIcon } from '../components/icons'
import IncomeForm from '../components/incomes/IncomeForm'
import IncomeItem from '../components/incomes/IncomeItem'
import LoadError from '../components/LoadError'
import PageHeader from '../components/PageHeader'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import { currentMonthRange, formatMoney } from '../utils/format'

function byName(a, b) {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

export default function IncomesPage() {
    const [filters, setFilters] = useState(() => ({
        ...currentMonthRange(),
        categoryId: '',
        source: '',
    }))
    const [categories, setCategories] = useState([])
    // result.key says which filters the stored list belongs to
    const [result, setResult] = useState({ key: null, incomes: [], error: '' })
    const [refreshKey, setRefreshKey] = useState(0)
    const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }

    const rangeError =
        filters.from && filters.to && filters.from > filters.to
            ? "The 'From' date must not be after the 'To' date."
            : ''
    const filterKey = `${filters.from}|${filters.to}|${filters.categoryId}|${filters.source}`
    const loading = !rangeError && result.key !== filterKey

    // Loads the list when the filters change, and again after every refresh()
    useEffect(() => {
        if (rangeError) return undefined
        let cancelled = false

        async function load() {
            try {
                const data = await incomesApi.list({
                    from: filters.from,
                    to: filters.to,
                    categoryId: filters.categoryId,
                    source: filters.source,
                })
                if (!cancelled) setResult({ key: filterKey, incomes: data, error: '' })
            } catch (err) {
                if (!cancelled) {
                    setResult({ key: filterKey, incomes: [], error: describeError(err).message })
                }
            }
        }

        load()
        return () => {
            cancelled = true // ignore a slow response for filters we already changed
        }
    }, [filterKey, filters.from, filters.to, filters.categoryId, filters.source, refreshKey, rangeError])

    // Income categories for the dropdowns; reloaded together with the list
    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await categoriesApi.list('INCOME')
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

    function matchesFilters(income) {
        if (filters.from && income.incomeDate < filters.from) return false
        if (filters.to && income.incomeDate > filters.to) return false
        if (filters.categoryId && String(income.categoryId) !== filters.categoryId) return false
        if (filters.source && income.sourceType !== filters.source) return false
        return true
    }

    function handleSaved(saved, wasEdit) {
        const base = wasEdit ? 'Income updated.' : 'Income added.'
        const hidden = matchesFilters(saved)
            ? ''
            : " It is outside the current filters, so it isn't shown below."
        setNotice({ type: 'success', text: base + hidden })
        refresh()
    }

    function handleDeleted(id) {
        setResult((current) => ({
            ...current,
            incomes: current.incomes.filter((i) => i.id !== id),
        }))
        setNotice({ type: 'success', text: 'Income deleted.' })
    }

    // Something no longer exists on the server: say so and reload the real data
    function handleStale(message) {
        setNotice({ type: 'error', text: message })
        refresh()
    }

    const incomes = result.incomes
    // Add up in whole paise so totals never show floating-point noise
    const totalPaise = incomes.reduce((sum, i) => sum + Math.round(i.amount * 100), 0)

    return (
        <div className="mx-auto max-w-content space-y-6">

            <PageHeader title="Incomes" description="Money you receive, from salary and elsewhere." />

            {notice && <Alert type={notice.type}>{notice.text}</Alert>}

            <Card
                title="Add an income"
                description="Salary is recorded through the salary reminder, so add other money you receive here."
            >
                <IncomeForm
                    categories={categories}
                    idPrefix="add-"
                    onSaved={handleSaved}
                    onStale={handleStale}
                />
            </Card>

            <Card title="Filters" description="Showing this month by default.">
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
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
                        <SelectField
                            label="Source"
                            name="filter-source"
                            value={filters.source}
                            onChange={(e) => updateFilter('source', e.target.value)}
                        >
                            <option value="">All sources</option>
                            <option value="SALARY">Salary</option>
                            <option value="OTHER">Other</option>
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
                <Card title="Your incomes">
                    {loading && <Spinner label="Loading incomes..." />}

                    {!loading && result.error && <LoadError message={result.error} onRetry={refresh} />}

                    {!loading && !result.error && incomes.length === 0 && (
                        <EmptyState
                            icon={WalletIcon}
                            title="No incomes found"
                            description="Nothing matches these filters. Try a different date range, category or source, or add an income above."
                            action={
                                filters.from || filters.to ? (
                                    <Button variant="secondary" size="sm" onClick={showAllTime}>
                                        Show all time
                                    </Button>
                                ) : null
                            }
                        />
                    )}

                    {!loading && !result.error && incomes.length > 0 && (
                        <>
                            <div className="mb-2 flex items-baseline justify-between gap-3 rounded-lg bg-subtle px-4 py-3">
                                <p className="text-sm text-muted">
                                    {incomes.length} {incomes.length === 1 ? 'income' : 'incomes'}
                                </p>
                                <p className="text-sm text-muted">
                                    Total{' '}
                                    <span className="text-lg font-bold text-ink">
                                        {formatMoney(totalPaise / 100)}
                                    </span>
                                </p>
                            </div>
                            <ul className="divide-y divide-line">
                                {incomes.map((income) => (
                                    <IncomeItem
                                        key={income.id}
                                        income={income}
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