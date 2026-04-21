'use client'

import { useEffect, useState, Fragment } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { pusherClient } from '@/lib/pusher'
import { formatDateTime, formatDate } from '@/lib/utils'
import { FaMapMarkedAlt, FaHistory, FaClock, FaFlagCheckered, FaChevronDown, FaSearch, FaUser, FaCalendarAlt, FaTimes } from 'react-icons/fa'
import { toast } from 'sonner'

// Custom Destination Icon
const destIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1483/1483155.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
})

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
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [destination, setDestination] = useState<{ lat: number; lng: number; venue: string } | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  
  // History State
  const [isHistoryMode, setIsHistoryMode] = useState(false)
  const [allWorkers, setAllWorkers] = useState<any[]>([])
  const [selectedHistoryWorker, setSelectedHistoryWorker] = useState<string>('')
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [historyPath, setHistoryPath] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyStats, setHistoryStats] = useState<{ distance: string; points: number } | null>(null)

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

    // 1.1 Fetch Active Orders for Destination context
    async function fetchOrders() {
      try {
        const res = await fetch('/api/delivery/orders')
        const data = await res.json()
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch delivery orders:', error)
      }
    }
    fetchOrders()

    // 1.2 Fetch All Workers for History Selection
    async function fetchAllWorkers() {
      try {
        const res = await fetch('/api/delivery/workers')
        const data = await res.json()
        setAllWorkers(data)
      } catch (error) {
        console.error('Failed to fetch workers:', error)
      }
    }
    fetchAllWorkers()
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
    }
  }, [])

  // 3. Admin Geolocation (Watch)
  useEffect(() => {
    let watchId: number | null = null
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setAdminLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => console.error('Admin location error:', error),
        { enableHighAccuracy: true, maximumAge: 0 }
      )
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
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

  // 4. Geocode Order Venue
  const handleOrderSelect = async (orderId: string) => {
    setSelectedOrderId(orderId)
    const order = orders.find(o => o.id === orderId)
    if (!order || !order.venue) {
      setDestination(null)
      return
    }

    setIsGeocoding(true)
    try {
      // Use OSM Nominatim for free geocoding
      const query = encodeURIComponent(order.venue + ", Hyderabad")
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`)
      const data = await res.json()

      if (data && data[0]) {
        const newDest = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          venue: order.venue
        }
        setDestination(newDest)
        
        // Pan to destination
        if (map) {
          map.flyTo([newDest.lat, newDest.lng], 15)
        }
        toast.success(`Destination set to ${order.venue}`)
      } else {
        toast.error('Could not locate address on map')
        setDestination(null)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast.error('Location service error')
    } finally {
      setIsGeocoding(false)
    }
  }

  // 5. ETA Calculation Helper (Haversine)
  const calculateETA = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distanceKm = R * c
    
    // Average speed 30km/h for auto rickshaw in traffic
    const timeHours = distanceKm / 30
    const timeMinutes = Math.round(timeHours * 60)
    
    return {
      distance: distanceKm.toFixed(1),
      minutes: timeMinutes
    }
  }

  // 6. Fetch History Data
  const handleFetchHistory = async () => {
    if (!selectedHistoryWorker || !selectedHistoryDate) {
      toast.error('Please select both driver and date')
      return
    }

    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/delivery/history?workforceId=${selectedHistoryWorker}&date=${selectedHistoryDate}`)
      const data = await res.json()
      
      if (data && data.length > 0) {
        setHistoryPath(data)
        
        // Calculate total distance
        let totalDist = 0
        for (let i = 0; i < data.length - 1; i++) {
          totalDist += parseFloat(calculateETA(data[i].lat, data[i].lng, data[i+1].lat, data[i+1].lng).distance)
        }
        setHistoryStats({
          distance: totalDist.toFixed(1),
          points: data.length
        })

        // Fit map to history
        if (map) {
          const bounds = L.latLngBounds(data.map((p: any) => [p.lat, p.lng]))
          map.fitBounds(bounds, { padding: [50, 50] })
        }
        toast.success(`Loaded ${data.length} movement points`)
      } else {
        setHistoryPath([])
        setHistoryStats(null)
        toast.error('No location data found for this date')
      }
    } catch (error) {
      console.error('History fetch error:', error)
      toast.error('Failed to load history')
    } finally {
      setHistoryLoading(false)
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
        {/* Fit All Button */}
        <button 
          onClick={handleFitAll}
          className="bg-white p-3 rounded-2xl shadow-xl flex items-center gap-2 text-slate-800 hover:bg-orange-50 hover:text-orange-600 transition-all font-bold uppercase tracking-widest text-[10px] border-2 border-slate-100"
          title="Zoom out to see everyone"
        >
          <FaMapMarkedAlt className="w-4 h-4" />
          <span>Fit All</span>
        </button>

        {/* Live/History Toggle */}
        <div className="bg-white p-1 rounded-2xl shadow-xl border-2 border-slate-100 flex">
          <button 
            onClick={() => setIsHistoryMode(false)}
            className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isHistoryMode ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Live
          </button>
          <button 
            onClick={() => setIsHistoryMode(true)}
            className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isHistoryMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            History
          </button>
        </div>

        {/* Mode-specific Controls */}
        {!isHistoryMode ? (
          // LIVE MODE DESTINATION PICKER
          <div className="bg-white p-2 rounded-2xl shadow-xl border-2 border-slate-100 w-64">
            <div className="flex items-center gap-2 px-2 mb-2">
              <FaFlagCheckered className="text-slate-400 w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Destination</span>
            </div>
            <select
              value={selectedOrderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
            >
              <option value="">Select Active Order...</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.eventName || order.id.slice(0,8)} - {order.venue?.slice(0, 20)}...
                </option>
              ))}
            </select>
            {isGeocoding && (
               <div className="flex items-center gap-2 mt-2 px-2">
                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                 <span className="text-[9px] font-bold text-orange-600 animate-pulse">Locating Venue...</span>
               </div>
            )}
          </div>
        ) : (
          // HISTORY MODE CONTROLS
          <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-slate-100 w-64 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <FaUser className="text-indigo-400 w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Select Driver</span>
              </div>
              <select
                value={selectedHistoryWorker}
                onChange={(e) => setSelectedHistoryWorker(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Select Driver...</option>
                {allWorkers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <FaCalendarAlt className="text-indigo-400 w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Select Date</span>
              </div>
              <input 
                type="date" 
                value={selectedHistoryDate}
                onChange={(e) => setSelectedHistoryDate(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleFetchHistory}
              disabled={historyLoading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {historyLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <FaSearch />
                  <span>View History</span>
                </>
              )}
            </button>

            {historyStats && (
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Distance</span>
                  <span className="text-sm font-black text-indigo-700">{historyStats.distance} km</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Waypoints</span>
                  <span className="text-sm font-black text-indigo-700">{historyStats.points}</span>
                </div>
              </div>
            )}
          </div>
        )}
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

        {/* Order Destination Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup>
              <div className="p-3 min-w-[200px]">
                <div className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-1">
                  Target Venue
                </div>
                <div className="font-black text-slate-900 text-sm mb-1 leading-tight">
                  {destination.venue}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {orders.find(o => o.id === selectedOrderId)?.customer?.name}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Admin/Current User Location Marker */}
        {adminLocation && (
          <Marker position={adminLocation} icon={userIcon}>
            <Popup>
              <div className="p-2 font-bold text-slate-800 text-xs">
                Your Current Location
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Workers Rendering */}
        {!isHistoryMode && Object.entries(activeWorkers).map(([id, worker]) => (
          <Fragment key={id}>
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
            {/* ETA Line to Destination */}
            {destination && (
              <Polyline
                positions={[
                  [worker.currentLocation.lat, worker.currentLocation.lng],
                  [destination.lat, destination.lng]
                ]}
                pathOptions={{
                  color: '#2563eb',
                  weight: 2,
                  dashArray: '10, 10',
                  opacity: 0.4
                }}
              />
            )}
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
                    {destination && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Arrival Estimate</span>
                          <span className="text-xl font-black text-slate-900">
                            {calculateETA(worker.currentLocation.lat, worker.currentLocation.lng, destination.lat, destination.lng).minutes} 
                            <span className="text-[10px] lowercase ml-0.5">m</span>
                          </span>
                        </div>
                        <div className="flex items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          <FaFlagCheckered className="mr-1.5 text-blue-500" />
                          Distance: {calculateETA(worker.currentLocation.lat, worker.currentLocation.lng, destination.lat, destination.lng).distance} km
                        </div>
                      </div>
                    )}
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
          </Fragment>
        ))}

        {/* History Path Rendering */}
        {isHistoryMode && historyPath.length > 0 && (
          <Fragment>
            <Polyline
              positions={historyPath.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: '#4f46e5', // Indigo for history
                weight: 6,
                opacity: 0.7,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            
            {/* Start Marker */}
            <Marker position={[historyPath[0].lat, historyPath[0].lng]}>
              <Popup>
                <div className="p-2 text-center">
                  <div className="text-[9px] font-black text-indigo-600 uppercase">Trip Start</div>
                  <div className="text-xs font-bold">{formatDateTime(historyPath[0].timestamp)}</div>
                </div>
              </Popup>
            </Marker>

            {/* End Marker */}
            <Marker position={[historyPath[historyPath.length - 1].lat, historyPath[historyPath.length - 1].lng]}>
              <Popup>
                <div className="p-2 text-center">
                  <div className="text-[9px] font-black text-emerald-600 uppercase">Trip End</div>
                  <div className="text-xs font-bold">{formatDateTime(historyPath[historyPath.length - 1].timestamp)}</div>
                </div>
              </Popup>
            </Marker>
          </Fragment>
        )}
      </MapContainer>
    </div>
  )
}
