import { useState } from 'react'
import { Link } from 'react-router-dom'
import { describeError } from '../../api/client'
import { groupsApi } from '../../api/groups'
import Button, { IconButton } from '../Button'
import { inputClass } from '../fieldStyles'
import { GroupsIcon, PencilIcon, TrashIcon } from '../icons'
import Badge from './Badge'

// Prefer the field message (400 validation); fall back to the general message (403, 409 ...)
function messageFor(err) {
    const described = describeError(err)
    return described.fieldErrors.name || described.message
}

// isCreator decides whether Rename and Delete are shown (the backend enforces it as well).
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
                        className={`min-w-0 flex-1 basis-48 ${inputClass({ compact: true, fullWidth: false })}`}
                    />
                    <Button type="submit" size="sm" disabled={busy || name.trim() === group.name}>
                        {busy ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={backToView} disabled={busy}>
                        Cancel
                    </Button>
                </form>
            ) : (
                <>
                    <div className="flex items-center gap-3">
                        <span
                            aria-hidden="true"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"
                        >
                            <GroupsIcon size={20} />
                        </span>

                        <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2">
                                <Link
                                    to={`/groups/${group.id}`}
                                    className="truncate rounded text-sm font-semibold text-ink hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                >
                                    {group.name}
                                </Link>
                                {isCreator && <Badge tone="indigo">Creator</Badge>}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                            </p>
                        </div>

                        {isCreator && mode === 'view' && (
                            <div className="flex shrink-0 gap-0.5">
                                <IconButton
                                    label={`Rename ${group.name}`}
                                    onClick={() => {
                                        setError('')
                                        setMode('edit')
                                    }}
                                >
                                    <PencilIcon size={16} />
                                </IconButton>
                                <IconButton
                                    tone="danger"
                                    label={`Delete ${group.name}`}
                                    onClick={() => {
                                        setError('')
                                        setMode('confirmDelete')
                                    }}
                                >
                                    <TrashIcon size={16} />
                                </IconButton>
                            </div>
                        )}
                    </div>

                    {isCreator && mode === 'confirmDelete' && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-negative-soft px-3 py-2">
                            <span className="text-sm font-medium text-ink">Delete this group?</span>
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