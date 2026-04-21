'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { FaMapMarkerAlt, FaSatellite, FaCheckCircle, FaExclamationTriangle, FaTruck, FaHistory, FaLightbulb } from 'react-icons/fa'

import { toast } from 'sonner'

export default function DeliveryTrackPage() {
  const params = useParams()
  const token = params.token as string

  const [tracking, setTracking] = useState(false)
  const [workerName, setWorkerName] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'tracking' | 'error'>('idle')
  const [isSyncing, setIsSyncing] = useState(false)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [wakeLock, setWakeLock] = useState<any>(null)
  const watchId = useRef<number | null>(null)

  // 1. Wake Lock Handler
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen')
        setWakeLock(lock)
        console.log('Wake Lock acquired')
      } catch (err) {
        console.error('Wake Lock failed:', err)
      }
    }
  }

  // 2. Re-acquire wake lock on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [wakeLock])

  // 3. Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      if (wakeLock) (wakeLock as any).release()
    }
  }, [wakeLock])

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setStatus('tracking')
    setTracking(true)
    requestWakeLock() // Keep screen on
    toast.success('Real-time tracking started')

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setCoords({ lat: latitude, lng: longitude })
        setAccuracy(accuracy)

        try {
          setIsSyncing(true)
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
            // Only stop if it's a permanent permission error (403)
            if (res.status === 403) {
              const data = await res.json()
              stopTracking()
              const msg = data.error === 'Tracking disabled by admin'
                ? 'Your tracking session has been ended by the administrator.'
                : 'Invalid session. Please use a valid tracking link.'
              toast.error(msg, { duration: 10000 })
            } else {
              // For other errors (500, 502, 504), just increment errors and keep trying
              setConsecutiveErrors(prev => prev + 1)
              console.warn(`Sync Issue (${res.status}). Retrying next ping...`)
            }
          } else {
            // Clear errors on success
            setConsecutiveErrors(0)
          }
        } catch (error) {
          console.error('Network Error during sync:', error)
          setConsecutiveErrors(prev => prev + 1)
        } finally {
          setIsSyncing(false)
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

  const stopTracking = async () => {
    // 1. Stop local GPS
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }

    // 2. Release wake lock
    if (wakeLock) {
      (wakeLock as any).release()
      setWakeLock(null)
    }

    // 3. Notify server to clear from Admin Map
    try {
      await fetch('/api/delivery/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
    } catch (error) {
      console.error('Failed to notify server of stop')
    }

    setTracking(false)
    setStatus('idle')
    toast.info('Tracking finished')
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

          {tracking && (
             <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 animate-pulse">
                <FaLightbulb className="text-orange-500 text-[10px]" />
                <span className="text-[10px] font-black text-orange-200 uppercase tracking-widest">Always-On</span>
             </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-center">
              {tracking ? (
                <div className="flex items-center space-x-2 text-orange-500">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                  <span className="font-bold text-lg uppercase tracking-widest">
                    {isSyncing ? 'Syncing...' : 'Live: Transmitting'}
                  </span>
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

            {consecutiveErrors > 0 && (
              <div className="flex items-center justify-center space-x-2 text-xs text-rose-500 font-bold bg-rose-500/10 p-2 rounded-xl animate-pulse">
                <FaExclamationTriangle />
                <span>Connection weak... Reconnecting ({consecutiveErrors})</span>
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
          <p className="text-xs text-blue-200 leading-relaxed font-bold">
            Stay Awake mode is active. Please keep your screen on and browser visible for continuous tracking.
          </p>
        </div>

        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          Powered by SKC Real-Time Tracking Engine
        </p>
      </div>
    </div>
  )
}
