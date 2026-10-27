import { useState } from 'react'
import { describeError } from '../../api/client'
import { groupsApi } from '../../api/groups'
import FormField from '../FormField'
import Badge from './Badge'

const primaryButton =
    'rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60'
const secondaryButton =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60'
const dangerButton =
    'rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60'

// onRemoved(member), onLinked(member, email), onStale(message) and onRefresh() report back to the page
export default function MemberRow({
                                      group,
                                      member,
                                      currentUserId,
                                      isCreator,
                                      onRemoved,
                                      onLinked,
                                      onStale,
                                      onRefresh,
                                  }) {
    const [mode, setMode] = useState('view') // 'view' | 'link' | 'confirmRemove'
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [fieldError, setFieldError] = useState('')
    const [busy, setBusy] = useState(false)

    const isGroupCreatorMember = member.userId === group.createdById
    const canRemove = isCreator && !isGroupCreatorMember // the creator can't be removed
    const canLink = isCreator && member.guest

    function backToView() {
        setMode('view')
        setEmail('')
        setError('')
        setFieldError('')
    }

    async function handleLink(e) {
        e.preventDefault()
        setError('')
        setFieldError('')

        const trimmed = email.trim()
        if (trimmed === '') {
            setFieldError('Email is required')
            return
        }

        setBusy(true)
        try {
            const updated = await groupsApi.linkMember(group.id, member.id, trimmed)
            backToView()
            onLinked(updated, trimmed)
        } catch (err) {
            const described = describeError(err)
            if (described.fieldErrors.email) setFieldError(described.fieldErrors.email)
            else setError(described.message)
            // 404 can also mean the member or group is gone: reload quietly
            if (err.status === 404) onRefresh()
        } finally {
            setBusy(false)
        }
    }

    async function handleRemove() {
        setError('')
        setBusy(true)
        try {
            await groupsApi.removeMember(group.id, member.id)
            onRemoved(member)
        } catch (err) {
            const message = describeError(err).message
            if (err.status === 404) {
                onStale(message)
            } else {
                // e.g. 409 "part of existing expenses or settlements": back to the normal row, and say why
                setMode('view')
                setError(message)
            }
        } finally {
            setBusy(false)
        }
    }

    return (
        <li className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{member.displayName}</span>
                    {member.userId === currentUserId && <Badge tone="indigo">You</Badge>}
                    {isGroupCreatorMember && <Badge tone="slate">Creator</Badge>}
                    {member.guest && <Badge tone="amber">Guest</Badge>}
                </div>

                {mode === 'confirmRemove' ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-slate-600">Remove {member.displayName}?</span>
                        <button onClick={handleRemove} disabled={busy} className={dangerButton}>
                            {busy ? 'Removing...' : 'Yes, remove'}
                        </button>
                        <button onClick={backToView} disabled={busy} className={secondaryButton}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    mode === 'view' &&
                    (canLink || canRemove) && (
                        <div className="flex gap-2">
                            {canLink && (
                                <button
                                    onClick={() => {
                                        setError('')
                                        setMode('link')
                                    }}
                                    className={secondaryButton}
                                >
                                    Link to account
                                </button>
                            )}
                            {canRemove && (
                                <button
                                    onClick={() => {
                                        setError('')
                                        setMode('confirmRemove')
                                    }}
                                    className={secondaryButton}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    )
                )}
            </div>

            {mode === 'link' && (
                <form onSubmit={handleLink} className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4" noValidate>
                    <p className="text-sm text-slate-600">
                        {member.displayName} keeps their name, and everything they paid or owe moves to the
                        account you choose.
                    </p>
                    <FormField
                        label="Email of the registered account"
                        name={`link-email-${member.id}`}
                        type="email"
                        autoComplete="off"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={fieldError}
                    />
                    <div className="flex gap-2">
                        <button type="submit" disabled={busy} className={primaryButton}>
                            {busy ? 'Linking...' : 'Link account'}
                        </button>
                        <button type="button" onClick={backToView} disabled={busy} className={secondaryButton}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </li>
    )
}