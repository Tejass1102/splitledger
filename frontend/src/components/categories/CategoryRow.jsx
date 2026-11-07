import { useState } from 'react'
import { categoriesApi } from '../../api/categories'
import { describeError } from '../../api/client'
import Button, { IconButton } from '../Button'
import { inputClass } from '../fieldStyles'
import { PencilIcon, TrashIcon } from '../icons'

// Prefer the field message (400 validation); fall back to the general message (409 etc.)
function messageFor(err) {
    const described = describeError(err)
    return described.fieldErrors.name || described.message
}

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
                        className={`min-w-0 flex-1 basis-48 ${inputClass({ compact: true })}`}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={busy || name.trim() === category.name}
                    >
                        {busy ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={backToView} disabled={busy}>
                        Cancel
                    </Button>
                </form>
            ) : (
                <>
                    <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-ink">{category.name}</span>

                        {category.builtIn ? (
                            <span className="shrink-0 rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-muted">
                                Default
                            </span>
                        ) : (
                            mode === 'view' && (
                                <div className="flex shrink-0 gap-0.5">
                                    <IconButton
                                        label={`Rename ${category.name}`}
                                        onClick={() => {
                                            setError('')
                                            setMode('edit')
                                        }}
                                    >
                                        <PencilIcon size={16} />
                                    </IconButton>
                                    <IconButton
                                        tone="danger"
                                        label={`Delete ${category.name}`}
                                        onClick={() => {
                                            setError('')
                                            setMode('confirmDelete')
                                        }}
                                    >
                                        <TrashIcon size={16} />
                                    </IconButton>
                                </div>
                            )
                        )}
                    </div>

                    {mode === 'confirmDelete' && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-negative-soft px-3 py-2">
                            <span className="text-sm font-medium text-ink">Delete this category?</span>
                            <div className="flex gap-2">
                                <Button variant="danger" size="sm" onClick={handleDelete} disabled={busy}>
                                    {busy ? 'Deleting...' : 'Yes, delete'}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={backToView} disabled={busy}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {error && (
                <p role="alert" className="mt-2 text-sm text-negative">
                    {error}
                </p>
            )}
        </li>
    )
}