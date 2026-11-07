import { useTheme } from '../context/ThemeContext'

function build(colors) {
    return {
        ...colors,
        tooltip: {
            contentStyle: {
                backgroundColor: colors.elevated,
                border: `1px solid ${colors.line}`,
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                color: colors.ink,
                fontSize: 13,
            },
            itemStyle: { color: colors.ink },
            labelStyle: { color: colors.muted, fontWeight: 600, marginBottom: 4 },
        },
    }
}

const LIGHT = build({
    surface: '#ffffff',
    elevated: '#ffffff',
    ink: '#111827',
    muted: '#5b6b82',
    axis: '#5b6b82',
    grid: '#e2e8f0',
    line: '#e2e8f0',
    cursor: 'rgba(79, 70, 229, 0.08)',
    income: '#16a34a',
    expense: '#dc2626',
    palette: [
        '#4f46e5',
        '#0891b2',
        '#16a34a',
        '#ca8a04',
        '#dc2626',
        '#9333ea',
        '#db2777',
        '#ea580c',
        '#64748b',
    ],
})

const DARK = build({
    surface: '#172033',
    elevated: '#1e293b',
    ink: '#f1f5f9',
    muted: '#94a3b8',
    axis: '#94a3b8',
    grid: '#334155',
    line: '#334155',
    cursor: 'rgba(129, 140, 248, 0.14)',
    income: '#4ade80',
    expense: '#f87171',
    palette: [
        '#818cf8',
        '#22d3ee',
        '#4ade80',
        '#facc15',
        '#f87171',
        '#c084fc',
        '#f472b6',
        '#fb923c',
        '#94a3b8',
    ],
})

// Colours for Recharts, which cannot read Tailwind classes. Switches with the theme.
export function useChartTheme() {
    const { isDark } = useTheme()
    return isDark ? DARK : LIGHT
}