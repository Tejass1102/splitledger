const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
const monthFormat = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
const dateFormat = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})
const dateTimeFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export function formatMoney(value) {
    return money.format(value)
}

// "2026-10-05" -> a local Date. new Date("2026-10-05") would be read as UTC and
// can show the wrong day in some timezones, so we build it from its parts.
function parseLocalDate(iso) {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day)
}

// "2026-10-01" -> "October 2026"
export function formatMonth(iso) {
    return monthFormat.format(parseLocalDate(iso))
}

// "2026-10-05" -> "5 Oct 2026"
export function formatDate(iso) {
    return dateFormat.format(parseLocalDate(iso))
}

// Instant from the backend ("2026-10-24T03:30:00Z") -> "24 Oct 2026, 9:00 am" in the browser's timezone
export function formatDateTime(instant) {
    const date = typeof instant === 'number' ? new Date(instant * 1000) : new Date(instant)
    return dateTimeFormat.format(date)
}

// 1 -> 1st, 2 -> 2nd, 3 -> 3rd, 11 -> 11th, 22 -> 22nd ...
export function ordinal(n) {
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`
    switch (n % 10) {
        case 1:
            return `${n}st`
        case 2:
            return `${n}nd`
        case 3:
            return `${n}rd`
        default:
            return `${n}th`
    }
}

// Date -> "2026-10-24" using the browser's local day
export function toIsoDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

export function todayIso() {
    return toIsoDate(new Date())
}

// { from: first day of this month, to: last day of this month }
export function currentMonthRange() {
    const now = new Date()
    return {
        from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
}