import { useEffect, useRef, useState } from 'react';
import { createMapboxMap, type MapboxMapManager } from '../lib/mapbox';
import type { DroneData, MapSettings } from '../types/drone';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Maximize2, Navigation } from 'lucide-react';
import React from 'react';


interface MapboxMapProps {
  drones: DroneData[];
  flightPaths: any;
  selectedDroneId: string | null;
  onDroneSelected: (droneId: string) => void;
  className?: string;
}

export function MapboxMap({ drones, flightPaths, selectedDroneId, onDroneSelected, className }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMapManager | null>(null);
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    style: 'satellite',
    showFlightPaths: true,
    showRestrictedZones: true,
    showAirports: false,
  });

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      mapRef.current = createMapboxMap(containerRef.current);
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  // Update drone markers
  useEffect(() => {
    if (!mapRef.current) return;

    drones?.map(drone => {
      mapRef.current!.updateDroneMarker(drone);
    });
  }, [drones]);

  // Update flight paths
  useEffect(() => {
    if (!mapRef.current) return;

    flightPaths?.map((path, droneId) => {
      mapRef.current!.updateFlightPath(droneId, path);
    });
  }, [flightPaths]);

  // Center on selected drone
  useEffect(() => {
    if (!mapRef.current || !selectedDroneId) return;

    const selectedDrone = drones.find(d => d.id === selectedDroneId);
    if (selectedDrone) {
      mapRef.current.centerOnDrone(selectedDrone);
    }
  }, [selectedDroneId, drones]);

  // Listen for drone selection from map
  useEffect(() => {
    const handleDroneSelected = (event: CustomEvent) => {
      onDroneSelected(event.detail);
    };

    window.addEventListener('droneSelected', handleDroneSelected as EventListener);
    return () => {
      window.removeEventListener('droneSelected', handleDroneSelected as EventListener);
    };
  }, [onDroneSelected]);

  const handleStyleChange = (style: string) => {
    if (mapRef.current) {
      mapRef.current.setMapStyle(style);
      setMapSettings(prev => ({ ...prev, style: style as any }));
    }
  };

  const handleLayerToggle = (layerId: string, visible: boolean) => {
    if (mapRef.current) {
      mapRef.current.toggleLayer(layerId, visible);
    }
  };

  const handleCenterMap = () => {
    if (mapRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current!.map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 12
          });
        },
        () => {
          // Fallback to San Francisco
          mapRef.current!.map.flyTo({
            center: [-122.4194, 37.7749],
            zoom: 12
          });
        }
      );
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-[100vh]" data-testid="mapbox-container" />
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 space-y-3 z-20">
        {/* Map Style Switcher */}
        <Card className="p-2 shadow-lg">
          <div className="flex flex-col space-y-1">
            {[
              { key: 'satellite', label: 'Satellite' },
              { key: 'streets', label: 'Streets' },
              { key: 'dark', label: 'Dark' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={mapSettings.style === key ? "default" : "ghost"}
                size="sm"
                onClick={() => handleStyleChange(key)}
                className="text-xs justify-start"
                data-testid={`button-map-style-${key}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Layer Controls */}
        <Card className="p-3 shadow-lg">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Layers
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flight-paths"
                checked={mapSettings.showFlightPaths}
                onCheckedChange={(checked) => {
                  setMapSettings(prev => ({ ...prev, showFlightPaths: !!checked }));
                  handleLayerToggle('flight-paths-layer', !!checked);
                }}
                data-testid="checkbox-flight-paths"
              />
              <label htmlFor="flight-paths" className="text-xs text-foreground cursor-pointer">
                Flight Paths
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="restricted-zones"
                checked={mapSettings.showRestrictedZones}
                onCheckedChange={(checked) => {
                  setMapSettings(prev => ({ ...prev, showRestrictedZones: !!checked }));
                  handleLayerToggle('restricted-zones-layer', !!checked);
                  handleLayerToggle('restricted-zones-outline', !!checked);
                }}
                data-testid="checkbox-restricted-zones"
              />
              <label htmlFor="restricted-zones" className="text-xs text-foreground cursor-pointer">
                No-Fly Zones
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="airports"
                checked={mapSettings.showAirports}
                onCheckedChange={(checked) => {
                  setMapSettings(prev => ({ ...prev, showAirports: !!checked }));
                }}
                data-testid="checkbox-airports"
              />
              <label htmlFor="airports" className="text-xs text-foreground cursor-pointer">
                Airports
              </label>
            </div>
          </div>
        </Card>

        {/* Map Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCenterMap}
            data-testid="button-center-map"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFullscreen}
            data-testid="button-fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Map Legend */}
      <Card className="absolute bottom-20 left-4 p-4 shadow-lg z-20">
        <h4 className="text-sm font-medium text-foreground mb-3">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Allowed (B-series)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive rounded-full"></div>
            <span className="text-xs text-muted-foreground">Restricted</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-1 bg-primary/50"></div>
            <span className="text-xs text-muted-foreground">Flight Path</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
