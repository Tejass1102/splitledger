import { useEffect, useState } from 'react'
import { categoriesApi } from '../api/categories'
import { describeError } from '../api/client'
import Alert from '../components/Alert'
import Card from '../components/Card'
import CategoryForm from '../components/categories/CategoryForm'
import CategoryRow from '../components/categories/CategoryRow'
import EmptyState from '../components/EmptyState'
import { CategoriesIcon } from '../components/icons'
import LoadError from '../components/LoadError'
import PageHeader from '../components/PageHeader'
import SegmentedControl from '../components/SegmentedControl'
import Spinner from '../components/Spinner'

const TABS = [
    { value: 'EXPENSE', label: 'Expense' },
    { value: 'INCOME', label: 'Income' },
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
        <div className="mx-auto max-w-content space-y-6">
            <PageHeader title="Categories" description="Organise your expenses and income." />

            <SegmentedControl
                label="Category type"
                options={TABS}
                value={type}
                onChange={handleTabChange}
            />

            <Alert type="error">{notice}</Alert>

            <Card
                title="Add a category"
                description={`Create your own ${typeLabel} category. Names must be unique, ignoring capital letters.`}
            >
                <CategoryForm key={type} type={type} onCreated={handleCreated} />
            </Card>

            {loading && <Spinner label="Loading categories..." />}

            {!loading && error && <LoadError message={error} onRetry={reload} />}

            {!loading && !error && (
                <>
                    <Card
                        title="Your categories"
                        description={
                            custom.length > 0
                                ? `${custom.length} custom ${typeLabel} ${
                                    custom.length === 1 ? 'category' : 'categories'
                                }`
                                : undefined
                        }
                    >
                        {custom.length === 0 ? (
                            <EmptyState
                                icon={CategoriesIcon}
                                title={`No custom ${typeLabel} categories yet`}
                                description="Add one above and it will show up here."
                            />
                        ) : (
                            <ul className="divide-y divide-line">
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
                            <p className="text-sm text-muted">No default {typeLabel} categories.</p>
                        ) : (
                            <ul className="divide-y divide-line">
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