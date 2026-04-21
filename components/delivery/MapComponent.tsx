'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { pusherClient } from '@/lib/pusher'
import { formatDateTime } from '@/lib/utils'

// Fix Leaflet marker icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // Delivery truck icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
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

export default function MapComponent() {
  const [activeWorkers, setActiveWorkers] = useState<Record<string, WorkerState>>({})

  useEffect(() => {
    const channel = pusherClient.subscribe('delivery-tracking')

    channel.bind('location-update', (data: TrackingUpdate) => {
      setActiveWorkers((prev) => {
        const worker = prev[data.workforceId] || {
          name: data.workerName,
          history: [],
        }

        return {
          ...prev,
          [data.workforceId]: {
            ...worker,
            currentLocation: { lat: data.lat, lng: data.lng },
            history: [...worker.history, [data.lat, data.lng]],
            lastUpdate: data.timestamp,
          }
        }
      })
    })

    return () => {
      pusherClient.unsubscribe('delivery-tracking')
    }
  }, [])

  const defaultCenter: [number, number] = [17.3850, 78.4867] // Hyderabad

  return (
    <div className="h-[calc(100vh-200px)] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {Object.entries(activeWorkers).map(([id, worker]) => (
          <div key={id}>
            {/* Trail / Breadcrumbs */}
            <Polyline 
              positions={worker.history} 
              pathOptions={{ color: '#ea580c', weight: 3, opacity: 0.6, dashArray: '5, 10' }} 
            />
            
            {/* Current Position Marker */}
            <Marker position={[worker.currentLocation.lat, worker.currentLocation.lng]} icon={customIcon}>
              <Popup>
                <div className="p-2 min-w-[150px]">
                  <div className="font-black text-orange-600 uppercase text-xs mb-1">Active Delivery</div>
                  <div className="font-bold text-lg text-slate-800">{worker.name}</div>
                  <hr className="my-2" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Last Updated</div>
                  <div className="text-xs font-mono text-slate-600">{formatDateTime(worker.lastUpdate)}</div>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}
      </MapContainer>
    </div>
  )
}
