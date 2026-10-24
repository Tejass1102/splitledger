import { useState } from 'react'
import { categoriesApi } from '../../api/categories'
import { describeError } from '../../api/client'

// Prefer the field message (400 validation); fall back to the general message (409 etc.)
function messageFor(err) {
    const described = describeError(err)
    return described.fieldErrors.name || described.message
}

const primaryButton =
    'rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60'
const secondaryButton =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60'
const dangerButton =
    'rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60'

// onStale(message) is called when the backend says the category no longer exists (404)
export default function CategoryRow({ category, onUpdated, onDeleted, onStale }) {
    const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirmDelete'
    const [name, setName] = useState(category.name)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    function backToView() {
        setMode('view')
        setName(category.name)
        setError('')
    }

    async function handleSave(e) {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            const updated = await categoriesApi.update(category.id, name)
            onUpdated(updated)
            setMode('view')
        } catch (err) {
            if (err.status === 404) onStale(messageFor(err))
            else setError(messageFor(err))
        } finally {
            setBusy(false)
        }
    }

    async function handleDelete() {
        setError('')
        setBusy(true)
        try {
            await categoriesApi.remove(category.id)
            onDeleted(category.id)
        } catch (err) {
            if (err.status === 404) {
                onStale(messageFor(err))
            } else {
                // e.g. 409 "used by existing entries": go back to the normal row and show why
                setMode('view')
                setError(messageFor(err))
            }
        } finally {
            setBusy(false)
        }
    }

    return (
        <li className="px-1 py-3">
            {mode === 'edit' ? (
                <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2" noValidate>
                    <input
                        type="text"
                        aria-label={`Rename ${category.name}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        className="min-w-0 flex-1 basis-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={busy || name.trim() === category.name}
                        className={primaryButton}
                    >
                        {busy ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={backToView} disabled={busy} className={secondaryButton}>
                        Cancel
                    </button>
                </form>
            ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">{category.name}</span>

                    {category.builtIn ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Default
            </span>
                    ) : mode === 'confirmDelete' ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-600">Delete this category?</span>
                            <button onClick={handleDelete} disabled={busy} className={dangerButton}>
                                {busy ? 'Deleting...' : 'Yes, delete'}
                            </button>
                            <button onClick={backToView} disabled={busy} className={secondaryButton}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setError('')
                                    setMode('edit')
                                }}
                                className={secondaryButton}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    setError('')
                                    setMode('confirmDelete')
                                }}
                                className={secondaryButton}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </li>
    )
}