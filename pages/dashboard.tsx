"use client"

import { useState } from "react"
import { useDroneStore } from "../hooks/use-drone-store"
import { MapboxMap } from "../components/mapbox-map"
import "./App.css"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    drones,
    allDrones,
    flightPaths,
    filter,
    selectedDroneId,
    isConnected,
    lastUpdate,
    getRestrictedDronesCount,
    getDroneStats,
    updateFilter,
    selectDrone,
    getFlightPath,
  } = useDroneStore()

  const handleDroneSelected = (droneId: string) => {
    selectDrone(droneId)
    // Auto-close sidebar on mobile when drone is selected
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const droneStats = getDroneStats()
  const restrictedCount = getRestrictedDronesCount()

  return (
    /* Enhanced professional layout with improved spacing and shadows */
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      <nav
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border bg-sidebar">
          <div>
            <h2 className="text-xl font-bold text-sidebar-foreground">Fleet Monitor</h2>
            <p className="text-sm text-muted-foreground">{drones.length} active units</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 bg-sidebar">
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">Filter Status</label>
          <select
            value={filter}
            onChange={(e) => updateFilter(e.target.value as any)}
            className="w-full p-3 border border-sidebar-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-sidebar-ring focus:border-transparent transition-all"
          >
            <option value="all">All Drones</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto bg-sidebar">
          {drones.map((drone) => (
            <div key={drone.id} className="border-b border-sidebar-border last:border-b-0">
              <button
                onClick={() => handleDroneSelected(drone.id)}
                className={`w-full p-4 text-left hover:bg-sidebar-accent transition-all duration-200 ${
                  selectedDroneId === drone.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base">{drone.name}</h3>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      drone.status === "active"
                        ? "bg-green-500"
                        : drone.status === "restricted"
                          ? "bg-red-500"
                          : "bg-gray-400"
                    }`}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm opacity-80">
                  <span className="capitalize">{drone.status}</span>
                  <span className="font-medium">{drone.battery}% battery</span>
                </div>
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-sidebar-border bg-sidebar">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{droneStats.active}</div>
              <div className="text-xs text-green-600 font-medium">Active</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{droneStats.inactive}</div>
              <div className="text-xs text-gray-600 font-medium">Inactive</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <header className="flex items-center justify-between p-6 bg-card border-b border-border shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
              <p className="text-sm text-muted-foreground">Real-time drone fleet monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                isConnected
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`}
              ></div>
              <span className="text-sm font-medium">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Last sync:</span> {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 bg-muted relative overflow-hidden">
        <MapboxMap 
          drones={mapDrones}
          flightPaths={flightPathsMap}
          selectedDroneId={selectedDroneId}
          onDroneSelected={handleDroneSelected}
          
        />
        </main>

        <aside className="absolute bottom-6 right-6 bg-destructive text-destructive-foreground px-6 py-4 rounded-xl shadow-lg border border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">Restricted Zones</div>
              <div className="text-2xl font-bold">{restrictedCount}</div>
            </div>
          </div>
        </aside>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
