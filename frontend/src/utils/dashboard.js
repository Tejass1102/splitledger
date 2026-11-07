import { expensesApi } from '../api/expenses'
import { incomesApi } from '../api/incomes'
import { summaryApi } from '../api/summary'
import { formatMonthKey, formatMonthShort, monthKeysEnding, monthRange } from './format'

// Percentage change from previous to current. null when it cannot be computed
// sensibly (previous is 0 or a value is missing), so the UI can hide it.
export function percentChange(current, previous) {
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null
    return ((current - previous) / Math.abs(previous)) * 100
}

// Share of income that was not spent, in percent. null when there is no income.
export function savingsRate(totalIncome, totalExpense) {
    if (!Number.isFinite(totalIncome) || !Number.isFinite(totalExpense) || totalIncome <= 0) {
        return null
    }
    return ((totalIncome - totalExpense) / totalIncome) * 100
}

// The `count` months ending at `month`, one /summary/monthly call each, in parallel
export async function loadTrend(month, count = 6) {
    const keys = monthKeysEnding(month, count)
    const results = await Promise.all(keys.map((key) => summaryApi.monthly(key)))
    return keys.map((key, index) => ({
        key,
        label: formatMonthShort(key),
        fullLabel: formatMonthKey(key),
        income: Number(results[index].totalIncome),
        expense: Number(results[index].totalExpense),
    }))
}

// Latest `limit` transactions of the month, expenses and incomes merged, newest first
export async function loadRecent(month, limit = 5) {
    const range = monthRange(month)
    const [expenses, incomes] = await Promise.all([
        expensesApi.list(range),
        incomesApi.list(range),
    ])

    const rows = [
        ...expenses.map((item) => {
            const note = item.note?.trim()
            const category = item.categoryName ?? 'Uncategorised'
            return {
                id: `expense-${item.id}`,
                type: 'EXPENSE',
                title: note || category,
                category,
                hasNote: Boolean(note),
                date: item.expenseDate,
                amount: Number(item.amount),
                createdAt: item.createdAt ?? '',
            }
        }),
        ...incomes.map((item) => {
            const note = item.note?.trim()
            const category = item.categoryName ?? 'Uncategorised'
            return {
                id: `income-${item.id}`,
                type: 'INCOME',
                title: note || category,
                category,
                hasNote: Boolean(note),
                date: item.incomeDate,
                amount: Number(item.amount),
                createdAt: item.createdAt ?? '',
            }
        }),
    ]

    rows.sort((a, b) =>
        a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
    )
    return rows.slice(0, limit)
}