// options: [{ value, label }]
export default function SegmentedControl({ options, value, onChange, label }) {
    return (
        <div
            role="tablist"
            aria-label={label}
            className="inline-flex max-w-full flex-wrap rounded-xl bg-subtle p-1"
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                        value === option.value
                            ? 'bg-elevated text-ink shadow-sm'
                            : 'text-muted hover:text-ink'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}