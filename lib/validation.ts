export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const isNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)

export const isNonNegativeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

export const isEmail = (value: unknown) => {
  if (!isNonEmptyString(value)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export const isPhone = (value: unknown) => {
  if (!isNonEmptyString(value)) return false
  return /^[0-9+\-() ]{8,15}$/.test(value)
}

export const isNonEmptyValue = (value: unknown): boolean =>
  isNonEmptyString(value) || (Array.isArray(value) && value.length > 0)

export const validateRequiredFields = (data: Record<string, unknown>, fields: string[]) => {
  const missing = fields.filter(field => !isNonEmptyValue(data[field]))
  return missing.length > 0 ? missing : null
}

export const validateEnum = (value: unknown, allowed: string[]) => {
  if (!isNonEmptyString(value)) return false
  return allowed.includes(value)
}

export const isPositiveNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
