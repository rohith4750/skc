'use client'

import dynamic from 'next/dynamic'
import { FaMapMarkedAlt, FaTruck, FaUsers, FaCircle, FaLink, FaWhatsapp } from 'react-icons/fa'

// Import MapComponent with SSR disabled as it uses Leaflet which requires 'window'
const MapComponent = dynamic(
  () => import('@/components/delivery/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh-200px)] w-full bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Initializing Real-Time Map System...</p>
        </div>
      </div>
    )
  }
)

export default function DeliveryMapDashboard() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-black uppercase tracking-widest">Live Operations</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <FaMapMarkedAlt className="text-orange-600" />
            Delivery Tracking
          </h1>
          <p className="text-slate-500 mt-1">Real-time GPS monitoring of workforce and delivery personnel</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Connection Active</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-100"></div>
          <div className="flex items-center gap-2 text-orange-600">
            <FaUsers />
            <span className="text-sm font-black">Live Monitoring</span>
          </div>
        </div>
      </div>

      {/* Map Control Stats (Placeholders for real-time aggregation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
            <FaTruck className="text-orange-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">Active</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tracking Sessions</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
            <FaCircle className="text-blue-600 group-hover:text-white transition-colors text-[8px]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">Pusher</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">WebSocket Status</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hidden lg:flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-500 transition-colors">
            <FaMapMarkedAlt className="text-green-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">PostgreSQL</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Location Storage</div>
          </div>
        </div>
      </div>
      
      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
        <div className="bg-blue-500 p-2 rounded-lg text-white">
          <FaUsers className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight">How to track drivers?</h4>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Go to <strong>Workforce Management</strong>, find the transport member, and click the 
            <span className="mx-1 p-1 bg-white rounded border border-blue-200 inline-flex items-center"><FaLink className="text-[8px] mr-1" /> Link</span> 
            or <span className="mx-1 p-1 bg-white rounded border border-blue-200 inline-flex items-center"><FaWhatsapp className="text-[8px] mr-1 text-green-600" /> WhatsApp</span> 
            button to share their unique tracking link. Tracking begins once they click "Start Tracking" on their phone.
          </p>
        </div>
      </div>

      {/* The Map Component */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <MapComponent />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] pt-4">
        &copy; {new Date().getFullYear()} SKC Real-Time Operations Portal
      </div>
    </div>
  )
}
