'use client'

import Image from 'next/image'
import { useState } from 'react'

interface LogoProps {
  className?: string
  showTagline?: boolean
  variant?: 'full' | 'compact' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  textColor?: 'white' | 'dark'
}

export default function Logo({ 
  className = '', 
  showTagline = true,
  variant = 'full',
  size = 'md',
  textColor = 'dark'
}: LogoProps) {
  const [imageError, setImageError] = useState(false)
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const textSizes = {
    sm: { main: 'text-lg', tagline: 'text-xs' },
    md: { main: 'text-2xl', tagline: 'text-sm' },
    lg: { main: 'text-4xl', tagline: 'text-base' }
  }

  const textColors = {
    white: { main: 'text-white', tagline: 'text-gray-300' },
    dark: { main: 'text-gray-900', tagline: 'text-gray-600' }
  }

  const colors = textColors[textColor]

  // Icon SVG Component (fallback)
  const IconSVG = ({ className: svgClassName }: { className?: string }) => (
    <svg 
      className={svgClassName}
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Plate/Circle background with gradient */}
      <defs>
        <linearGradient id="plateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="55" fill="url(#plateGradient)" stroke="#991B1B" strokeWidth="2"/>
      <circle cx="60" cy="60" r="48" fill="#EF4444" opacity="0.9"/>
      
      {/* Utensils */}
      <g transform="translate(60, 60)">
        {/* Fork */}
        <path d="M-20,-25 L-20,25 M-25,-25 L-25,25 M-30,-25 L-30,25 M-15,-25 L-15,-20 L-30,-20 L-30,-25 Z" 
              fill="white" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Knife */}
        <path d="M20,-25 L20,25 M15,-25 L20,-25 L20,-15 L15,-15 Z" 
              fill="white" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Spoon */}
        <ellipse cx="0" cy="20" rx="8" ry="12" fill="white"/>
        <path d="M0,20 L0,25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
    </svg>
  )

  // Logo Image Component
  const LogoImage = ({ className: imgClassName }: { className?: string }) => {
    if (imageError) {
      return <IconSVG className={imgClassName} />
    }
    
    // If className includes w-full, use regular img tag to fill width
    if (imgClassName && imgClassName.includes('w-full')) {
      return (
        <img
          src="/logo.png"
          alt="SKC Caterers Logo"
          className={imgClassName}
          onError={() => setImageError(true)}
        />
      )
    }
    
    return (
      <div className={`${imgClassName} relative`}>
        <Image
          src="/logo.png"
          alt="SKC Caterers Logo"
          fill
          className="object-contain"
          onError={() => setImageError(true)}
          priority
          sizes="(max-width: 768px) 32px, 64px"
        />
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center w-full ${className}`}>
        <LogoImage className={className.includes('w-full') ? 'w-full h-auto' : sizeClasses[size]} />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Logo Image */}
        <LogoImage className={sizeClasses[size]} />
        {/* Text */}
        <div className="flex flex-col">
          <span className={`font-bold ${colors.main} ${textSizes[size].main}`}>
            SKC Caterers
          </span>
          {showTagline && (
            <span className={`${colors.tagline} ${textSizes[size].tagline}`}>
              Est. 1989
            </span>
          )}
        </div>
      </div>
    )
  }

  // Full variant (default)
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-4">
        {/* Logo Image */}
        <LogoImage className={sizeClasses[size]} />
        
        {/* Text */}
        <div className="flex flex-col">
          <span className={`font-bold ${colors.main} ${textSizes[size].main}`}>
            SKC Caterers
          </span>
          {showTagline && (
            <span className={`${colors.tagline} ${textSizes[size].tagline}`}>
              Est. 1989
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
