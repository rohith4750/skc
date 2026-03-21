"use client";
import { useState } from 'react'
import FormField from './FormField'
import FormError from './FormError'

export interface FormFieldSchema {
  name: string
  label: string
  type?: string
  icon?: any
  placeholder?: string
  required?: boolean
  validate?: (value: any) => string | undefined
}

interface FormEngineProps {
  fields: FormFieldSchema[]
  onSubmit: (formData: any) => Promise<void>
  defaultValues?: any
  isLoading?: boolean
  serverError?: string
  submitButtonText?: string
  submitButtonIcon?: any
  children?: React.ReactNode
}

export default function FormEngine({
  fields,
  onSubmit,
  defaultValues = {},
  isLoading = false,
  serverError,
  submitButtonText = 'Submit',
  submitButtonIcon: SubmitIcon,
  children
}: FormEngineProps) {
  const [formData, setFormData] = useState(defaultValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    fields.forEach(field => {
      if (field.required && (formData[field.name] === undefined || formData[field.name] === '' || formData[field.name] === null)) {
        newErrors[field.name] = `${field.label} is required`
      } else if (field.validate) {
        const err = field.validate(formData[field.name])
        if (err) newErrors[field.name] = err
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-3 xl:space-y-4">
      <FormError message={serverError} />
      
      {fields.map((field) => (
        <FormField
          key={field.name}
          name={field.name}
          label={field.label}
          type={field.type}
          icon={field.icon}
          placeholder={field.placeholder}
          required={field.required}
          value={formData[field.name]}
          onChange={handleFieldChange}
          error={errors[field.name]}
        />
      ))}

      {children}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-red-700 to-amber-700 text-white py-3 sm:py-3.5 md:py-4 lg:py-2 xl:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg lg:text-sm xl:text-base hover:from-red-800 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:shadow-md flex items-center justify-center gap-2 touch-manipulation min-h-[48px] lg:min-h-[40px] xl:min-h-[44px]"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            {SubmitIcon && <SubmitIcon className="text-amber-200 text-base lg:text-sm xl:text-base" />}
            {submitButtonText}
          </>
        )}
      </button>
    </form>
  )
}
