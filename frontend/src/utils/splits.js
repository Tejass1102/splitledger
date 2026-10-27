import { formatMoney } from './format'

// Money is handled in whole paise and percentages in hundredths of a percent, as whole
// numbers, so the preview adds up exactly the way the backend does (no floating point).

// "250.5" -> 25050, "12" -> 1200, ".5" -> 50.
// Returns null when blank, or not a plain number with at most 2 decimals.
export function parseMinor(text) {
    const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(String(text ?? '').trim())
    if (!match) return null
    const whole = match[1]
    const fraction = match[2] ?? ''
    if (whole === '' && fraction === '') return null
    return Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'))
}

// 25050 -> "250.50" (also used for percentages: 3333 -> "33.33")
export function minorToText(minor) {
    return (minor / 100).toFixed(2)
}

export function formatMinor(minor) {
    return formatMoney(minor / 100)
}

// 3333 -> "33.33%", 5000 -> "50%"
export function formatCentiPercent(centi) {
    return `${Number((centi / 100).toFixed(2))}%`
}

// Divides every product by `divisor`, rounds down, then hands the leftover units (up to
// `target`) to the entries that lost the most in rounding. Ties keep list order.
function distribute(products, divisor, target) {
    const floors = products.map((product) => product / divisor)
    const lost = products.map((product, i) => product - floors[i] * divisor)
    const extra = Number(target - floors.reduce((sum, floor) => sum + floor, 0n))

    const order = products
        .map((_, i) => i)
        .sort((a, b) => (lost[b] > lost[a] ? 1 : lost[b] < lost[a] ? -1 : a - b))

    const result = floors.map(Number)
    for (let k = 0; k < Math.min(extra, order.length); k++) {
        result[order[k]] += 1
    }
    return result
}

// Same rule as the backend: everyone gets total / n rounded down,
// and the leftover paise go to the first members of the list.
export function splitEqual(totalMinor, count) {
    const base = Math.floor(totalMinor / count)
    const extra = totalMinor - base * count
    return Array.from({ length: count }, (_, i) => (i < extra ? base + 1 : base))
}

// percents are in hundredths of a percent and must add up to 10000 (= 100%)
export function splitByPercent(totalMinor, percents) {
    const total = BigInt(totalMinor)
    return distribute(
        percents.map((percent) => total * BigInt(percent)),
        10000n,
        total,
    )
}

// Works out percentages (adding up to exactly 10000) from saved shares, used when editing
export function percentsFromShares(shareMinors, totalMinor) {
    return distribute(
        shareMinors.map((share) => BigInt(share) * 10000n),
        BigInt(totalMinor),
        10000n,
    )
}