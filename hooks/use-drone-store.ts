"use client"

import { useState, useEffect, useCallback } from "react"

export interface Drone {
  id: string
  name: string
  status: "active" | "inactive" | "restricted"
  battery: number
  latitude: number
  longitude: number
  altitude: number
  speed: number
  lastUpdate: Date
}

export interface FlightPath {
  droneId: string
  coordinates: Array<[number, number]>
  timestamp: Date
}

export interface DroneStats {
  active: number
  inactive: number
  restricted: number
  total: number
}

type FilterType = "all" | "active" | "inactive" | "restricted"

// Mock data for demonstration
const mockDrones: Drone[] = [
  {
    id: "drone-001",
    name: "Alpha-1",
    status: "active",
    battery: 85,
    latitude: 40.7128,
    longitude: -74.006,
    altitude: 120,
    speed: 15,
    lastUpdate: new Date(),
  },
  {
    id: "drone-002",
    name: "Beta-2",
    status: "inactive",
    battery: 45,
    latitude: 40.7589,
    longitude: -73.9851,
    altitude: 0,
    speed: 0,
    lastUpdate: new Date(Date.now() - 300000),
  },
  {
    id: "drone-003",
    name: "Gamma-3",
    status: "restricted",
    battery: 92,
    latitude: 40.7505,
    longitude: -73.9934,
    altitude: 200,
    speed: 8,
    lastUpdate: new Date(Date.now() - 60000),
  },
  {
    id: "drone-004",
    name: "Delta-4",
    status: "active",
    battery: 67,
    latitude: 40.7282,
    longitude: -73.7949,
    altitude: 150,
    speed: 12,
    lastUpdate: new Date(Date.now() - 30000),
  },
  {
    id: "drone-005",
    name: "Echo-5",
    status: "active",
    battery: 78,
    latitude: 40.6892,
    longitude: -74.0445,
    altitude: 180,
    speed: 20,
    lastUpdate: new Date(Date.now() - 120000),
  },
]

const mockFlightPaths: FlightPath[] = [
  {
    droneId: "drone-001",
    coordinates: [
      [-74.006, 40.7128],
      [-74.005, 40.713],
      [-74.004, 40.7135],
    ],
    timestamp: new Date(),
  },
]

export function useDroneStore() {
  const [allDrones, setAllDrones] = useState<Drone[]>(mockDrones)
  const [flightPaths, setFlightPaths] = useState<FlightPath[]>(mockFlightPaths)
  const [filter, setFilter] = useState<FilterType>("all")
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.1) // 90% uptime
      setLastUpdate(new Date())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Filter drones based on current filter
  const drones = allDrones.filter((drone) => {
    if (filter === "all") return true
    return drone.status === filter
  })

  const updateFilter = useCallback((newFilter: FilterType) => {
    setFilter(newFilter)
  }, [])

  const selectDrone = useCallback((droneId: string | null) => {
    setSelectedDroneId(droneId)
  }, [])

  const getDroneStats = useCallback((): DroneStats => {
    const stats = allDrones.reduce(
      (acc, drone) => {
        acc[drone.status]++
        acc.total++
        return acc
      },
      { active: 0, inactive: 0, restricted: 0, total: 0 },
    )
    return stats
  }, [allDrones])

  const getRestrictedDronesCount = useCallback(() => {
    return allDrones.filter((drone) => drone.status === "restricted").length
  }, [allDrones])

  const getFlightPath = useCallback(
    (droneId: string) => {
      return flightPaths.find((path) => path.droneId === droneId)
    },
    [flightPaths],
  )

  return {
    drones,
    allDrones,
    flightPaths,
    filter,
    selectedDroneId,
    isConnected,
    lastUpdate,
    updateFilter,
    selectDrone,
    getDroneStats,
    getRestrictedDronesCount,
    getFlightPath,
  }
}
