import { formatMoney } from '../../utils/format'

// settleUp is a SettleUpResponse { groupId, payments: [{ fromMemberId, fromName, toMemberId, toName, amount }] }
// onUse(payment) fills the settlement form with that payment
export default function SuggestionList({ settleUp, members, currentUserId, onUse }) {
    const userIdOf = (memberId) => members.find((m) => m.id === memberId)?.userId

    if (settleUp.payments.length === 0) {
        return <p className="text-sm text-slate-500">No payments are needed right now.</p>
    }

    return (
        <ul className="divide-y divide-slate-100">
            {settleUp.payments.map((payment, index) => {
                const fromYou = userIdOf(payment.fromMemberId) === currentUserId
                const toYou = userIdOf(payment.toMemberId) === currentUserId
                const sentence = fromYou
                    ? `You pay ${payment.toName}`
                    : toYou
                        ? `${payment.fromName} pays you`
                        : `${payment.fromName} pays ${payment.toName}`

                return (
                    <li
                        key={`${payment.fromMemberId}-${payment.toMemberId}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                        <p className="text-sm text-slate-900">
                            {sentence}{' '}
                            <span className="font-semibold">{formatMoney(payment.amount)}</span>
                        </p>
                        <button
                            onClick={() => onUse(payment)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Record this payment
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}