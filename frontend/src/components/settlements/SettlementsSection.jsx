import { useRef, useState } from 'react'
import { settlementsApi } from '../../api/settlements'
import { useGroupResource } from '../../hooks/useGroupResource'
import Alert from '../Alert'
import Card from '../Card'
import BalanceList from './BalanceList'
import SettlementForm from './SettlementForm'
import SettlementItem from './SettlementItem'
import SuggestionList from './SuggestionList'
import Spinner from '../Spinner'

function byNewest(a, b) {
    return b.settledOn.localeCompare(a.settledOn) || b.id - a.id
}

function LoadError({ message, onRetry }) {
    return (
        <div className="space-y-3">
            <Alert type="error">{message}</Alert>
            <button
                onClick={onRetry}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
                Retry
            </button>
        </div>
    )
}

// moneyVersion goes up whenever something outside this section changes the group's
// money (group expenses, members), so the balances reload.
export default function SettlementsSection({ group, currentUserId, moneyVersion }) {
    const groupId = group.id
    const [localVersion, setLocalVersion] = useState(0)
    const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
    const [prefill, setPrefill] = useState(null) // a suggestion chosen for the form
    const formRef = useRef(null)

    const version = `${moneyVersion}-${localVersion}`
    const balances = useGroupResource(settlementsApi.balances, groupId, version)
    const suggestions = useGroupResource(settlementsApi.settleUp, groupId, version)
    const history = useGroupResource(settlementsApi.list, groupId, version)

    function reload() {
        setLocalVersion((v) => v + 1)
    }

    function handleSaved() {
        setNotice({ type: 'success', text: 'Settlement recorded. The balances are updated.' })
        setPrefill(null)
        reload()
    }

    function handleDeleted() {
        setNotice({ type: 'success', text: 'Settlement deleted. The balances are updated.' })
        reload()
    }

    // Something no longer exists on the server: say so and reload the real data
    function handleStale(message) {
        setNotice({ type: 'error', text: message })
        reload()
    }

    // Fills the form from a suggested payment and brings it into view
    function fillFromSuggestion(payment) {
        setNotice(null)
        setPrefill({
            id: Date.now(),
            fromMemberId: String(payment.fromMemberId),
            toMemberId: String(payment.toMemberId),
            amount: Number(payment.amount).toFixed(2),
        })
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const settlements = history.data ? [...history.data].sort(byNewest) : []

    return (
        <section className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Balances and settlements</h2>

            {notice && <Alert type={notice.type}>{notice.text}</Alert>}

            <Card
                title="Balances"
                description="Who is owed money and who owes it, counting expenses and recorded settlements."
            >
                {!balances.loaded && <Spinner label="Loading balances..." />}
                {balances.error && <LoadError message={balances.error} onRetry={reload} />}
                {balances.data && (
                    <BalanceList
                        balances={balances.data}
                        members={group.members}
                        currentUserId={currentUserId}
                    />
                )}
            </Card>

            <Card
                title="Settle up"
                description="Suggested payments that would settle everyone up. Use one to fill in the form below."
            >
                {!suggestions.loaded && <Spinner label="Loading suggestions..." />}
                {suggestions.error && <LoadError message={suggestions.error} onRetry={reload} />}
                {suggestions.data && (
                    <SuggestionList
                        settleUp={suggestions.data}
                        members={group.members}
                        currentUserId={currentUserId}
                        onUse={fillFromSuggestion}
                    />
                )}
            </Card>

            <div ref={formRef}>
                <Card
                    title="Record a settlement"
                    description="Use this when money has already been handed over. It does not send any money; it only updates the balances."
                >
                    <SettlementForm
                        key={prefill?.id ?? 'blank'}
                        groupId={groupId}
                        members={group.members}
                        initial={prefill}
                        onSaved={handleSaved}
                        onStale={handleStale}
                    />
                </Card>
            </div>

            <Card title="Settlement history">
                {!history.loaded && <Spinner label="Loading settlements..." />}
                {history.error && <LoadError message={history.error} onRetry={reload} />}
                {history.data && settlements.length === 0 && (
                    <p className="text-sm text-slate-500">No settlements recorded yet.</p>
                )}
                {settlements.length > 0 && (
                    <ul className="divide-y divide-slate-100">
                        {settlements.map((settlement) => (
                            <SettlementItem
                                key={settlement.id}
                                settlement={settlement}
                                group={group}
                                currentUserId={currentUserId}
                                onDeleted={handleDeleted}
                                onStale={handleStale}
                            />
                        ))}
                    </ul>
                )}
            </Card>
        </section>
    )
}