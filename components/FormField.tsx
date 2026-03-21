"use client";
import { useState } from 'react'
import { IconType } from 'react-icons'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

interface FormFieldProps {
  name: string
  label: string
  type?: string
  value: any
  onChange: (name: string, value: any) => void
  icon?: IconType
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
}

export default function FormField({
  name,
  label,
  type = 'text',
  value,
  onChange,
  icon: Icon,
  placeholder,
  required = false,
  error,
  className = ''
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = type === 'checkbox' ? e.target.checked : e.target.value
    onChange(name, val)
  }

  if (type === 'checkbox') {
    return (
      <div className={`flex items-center ${className}`}>
        <label className="flex items-center cursor-pointer touch-manipulation min-h-[44px] lg:min-h-[32px] xl:min-h-[36px]">
          <input
            type="checkbox"
            checked={!!value}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 w-4 h-4 cursor-pointer"
          />
          <span className="ml-2 sm:ml-3 text-gray-600 text-xs sm:text-sm md:text-base lg:text-xs xl:text-sm">{label}</span>
        </label>
      </div>
    )
  }

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm sm:text-base lg:text-sm xl:text-base font-medium text-gray-700 mb-1.5 lg:mb-1 xl:mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 lg:pl-3 xl:pl-4 flex items-center pointer-events-none">
            <Icon className="text-gray-400 text-sm sm:text-base lg:text-sm xl:text-base" />
          </div>
        )}
        <input
          id={name}
          type={inputType}
          value={value || ''}
          onChange={handleChange}
          className={`block w-full ${Icon ? 'pl-10 sm:pl-12 lg:pl-10 xl:pl-12' : 'pl-3 sm:pl-4'} ${isPassword ? 'pr-12 sm:pr-14' : 'pr-3 sm:pr-4'} py-3 sm:py-3.5 md:py-4 lg:py-2 xl:py-2.5 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm sm:text-base lg:text-sm xl:text-base hover:border-gray-400`}
          placeholder={placeholder}
          required={required}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash className="text-base sm:text-lg lg:text-base xl:text-lg" /> : <FaEye className="text-base sm:text-lg lg:text-base xl:text-lg" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
