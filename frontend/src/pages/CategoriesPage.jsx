import { useEffect, useState } from 'react'
import { categoriesApi } from '../api/categories'
import { describeError } from '../api/client'
import Alert from '../components/Alert'
import Card from '../components/Card'
import CategoryForm from '../components/categories/CategoryForm'
import CategoryRow from '../components/categories/CategoryRow'

const TABS = [
    { type: 'EXPENSE', label: 'Expense' },
    { type: 'INCOME', label: 'Income' },
]

function byName(a, b) {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

export default function CategoriesPage() {
    const [type, setType] = useState('EXPENSE')
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await categoriesApi.list(type)
                if (!cancelled) setCategories(data)
            } catch (err) {
                if (!cancelled) setError(describeError(err).message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true // ignore a slow response from a tab we already left
        }
    }, [type, reloadKey])

    function reload() {
        setLoading(true)
        setError('')
        setReloadKey((key) => key + 1)
    }

    function handleTabChange(nextType) {
        if (nextType === type) return
        setType(nextType)
        setCategories([])
        setNotice('')
        setLoading(true)
        setError('')
    }

    function handleCreated(created) {
        setNotice('')
        setCategories((current) => [...current, created])
    }

    function handleUpdated(updated) {
        setNotice('')
        setCategories((current) => current.map((c) => (c.id === updated.id ? updated : c)))
    }

    function handleDeleted(id) {
        setNotice('')
        setCategories((current) => current.filter((c) => c.id !== id))
    }

    // The category no longer exists on the server: say so and reload the real list
    function handleStale(message) {
        setNotice(message)
        reload()
    }

    const custom = categories.filter((c) => !c.builtIn).sort(byName)
    const defaults = categories.filter((c) => c.builtIn).sort(byName)
    const typeLabel = type === 'EXPENSE' ? 'expense' : 'income'

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Categories</h1>

            <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
                {TABS.map((tab) => (
                    <button
                        key={tab.type}
                        role="tab"
                        aria-selected={type === tab.type}
                        onClick={() => handleTabChange(tab.type)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                            type === tab.type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <Alert type="error">{notice}</Alert>

            <Card
                title="Add a category"
                description={`Create your own ${typeLabel} category. Names must be unique, ignoring capital letters.`}
            >
                <CategoryForm key={type} type={type} onCreated={handleCreated} />
            </Card>

            {loading && <p className="text-sm text-slate-500">Loading categories...</p>}

            {!loading && error && (
                <div className="space-y-3">
                    <Alert type="error">{error}</Alert>
                    <button
                        onClick={reload}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    <Card title="Your categories">
                        {custom.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                You haven&apos;t added any {typeLabel} categories yet.
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {custom.map((category) => (
                                    <CategoryRow
                                        key={category.id}
                                        category={category}
                                        onUpdated={handleUpdated}
                                        onDeleted={handleDeleted}
                                        onStale={handleStale}
                                    />
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card title="Default categories" description="Provided by SplitLedger. They can't be changed.">
                        {defaults.length === 0 ? (
                            <p className="text-sm text-slate-500">No default {typeLabel} categories.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {defaults.map((category) => (
                                    <CategoryRow
                                        key={category.id}
                                        category={category}
                                        onUpdated={handleUpdated}
                                        onDeleted={handleDeleted}
                                        onStale={handleStale}
                                    />
                                ))}
                            </ul>
                        )}
                    </Card>
                </>
            )}
        </div>
    )
}