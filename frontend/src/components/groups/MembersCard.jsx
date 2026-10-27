import Card from '../Card'
import AddMemberForm from './AddMemberForm'
import MemberRow from './MemberRow'

export default function MembersCard({
                                        group,
                                        currentUserId,
                                        onAdded,
                                        onRemoved,
                                        onLinked,
                                        onStale,
                                        onRefresh,
                                    }) {
    const isCreator = group.createdById === currentUserId

    return (
        <Card
            title={`Members (${group.members.length})`}
            description={
                isCreator
                    ? 'Add people, remove them, or link a guest to a registered account.'
                    : 'Anyone in the group can add members. Only the creator can remove members or link guests.'
            }
        >
            <ul className="divide-y divide-slate-100">
                {group.members.map((member) => (
                    <MemberRow
                        key={member.id}
                        group={group}
                        member={member}
                        currentUserId={currentUserId}
                        isCreator={isCreator}
                        onRemoved={onRemoved}
                        onLinked={onLinked}
                        onStale={onStale}
                        onRefresh={onRefresh}
                    />
                ))}
            </ul>

            <div className="mt-6 border-t border-slate-100 pt-5">
                <AddMemberForm groupId={group.id} onAdded={onAdded} onRefresh={onRefresh} />
            </div>
        </Card>
    )
}