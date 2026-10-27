import { useEffect, useState } from 'react'
import { describeError } from '../api/client'
import { groupsApi } from '../api/groups'
import Alert from '../components/Alert'
import Card from '../components/Card'
import GroupForm from '../components/groups/GroupForm'
import GroupItem from '../components/groups/GroupItem'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'

function byName(a, b) {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

export default function GroupsPage() {
    const { user } = useAuth()
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await groupsApi.list()
                if (!cancelled) setGroups([...data].sort(byName))
            } catch (err) {
                if (!cancelled) setError(describeError(err).message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [reloadKey])

    function reload() {
        setLoading(true)
        setError('')
        setReloadKey((key) => key + 1)
    }

    // The create response is a GroupDetailResponse; the list wants a GroupResponse
    function handleCreated(created) {
        const entry = {
            id: created.id,
            name: created.name,
            createdById: created.createdById,
            createdAt: created.createdAt,
            memberCount: created.members.length,
        }
        setGroups((current) => [...current, entry].sort(byName))
        setNotice({ type: 'success', text: `Group "${created.name}" created.` })
    }

    function handleRenamed(id, newName) {
        setGroups((current) =>
            current.map((g) => (g.id === id ? { ...g, name: newName } : g)).sort(byName),
        )
        setNotice({ type: 'success', text: 'Group renamed.' })
    }

    function handleDeleted(id) {
        setGroups((current) => current.filter((g) => g.id !== id))
        setNotice({ type: 'success', text: 'Group deleted.' })
    }

    // The group no longer exists on the server: say so and reload the real list
    function handleStale(message) {
        setNotice({ type: 'error', text: message })
        reload()
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Groups</h1>

            {notice && <Alert type={notice.type}>{notice.text}</Alert>}

            <Card
                title="Create a group"
                description="Start a group for a trip, a flat or any shared costs. You are added as its first member."
            >
                <GroupForm onCreated={handleCreated} />
            </Card>

            <Card title="Your groups">
                {loading && <Spinner label="Loading groups..." />}

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

                {!loading && !error && groups.length === 0 && (
                    <p className="text-sm text-slate-500">
                        You aren&apos;t in any groups yet. Create one above.
                    </p>
                )}

                {!loading && !error && groups.length > 0 && (
                    <ul className="divide-y divide-slate-100">
                        {groups.map((group) => (
                            <GroupItem
                                key={group.id}
                                group={group}
                                isCreator={group.createdById === user.id}
                                onRenamed={handleRenamed}
                                onDeleted={handleDeleted}
                                onStale={handleStale}
                            />
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    )
}