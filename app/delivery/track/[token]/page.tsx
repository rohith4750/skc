'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { FaMapMarkerAlt, FaSatellite, FaCheckCircle, FaExclamationTriangle, FaTruck, FaHistory } from 'react-icons/fa'

import { toast } from 'sonner'

export default function DeliveryTrackPage() {
  const params = useParams()
  const token = params.token as string
  
  const [tracking, setTracking] = useState(false)
  const [workerName, setWorkerName] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'tracking' | 'error'>('idle')
  const watchId = useRef<number | null>(null)

  // Verify token on mount
  useEffect(() => {
    // This could be an API call to get worker name, for now keep it simple
    // If the API returns 403, we know the token is invalid
  }, [token])

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setStatus('tracking')
    setTracking(true)
    toast.success('Real-time tracking started')

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setCoords({ lat: latitude, lng: longitude })
        setAccuracy(accuracy)

        try {
          const res = await fetch('/api/delivery/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              lat: latitude,
              lng: longitude
            })
          })

          if (!res.ok) {
            const data = await res.json()
            if (data.error === 'Invalid tracking token' || data.error === 'Tracking disabled by admin') {
              stopTracking()
              const msg = data.error === 'Tracking disabled by admin' 
                ? 'Your tracking session has been ended by the administrator.' 
                : 'Invalid session. Please use a valid tracking link.'
              toast.error(msg, { duration: 10000 })
            }
          }
        } catch (error) {
          console.error('Failed to send location:', error)
        }
      },
      (error) => {
        console.error(error)
        setStatus('error')
        toast.error('Error getting location. Please check GPS settings.')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      }
    )
  }

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setTracking(false)
    setStatus('idle')
    toast.info('Tracking paused')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-500/20 via-slate-900 to-slate-950">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header/Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/30 ring-4 ring-orange-600/20">
            <FaTruck className="text-4xl text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Driver Tracking</h1>
            <p className="text-slate-400 text-sm">SKC Caterers - Delivery System</p>
          </div>
        </div>

        {/* Main Status Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-500 ${tracking ? 'bg-orange-500 animate-pulse' : 'bg-slate-600'}`}></div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              {tracking ? (
                <div className="flex items-center space-x-2 text-orange-500">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                  <span className="font-bold text-lg uppercase tracking-widest">Live: Transmitting</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-500">
                  <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                  <span className="font-bold text-lg uppercase tracking-widest">Idle: Ready</span>
                </div>
              )}
            </div>

            {coords ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Latitude</span>
                  <span className="text-xl font-mono font-bold text-orange-200">{coords.lat.toFixed(6)}</span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Longitude</span>
                  <span className="text-xl font-mono font-bold text-orange-200">{coords.lng.toFixed(6)}</span>
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-500 italic">
                {tracking ? 'Detecting satellite signal...' : 'Click Start to begin tracking'}
              </div>
            )}

            {accuracy !== null && (
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <FaSatellite className="text-orange-500" />
                <span>GPS Accuracy: ±{accuracy.toFixed(1)} meters</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4">
          {!tracking ? (
            <button
              onClick={startTracking}
              className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl shadow-orange-600/30 transition-all active:scale-95 flex items-center justify-center space-x-3 group"
            >
              <FaMapMarkerAlt className="group-hover:animate-bounce" />
              <span>Start Tracking</span>
            </button>
          ) : (
            <div className="w-full py-5 bg-orange-600/20 border-2 border-orange-500/50 text-orange-500 rounded-2xl font-black text-xl uppercase tracking-widest flex items-center justify-center space-x-3 cursor-default">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
              <span>Tracking Active</span>
            </div>
          )}
        </div>

        {/* Information/Help */}
        <div className="flex items-start bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-left">
          <FaCheckCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
          <p className="text-xs text-blue-200 leading-relaxed">
            Please keep this tab open and your GPS enabled during delivery. 
            Data is transmitted securely to the admin dashboard.
          </p>
        </div>

        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          Powered by SKC Real-Time Tracking Engine
        </p>
      </div>
    </div>
  )
}
