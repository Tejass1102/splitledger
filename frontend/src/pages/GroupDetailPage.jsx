import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { describeError } from '../api/client'
import { groupsApi } from '../api/groups'
import Alert from '../components/Alert'
import GroupExpensesSection from '../components/groupExpenses/GroupExpensesSection'
import MembersCard from '../components/groups/MembersCard'
import SettlementsSection from '../components/settlements/SettlementsSection'
import { useAuth } from '../context/AuthContext'
import { formatDateTime } from '../utils/format'
import Spinner from '../components/Spinner'

export default function GroupDetailPage() {
    const { groupId } = useParams()
    const { user } = useAuth()
    const [refreshKey, setRefreshKey] = useState(0)
    // result.groupId says which group the stored data belongs to
    const [result, setResult] = useState({ groupId: null, group: null, error: '', status: 0 })
    const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
    // Goes up whenever something changes the group's money figures, so balances reload
    const [moneyVersion, setMoneyVersion] = useState(0)

    // "Loading" only while we have no data for this group; quiet reloads keep the page on screen
    const loading = result.groupId !== groupId

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const group = await groupsApi.get(groupId)
                if (!cancelled) setResult({ groupId, group, error: '', status: 200 })
            } catch (err) {
                if (cancelled) return
                const message = describeError(err).message
                setResult((current) =>
                    // A failed quiet reload (for example a network blip) keeps what is already shown
                    err.status !== 404 && current.groupId === groupId && current.group
                        ? current
                        : { groupId, group: null, error: message, status: err.status ?? 0 },
                )
            }
        }

        load()
        return () => {
            cancelled = true // ignore a slow response for a group we already left
        }
    }, [groupId, refreshKey])

    function refresh() {
        setRefreshKey((key) => key + 1)
    }

    function bumpMoney() {
        setMoneyVersion((version) => version + 1)
    }

    function retry() {
        setResult({ groupId: null, group: null, error: '', status: 0 })
        refresh()
    }

    // Applies a change to the member list without reloading from the server
    function changeMembers(updater) {
        setResult((current) =>
            current.group
                ? { ...current, group: { ...current.group, members: updater(current.group.members) } }
                : current,
        )
    }

    function handleAdded(member) {
        changeMembers((members) => [...members, member])
        setNotice({ type: 'success', text: `${member.displayName} was added to the group.` })
        bumpMoney()
    }

    function handleRemoved(member) {
        changeMembers((members) => members.filter((m) => m.id !== member.id))
        setNotice({ type: 'success', text: `${member.displayName} was removed from the group.` })
        bumpMoney()
    }

    function handleLinked(updated, email) {
        changeMembers((members) => members.map((m) => (m.id === updated.id ? updated : m)))
        setNotice({
            type: 'success',
            text: `${updated.displayName} is now linked to the account ${email}.`,
        })
        bumpMoney()
    }

    // Something no longer exists on the server: say so and reload the real data
    function handleStale(message) {
        setNotice({ type: 'error', text: message })
        refresh()
        bumpMoney()
    }

    const { group, error, status } = result
    const creator = group?.members.find((m) => m.userId === group.createdById)

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <Link to="/groups" className="text-sm font-medium text-indigo-700 hover:underline">
                ← All groups
            </Link>

            {loading && <Spinner label="Loading group..." />}

            {!loading && error && (
                <div className="space-y-3">
                    <Alert type="error">{error}</Alert>
                    {status !== 404 && (
                        <button
                            onClick={retry}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            {!loading && group && (
                <>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Created by{' '}
                            {group.createdById === user.id ? 'you' : (creator?.displayName ?? 'another member')} on{' '}
                            {formatDateTime(group.createdAt)}
                        </p>
                    </div>

                    {notice && <Alert type={notice.type}>{notice.text}</Alert>}

                    <MembersCard
                        group={group}
                        currentUserId={user.id}
                        onAdded={handleAdded}
                        onRemoved={handleRemoved}
                        onLinked={handleLinked}
                        onStale={handleStale}
                        onRefresh={refresh}
                    />

                    <GroupExpensesSection
                        key={`expenses-${group.id}`}
                        group={group}
                        currentUserId={user.id}
                        onChanged={bumpMoney}
                    />

                    <SettlementsSection
                        key={`settlements-${group.id}`}
                        group={group}
                        currentUserId={user.id}
                        moneyVersion={moneyVersion}
                    />
                </>
            )}
        </div>
    )
}