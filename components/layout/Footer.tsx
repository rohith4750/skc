'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="fixed bottom-0 left-0 right-0 lg:left-64 xl:left-72 h-10 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-30 shadow-xs">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        <div className="text-[11px] font-semibold text-slate-600">
          © {currentYear} <span className="font-bold text-slate-800">SKC Caterers</span>. All rights reserved.
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          <span className="hidden sm:inline">Established 1989</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="hidden md:inline">Proprietor: <strong className="text-slate-700">Telidevara Rajendraprasad</strong></span>
        </div>
      </div>
    </footer>
  )
}
