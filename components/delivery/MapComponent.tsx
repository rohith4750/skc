'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { pusherClient } from '@/lib/pusher'
import { formatDateTime } from '@/lib/utils'
import { FaMapMarkedAlt, FaHistory, FaClock } from 'react-icons/fa'
import { toast } from 'sonner'

// Custom Auto Rickshaw Icon
const autoIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45],
  className: 'drop-shadow-2xl'
})

interface TrackingUpdate {
  workforceId: string
  workerName: string
  lat: number
  lng: number
  timestamp: string
}

interface WorkerState {
  currentLocation: { lat: number; lng: number }
  name: string
  history: [number, number][]
  lastUpdate: string
}

// User Location Icon (Blue Dot)
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3601/3601831.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

export default function MapComponent() {
  const [activeWorkers, setActiveWorkers] = useState<Record<string, WorkerState>>({})
  const [adminLocation, setAdminLocation] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [map, setMap] = useState<L.Map | null>(null)

  // 1. Initial Fetch of Historical Data
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/delivery/location')
        const data = await res.json()
        if (data.workers) {
          setActiveWorkers(data.workers)
        }
      } catch (error) {
        console.error('Failed to fetch tracking history:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  // 2. Real-time Updates via Pusher
  useEffect(() => {
    if (!pusherClient) return

    const channel = pusherClient.subscribe('delivery-tracking')

    channel.bind('location-update', (data: TrackingUpdate) => {
      setActiveWorkers((prev) => {
        const worker = prev[data.workforceId] || {
          name: data.workerName,
          history: [],
        }

        // Avoid duplicate history points if they haven't moved
        const lastPoint = worker.history[worker.history.length - 1]
        const isNewPoint = !lastPoint || lastPoint[0] !== data.lat || lastPoint[1] !== data.lng

        return {
          ...prev,
          [data.workforceId]: {
            ...worker,
            currentLocation: { lat: data.lat, lng: data.lng },
            history: isNewPoint ? [...worker.history, [data.lat, data.lng]] : worker.history,
            lastUpdate: data.timestamp,
          }
        }
      })
    })

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe('delivery-tracking')
      }
  // 3. Admin Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAdminLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => console.error('Admin location error:', error),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const handleFitAll = () => {
    if (!map) return

    const points: L.LatLngExpression[] = []
    
    // Add admin location
    if (adminLocation) points.push(adminLocation)
    
    // Add all workers
    Object.values(activeWorkers).forEach(w => {
      points.push([w.currentLocation.lat, w.currentLocation.lng])
    })

    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  const defaultCenter: [number, number] = [17.3850, 78.4867] // Hyderabad

  if (!pusherClient) {
    return (
      <div className="h-[calc(100vh-200px)] w-full bg-slate-900 rounded-3xl flex flex-col items-center justify-center p-8 text-center border-2 border-slate-800 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"></div>
        <div className="w-20 h-20 bg-orange-600/20 rounded-2xl flex items-center justify-center mb-6 relative">
          <FaMapMarkedAlt className="text-4xl text-orange-500 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3 tracking-tight uppercase">Live Monitoring Disabled</h3>
        <p className="text-slate-400 max-w-sm text-sm leading-relaxed font-medium">
          Real-time capabilities require the Pusher engine. Please configure your <code className="text-orange-400 bg-orange-400/10 px-2 py-1 rounded-lg">KEYS</code> to start tracking.
        </p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative">
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="font-bold text-slate-800 uppercase tracking-widest text-xs">Loading Live Data...</span>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={handleFitAll}
          className="bg-white p-3 rounded-2xl shadow-xl flex items-center gap-2 text-slate-800 hover:bg-orange-50 hover:text-orange-600 transition-all font-bold uppercase tracking-widest text-[10px] border-2 border-slate-100"
          title="Zoom out to see everyone"
        >
          <FaMapMarkedAlt className="w-4 h-4" />
          <span>Fit All</span>
        </button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Admin/Current Location Marker */}
        {adminLocation && (
          <Marker position={adminLocation} icon={userIcon}>
            <Popup>
              <div className="p-2 font-bold text-slate-800 text-xs">
                Your Current Location
              </div>
            </Popup>
          </Marker>
        )}

        {Object.entries(activeWorkers).map(([id, worker]) => (
          <div key={id}>
            {/* Trail / Breadcrumbs with enhanced direction visual */}
            <Polyline
              positions={worker.history}
              pathOptions={{
                color: '#ea580c',
                weight: 5,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Thinner outer line for "glowing" effect */}
            <Polyline
              positions={worker.history}
              pathOptions={{
                color: '#fb923c',
                weight: 10,
                opacity: 0.2,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />

            {/* Current Position Marker */}
            <Marker position={[worker.currentLocation.lat, worker.currentLocation.lng]} icon={autoIcon}>
              <Popup>
                <div className="p-3 min-w-[180px] bg-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-black uppercase tracking-widest">
                      Live Delivery
                    </div>
                  </div>
                  <div className="font-black text-xl text-slate-900 tracking-tight leading-tight mb-3">
                    {worker.name}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <FaHistory className="mr-2 text-orange-500" />
                      Trip History: {worker.history.length} pts
                    </div>
                    <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <FaClock className="mr-2 text-orange-500" />
                      Last Seen: {formatDateTime(worker.lastUpdate)}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (confirm(`Stop tracking for ${worker.name}?`)) {
                        try {
                          const res = await fetch('/api/delivery/stop', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ workforceId: id })
                          })
                          if (res.ok) {
                            setActiveWorkers(prev => {
                              const newState = { ...prev }
                              delete newState[id]
                              return newState
                            })
                            toast.success(`Tracking stopped for ${worker.name}`)
                          }
                        } catch (err) {
                          toast.error('Failed to stop tracking')
                        }
                      }
                    }}
                    className="w-full mt-4 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
                  >
                    Stop Tracking
                  </button>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}
      </MapContainer>
    </div>
  )
}
