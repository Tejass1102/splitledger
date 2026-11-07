import { useState } from 'react'
import { describeError } from '../../api/client'
import { groupsApi } from '../../api/groups'
import Avatar from '../Avatar'
import Button, { IconButton } from '../Button'
import FormField from '../FormField'
import { LinkIcon, TrashIcon } from '../icons'
import Badge from './Badge'

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
            <div className="flex flex-wrap items-center gap-3">
                <Avatar name={member.displayName} size="sm" />

                <div className="flex min-w-0 flex-1 basis-40 flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">{member.displayName}</span>
                    {member.userId === currentUserId && <Badge tone="indigo">You</Badge>}
                    {isGroupCreatorMember && <Badge tone="slate">Creator</Badge>}
                    {member.guest && <Badge tone="amber">Guest</Badge>}
                </div>

                {mode === 'view' && (canLink || canRemove) && (
                    <div className="flex shrink-0 items-center gap-1">
                        {canLink && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setError('')
                                    setMode('link')
                                }}
                            >
                                <LinkIcon size={14} />
                                Link to account
                            </Button>
                        )}
                        {canRemove && (
                            <IconButton
                                tone="danger"
                                label={`Remove ${member.displayName}`}
                                onClick={() => {
                                    setError('')
                                    setMode('confirmRemove')
                                }}
                            >
                                <TrashIcon size={16} />
                            </IconButton>
                        )}
                    </div>
                )}
            </div>

            {mode === 'confirmRemove' && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-negative-soft px-3 py-2">
                    <span className="text-sm font-medium text-ink">Remove {member.displayName}?</span>
                    <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={handleRemove} disabled={busy}>
                            {busy ? 'Removing...' : 'Yes, remove'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={backToView} disabled={busy}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {mode === 'link' && (
                <form onSubmit={handleLink} className="mt-3 space-y-3 rounded-xl bg-subtle p-4" noValidate>
                    <p className="text-sm text-muted">
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
                        <Button type="submit" disabled={busy}>
                            {busy ? 'Linking...' : 'Link account'}
                        </Button>
                        <Button variant="secondary" onClick={backToView} disabled={busy}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {error && (
                <p role="alert" className="mt-2 text-sm text-negative">
                    {error}
                </p>
            )}
        </li>
    )
}