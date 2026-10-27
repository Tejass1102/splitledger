import { useState } from 'react'
import { describeError } from '../../api/client'
import { groupExpensesApi } from '../../api/groupExpenses'
import { todayIso } from '../../utils/format'
import {
    formatCentiPercent,
    formatMinor,
    minorToText,
    parseMinor,
    percentsFromShares,
    splitByPercent,
    splitEqual,
} from '../../utils/splits'
import Alert from '../Alert'
import FormField from '../FormField'
import SelectField from '../SelectField'

const DESCRIPTION_MAX = 255
const TOP_FIELDS = ['amount', 'expenseDate', 'description', 'paidByMemberId', 'splitType', 'splits']

const SPLIT_TYPES = [
    { key: 'EQUAL', label: 'Equally' },
    { key: 'EXACT', label: 'By amounts' },
    { key: 'PERCENTAGE', label: 'By percentages' },
]

function initialForm(expense, members, currentUserId) {
    if (!expense) {
        const me = members.find((m) => m.userId === currentUserId)
        return {
            amount: '',
            expenseDate: todayIso(),
            description: '',
            paidBy: String((me ?? members[0])?.id ?? ''),
            splitType: 'EQUAL',
            selected: {}, // memberId -> ticked; members not listed are ticked by default when adding
            values: {}, // memberId -> amount or percentage text
        }
    }

    const totalMinor = parseMinor(String(expense.amount))
    const shareMinors = expense.splits.map((s) => parseMinor(String(s.shareAmount)) ?? 0)
    const selected = {}
    const values = {}
    expense.splits.forEach((s) => {
        selected[s.memberId] = true
    })

    if (expense.splitType === 'EXACT') {
        expense.splits.forEach((s, i) => {
            values[s.memberId] = minorToText(shareMinors[i])
        })
    } else if (expense.splitType === 'PERCENTAGE' && totalMinor > 0) {
        // Only the shares are saved, so the percentages are worked out from them
        const percents = percentsFromShares(shareMinors, totalMinor)
        expense.splits.forEach((s, i) => {
            values[s.memberId] = minorToText(percents[i])
        })
    }

    return {
        amount: minorToText(totalMinor),
        expenseDate: expense.expenseDate,
        description: expense.description,
        paidBy: String(expense.paidByMemberId),
        splitType: expense.splitType,
        selected,
        values,
    }
}

const sum = (list) => list.reduce((total, value) => total + (value ?? 0), 0)

