import { Link } from 'react-router-dom'
import { buttonClass } from '../buttonStyles'
import { PlusIcon } from '../icons'

export default function QuickActions() {
    return (
        <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/expenses" className={buttonClass({ variant: 'primary' })}>
                <PlusIcon size={16} />
                Add expense
            </Link>
            <Link to="/incomes" className={buttonClass({ variant: 'secondary' })}>
                <PlusIcon size={16} />
                Add income
            </Link>
        </div>
    )
}