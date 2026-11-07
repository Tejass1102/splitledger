import { formatMoney } from '../../utils/format'
import Button from '../Button'
import EmptyState from '../EmptyState'
import { CheckCircleIcon } from '../icons'

// settleUp is a SettleUpResponse { groupId, payments: [{ fromMemberId, fromName, toMemberId, toName, amount }] }
// onUse(payment) fills the settlement form with that payment
export default function SuggestionList({ settleUp, members, currentUserId, onUse }) {
    const userIdOf = (memberId) => members.find((m) => m.id === memberId)?.userId

    if (settleUp.payments.length === 0) {
        return (
            <EmptyState
                icon={CheckCircleIcon}
                title="No payments are needed"
                description="Nobody owes anything right now."
            />
        )
    }

    return (
        <ul className="divide-y divide-line">
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
                        <p className="text-sm text-ink">
                            {sentence}{' '}
                            <span className="font-semibold">{formatMoney(payment.amount)}</span>
                        </p>
                        <Button variant="secondary" size="sm" onClick={() => onUse(payment)}>
                            Record this payment
                        </Button>
                    </li>
                )
            })}
        </ul>
    )
}