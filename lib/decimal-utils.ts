import { Prisma } from '@prisma/client'

/**
 * Transforms an object or array, converting Prisma Decimal instances to numbers.
 * This is necessary because Prisma returns Decimal.js objects which don't serialize
 * to plain numbers in JSON.
 */
export function transformDecimal(value: any): any {
    if (value instanceof Prisma.Decimal) {
        return value.toNumber()
    }

    if (Array.isArray(value)) {
        return value.map(transformDecimal)
    }

    if (value && typeof value === 'object' && !(value instanceof Date)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, val]) => [key, transformDecimal(val)])
        )
    }

    return value
}
