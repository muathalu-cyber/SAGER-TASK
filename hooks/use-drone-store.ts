import { useState, useEffect, useCallback } from 'react';
import { DroneData, FlightPathPoint, DroneFilter, isDroneAllowed } from '../types/drone';
import { useWebSocket } from './use-websocket';

interface DroneStore {
  drones: Map<string, DroneData>;
  flightPaths: Map<string, FlightPathPoint[]>;
  filter: DroneFilter;
  selectedDroneId: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function useDroneStore() {
  const [store, setStore] = useState<DroneStore>({
    drones: new Map(),
    flightPaths: new Map(),
    filter: {
      search: '',
      showAllowed: true,
      showRestricted: true,
    },
    selectedDroneId: null,
    isConnected: false,
    lastUpdate: null,
  });

  const { isConnected, lastMessage } = useWebSocket('/ws');

  // Update connection status
  useEffect(() => {
    setStore(prev => ({ ...prev, isConnected }));
  }, [isConnected]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    setStore(prev => {
      const newStore = { ...prev, lastUpdate: new Date() };

      if (lastMessage.type === 'drone_update') {
        const droneData: DroneData = lastMessage.drone;
        newStore.drones = new Map(prev.drones);
        newStore.drones.set(droneData.id, droneData);
      } else if (lastMessage.type === 'flight_path_update') {
        const pathUpdate: FlightPathPoint = lastMessage.path;
        newStore.flightPaths = new Map(prev.flightPaths);
        const existingPath = newStore.flightPaths.get(pathUpdate.droneId) || [];
        
        // Keep only last 100 points for performance
        const updatedPath = [...existingPath, pathUpdate].slice(-100);
        newStore.flightPaths.set(pathUpdate.droneId, updatedPath);
      }

      return newStore;
    });
  }, [lastMessage]);

  const filteredDrones = useCallback(() => {
    const dronesArray = Array.from(store.drones.values());
    
    return dronesArray.filter(drone => {
      // Search filter
      if (store.filter.search && !drone.registration.toLowerCase().includes(store.filter.search.toLowerCase())) {
        return false;
      }

      // Allowed/Restricted filter
      const isAllowed = isDroneAllowed(drone.registration);
      if (!store.filter.showAllowed && isAllowed) return false;
      if (!store.filter.showRestricted && !isAllowed) return false;

      return true;
    });
  }, [store.drones, store.filter]);

  const getRestrictedDronesCount = useCallback(() => {
    return Array.from(store.drones.values()).filter(drone => 
      !isDroneAllowed(drone.registration) && drone.isActive
    ).length;
  }, [store.drones]);

  const getDroneStats = useCallback(() => {
    const drones = Array.from(store.drones.values());
    const activeDrones = drones.filter(drone => drone.isActive);
    const allowedDrones = activeDrones.filter(drone => isDroneAllowed(drone.registration));
    
    return {
      total: drones.length,
      active: activeDrones.length,
      allowed: allowedDrones.length,
      restricted: activeDrones.length - allowedDrones.length,
    };
  }, [store.drones]);

  const updateFilter = useCallback((newFilter: Partial<DroneFilter>) => {
    setStore(prev => ({
      ...prev,
      filter: { ...prev.filter, ...newFilter }
    }));
  }, []);

  const selectDrone = useCallback((droneId: string | null) => {
    setStore(prev => ({ ...prev, selectedDroneId: droneId }));
  }, []);

  const getDroneById = useCallback((id: string) => {
    return store.drones.get(id);
  }, [store.drones]);

  const getFlightPath = useCallback((droneId: string) => {
    return store.flightPaths.get(droneId) || [];
  }, [store.flightPaths]);

  return {
    drones: filteredDrones(),
    allDrones: Array.from(store.drones.values()),
    flightPaths: store.flightPaths,
    filter: store.filter,
    selectedDroneId: store.selectedDroneId,
    isConnected: store.isConnected,
    lastUpdate: store.lastUpdate,
    getRestrictedDronesCount,
    getDroneStats,
    updateFilter,
    selectDrone,
    getDroneById,
    getFlightPath,
  };
}
