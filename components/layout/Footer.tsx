'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-200 z-30 shadow-sm">
      <div className="h-full flex flex-col sm:flex-row items-center justify-between px-4 lg:pl-72 lg:pr-6 gap-2 sm:gap-0">
        <div className="text-xs sm:text-sm text-primary-600 font-medium text-center sm:text-left">
          © {currentYear} SKC Caterers. All rights reserved.
        </div>
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-primary-500">
          <span className="hidden sm:inline">Established 1989</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden md:inline">Proprietor: Telidevara Rajendraprasad</span>
        </div>
      </div>
    </footer>
  )
}