// expense = null -> add form; expense = a GroupExpenseResponse -> edit form.
// idPrefix keeps element ids unique when several forms are on the page.
export default function GroupExpenseForm({
                                             groupId,
                                             expense,
                                             members,
                                             currentUserId,
                                             idPrefix,
                                             onSaved,
                                             onCancel,
                                             onStale,
                                         }) {
    const editing = Boolean(expense)
    const [form, setForm] = useState(() => initialForm(expense, members, currentUserId))
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [rowErrors, setRowErrors] = useState({}) // memberId -> message
    const [submitting, setSubmitting] = useState(false)

    // Adding: everyone is ticked unless unticked. Editing: only the members of the saved split.
    const isIncluded = (id) => form.selected[id] ?? !editing
    const included = members.filter((m) => isIncluded(m.id))
    // If the chosen payer disappeared meanwhile, fall back to "Choose who paid"
    const payerValue = members.some((m) => String(m.id) === form.paidBy) ? form.paidBy : ''

    function update(changes) {
        setForm((current) => ({ ...current, ...changes }))
    }

    function clearErrors() {
        setError('')
        setFieldErrors({})
        setRowErrors({})
    }

    function toggleMember(id) {
        setForm((current) => ({
            ...current,
            selected: { ...current.selected, [id]: !(current.selected[id] ?? !editing) },
        }))
    }

    function setAll(on) {
        update({ selected: Object.fromEntries(members.map((m) => [m.id, on])) })
    }

    function setValue(id, value) {
        setForm((current) => ({ ...current, values: { ...current.values, [id]: value } }))
    }

    function changeSplitType(type) {
        if (type === form.splitType) return
        // Amounts and percentages are different numbers, so start the values fresh
        update({ splitType: type, values: {} })
        clearErrors()
    }

    // ---- Live preview (same rounding rules as the backend) ----
    const totalMinor = parseMinor(form.amount)
    const hasTotal = totalMinor !== null && totalMinor > 0
    const valueMinors = included.map((m) => parseMinor(form.values[m.id]))
    const allValid = valueMinors.every((v) => v !== null && v > 0)
    const shareById = {} // memberId -> paise
    let summary = null // { ok, text }

    if (form.splitType === 'EQUAL') {
        if (hasTotal && included.length > 0) {
            splitEqual(totalMinor, included.length).forEach((share, i) => {
                shareById[included[i].id] = share
            })
        }
    } else if (form.splitType === 'EXACT') {
        const assigned = sum(valueMinors)
        if (!hasTotal) {
            summary = { ok: false, text: 'Enter the total amount to check the split.' }
        } else {
            const left = totalMinor - assigned
            if (left === 0 && allValid) {
                summary = { ok: true, text: `All ${formatMinor(totalMinor)} is assigned.` }
            } else if (left >= 0) {
                summary = {
                    ok: false,
                    text: `${formatMinor(assigned)} of ${formatMinor(totalMinor)} assigned, ${formatMinor(left)} left.`,
                }
            } else {
                summary = {
                    ok: false,
                    text: `${formatMinor(assigned)} of ${formatMinor(totalMinor)} assigned, ${formatMinor(-left)} too much.`,
                }
            }
        }
    } else {
        const assigned = sum(valueMinors)
        const left = 10000 - assigned
        if (left === 0 && allValid) {
            summary = { ok: true, text: '100% is assigned.' }
            if (hasTotal) {
                splitByPercent(totalMinor, valueMinors).forEach((share, i) => {
                    shareById[included[i].id] = share
                })
            }
        } else if (left >= 0) {
            summary = {
                ok: false,
                text: `${formatCentiPercent(assigned)} of 100% assigned, ${formatCentiPercent(left)} left.`,
            }
        } else {
            summary = {
                ok: false,
                text: `${formatCentiPercent(assigned)} of 100% assigned, ${formatCentiPercent(-left)} too much.`,
            }
        }
    }

    // Puts each backend message where it belongs: a field, a member row, or the banner
    function applyServerErrors(described, sentMembers) {
        const top = {}
        const rows = {}
        const other = []

        for (const [key, message] of Object.entries(described.fieldErrors)) {
            const rowMatch = /^splits\[(\d+)\]/.exec(key)
            if (rowMatch) {
                const member = sentMembers[Number(rowMatch[1])]
                if (member) rows[member.id] = message
                else other.push(message)
            } else if (TOP_FIELDS.includes(key)) {
                top[key] = message
            } else {
                other.push(message)
            }
        }

        setFieldErrors(top)
        setRowErrors(rows)
        const mapped = Object.keys(top).length + Object.keys(rows).length > 0
        setError(other.length > 0 ? other.join(' ') : mapped ? '' : described.message)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        clearErrors()

        // Blank fields are caught here; every other rule (sums, ranges, decimals) comes from the backend
        const missing = {}
        if (form.amount.trim() === '') missing.amount = 'Amount is required'
        if (form.expenseDate === '') missing.expenseDate = 'Date is required'
        if (form.description.trim() === '') missing.description = 'Description is required'
        if (payerValue === '') missing.paidByMemberId = 'Payer is required'
        if (included.length === 0) missing.splits = 'At least one member is needed in the split'

        const rowMissing = {}
        if (form.splitType !== 'EQUAL') {
            included.forEach((m) => {
                if ((form.values[m.id] ?? '').trim() === '') {
                    rowMissing[m.id] = form.splitType === 'EXACT' ? 'Amount is required' : 'Percentage is required'
                }
            })
        }
        if (Object.keys(missing).length > 0 || Object.keys(rowMissing).length > 0) {
            setFieldErrors(missing)
            setRowErrors(rowMissing)
            return
        }

        const sentMembers = included
        const payload = {
            amount: Number(form.amount),
            expenseDate: form.expenseDate,
            description: form.description,
            paidByMemberId: Number(payerValue),
            splitType: form.splitType,
            // EQUAL sends only the member ids; the other modes send each member's value
            splits: sentMembers.map((m) =>
                form.splitType === 'EQUAL'
                    ? { memberId: m.id }
                    : { memberId: m.id, value: Number(form.values[m.id]) },
            ),
        }

        setSubmitting(true)
        try {
            const saved = editing
                ? await groupExpensesApi.update(groupId, expense.id, payload)
                : await groupExpensesApi.create(groupId, payload)
            onSaved(saved, editing)
            if (!editing) {
                // Keep date, payer, split type and ticked members for quick entry of the next expense
                update({ amount: '', description: '', values: {} })
            }
        } catch (err) {
            const described = describeError(err)
            if (err.status === 404) {
                // The group, the expense or a member no longer exists
                onStale(described.message)
            } else {
                applyServerErrors(described, sentMembers)
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Alert type="error">{error}</Alert>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label="Total amount (INR)"
                    name={`${idPrefix}amount`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => update({ amount: e.target.value })}
                    error={fieldErrors.amount}
                />
                <FormField
                    label="Date"
                    name={`${idPrefix}expenseDate`}
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => update({ expenseDate: e.target.value })}
                    error={fieldErrors.expenseDate}
                />
            </div>

            <div>
                <FormField
                    label="Description"
                    name={`${idPrefix}description`}
                    type="text"
                    placeholder="e.g. Dinner at the beach shack"
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    error={fieldErrors.description}
                />
                <p
                    className={`mt-1 text-right text-xs ${
                        form.description.length > DESCRIPTION_MAX ? 'text-red-600' : 'text-slate-400'
                    }`}
                >
                    {form.description.length}/{DESCRIPTION_MAX}
                </p>
            </div>

            <SelectField
                label="Paid by"
                name={`${idPrefix}paidBy`}
                value={payerValue}
                onChange={(e) => update({ paidBy: e.target.value })}
                error={fieldErrors.paidByMemberId}
            >
                <option value="">Choose who paid</option>
                {members.map((m) => (
                    <option key={m.id} value={m.id}>
                        {m.displayName}
                    </option>
                ))}
            </SelectField>

            <div>
                <p className="mb-2 text-sm font-medium text-slate-700">How to split</p>
                <div className="inline-flex flex-wrap rounded-lg bg-slate-100 p-1" role="tablist">
                    {SPLIT_TYPES.map((type) => (
                        <button
                            key={type.key}
                            type="button"
                            role="tab"
                            aria-selected={form.splitType === type.key}
                            onClick={() => changeSplitType(type.key)}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                                form.splitType === type.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                            }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-700">
                        Split between ({included.length} of {members.length})
                    </p>
                    <div className="flex gap-3 text-xs">
                        <button
                            type="button"
                            onClick={() => setAll(true)}
                            className="font-medium text-indigo-700 hover:underline"
                        >
                            Select all
                        </button>
                        <button
                            type="button"
                            onClick={() => setAll(false)}
                            className="font-medium text-indigo-700 hover:underline"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {fieldErrors.splits && <p className="mb-1 text-sm text-red-600">{fieldErrors.splits}</p>}

                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-3">
                    {members.map((m) => {
                        const on = isIncluded(m.id)
                        const share = shareById[m.id]
                        return (
                            <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                                <label className="flex min-w-0 flex-1 basis-40 items-center gap-2 text-sm text-slate-900">
                                    <input
                                        type="checkbox"
                                        checked={on}
                                        onChange={() => toggleMember(m.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                    />
                                    <span className="truncate">{m.displayName}</span>
                                </label>

                                {on && form.splitType !== 'EQUAL' && (
                                    <div className="flex items-center gap-1.5">
                                        {form.splitType === 'EXACT' && <span className="text-sm text-slate-500">₹</span>}
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            inputMode="decimal"
                                            aria-label={`${form.splitType === 'EXACT' ? 'Amount' : 'Percentage'} for ${m.displayName}`}
                                            value={form.values[m.id] ?? ''}
                                            onChange={(e) => setValue(m.id, e.target.value)}
                                            className={`w-28 rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                rowErrors[m.id] ? 'border-red-400' : 'border-slate-300'
                                            }`}
                                        />
                                        {form.splitType === 'PERCENTAGE' && (
                                            <span className="text-sm text-slate-500">%</span>
                                        )}
                                    </div>
                                )}

                                {on && share !== undefined && form.splitType !== 'EXACT' && (
                                    <span className="ml-auto text-sm text-slate-600">
                    {form.splitType === 'PERCENTAGE' ? `= ${formatMinor(share)}` : formatMinor(share)}
                  </span>
                                )}

                                {rowErrors[m.id] && (
                                    <p className="basis-full text-sm text-red-600">{rowErrors[m.id]}</p>
                                )}
                            </li>
                        )
                    })}
                </ul>

                {summary && (
                    <p className={`mt-2 text-sm ${summary.ok ? 'text-green-700' : 'text-amber-700'}`}>
                        {summary.text}
                    </p>
                )}
                {editing && form.splitType === 'PERCENTAGE' && (
                    <p className="mt-2 text-xs text-slate-500">
                        Percentages are worked out from the saved shares, so check that they add up to 100.
                    </p>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? 'Saving...' : editing ? 'Save changes' : 'Add expense'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    )
}