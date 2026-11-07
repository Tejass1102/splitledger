import { currentMonthKey, formatMonthKey, shiftMonth } from '../../utils/format'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import Button from '../Button'

const iconButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export default function MonthSwitcher({ month, onChange }) {
    const isCurrent = month === currentMonthKey()

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-surface p-1 ring-1 ring-line">
                <button
                    onClick={() => onChange(shiftMonth(month, -1))}
                    aria-label="Previous month"
                    className={iconButton}
                >
                    <ChevronLeftIcon />
                </button>
                <span className="min-w-32 text-center text-sm font-semibold text-ink" aria-live="polite">
                    {formatMonthKey(month)}
                </span>
                <button
                    onClick={() => onChange(shiftMonth(month, 1))}
                    aria-label="Next month"
                    className={iconButton}
                >
                    <ChevronRightIcon />
                </button>
            </div>
            {!isCurrent && (
                <Button variant="ghost" onClick={() => onChange(currentMonthKey())}>
                    This month
                </Button>
            )}
        </div>
    )
}