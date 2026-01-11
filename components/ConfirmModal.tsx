'use client'

import { ReactNode } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      button: 'bg-secondary-500 hover:bg-secondary-600 text-white',
      icon: 'text-secondary-500',
    },
    warning: {
      button: 'bg-accent-500 hover:bg-accent-600 text-white',
      icon: 'text-accent-500',
    },
    info: {
      button: 'bg-primary-500 hover:bg-primary-600 text-white',
      icon: 'text-primary-500',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">{title}</h2>
          <div className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
