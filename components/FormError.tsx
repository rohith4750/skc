interface FormErrorProps {
  message?: string
  className?: string
}

export default function FormError({ message, className }: FormErrorProps) {
  if (!message) return null
  return <p className={`text-sm text-red-600 ${className || ''}`}>{message}</p>
}
