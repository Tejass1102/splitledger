import { useState } from 'react'
import { Link } from 'react-router-dom'
import { describeError } from '../../api/client'
import { groupsApi } from '../../api/groups'

// Prefer the field message (400 validation); fall back to the general message (403, 409 ...)
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

// isCreator decides whether Edit and Delete are shown (the backend enforces it as well).
// onRenamed(id, newName), onDeleted(id), onStale(message) report back to the page.
export default function GroupItem({ group, isCreator, onRenamed, onDeleted, onStale }) {
    const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirmDelete'
    const [name, setName] = useState(group.name)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    function backToView() {
        setMode('view')
        setName(group.name)
        setError('')
    }

    async function handleSave(e) {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            const updated = await groupsApi.rename(group.id, name)
            onRenamed(group.id, updated.name)
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
            await groupsApi.remove(group.id)
            onDeleted(group.id)
        } catch (err) {
            if (err.status === 404) {
                onStale(messageFor(err))
            } else {
                // e.g. 409 "has expenses or settlements": back to the normal row, and say why
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
                        aria-label={`Rename ${group.name}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        className="min-w-0 flex-1 basis-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={busy || name.trim() === group.name}
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
                    <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                            <Link
                                to={`/groups/${group.id}`}
                                className="truncate text-sm font-semibold text-indigo-700 hover:underline"
                            >
                                {group.name}
                            </Link>
                            {isCreator && (
                                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  Creator
                </span>
                            )}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </p>
                    </div>

                    {isCreator &&
                        (mode === 'confirmDelete' ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-slate-600">Delete this group?</span>
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
                                    Rename
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
                        ))}
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