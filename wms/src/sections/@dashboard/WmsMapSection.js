import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON } from 'react-leaflet';
import L from 'leaflet'; // Import L for leaflet specific functionalities like L.circleMarker
import 'leaflet/dist/leaflet.css';
import { getOptimizedRoutesAPI, getPickupHeatmapDataAPI } from '../../api/api';

// Fix for default Leaflet marker icons (Webpack issue)
// Ensure you have 'file-loader' or similar for image assets if using require,
// or place images in the public folder and adjust paths.
// If 'require' is not available (e.g., strict ES Modules without Babel/Webpack for this),
// this specific fix might need adjustment (e.g., copying images to public and setting L.Icon.Default.imagePath).
try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default, // .default for ES Module interop
      iconUrl: require('leaflet/dist/images/marker-icon.png').default,
      shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
    });
} catch (e) {
    console.error("Leaflet icon fix error:", e);
    // Fallback or alternative icon setup might be needed here if require fails.
    // For instance, L.Icon.Default.imagePath = '/path/to/leaflet/images/';
}


// Basic styling (can be moved to a CSS file or styled components)
const styles = {
  section: {
    padding: '20px',
    margin: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    marginRight: '10px',
  },
  input: {
    marginRight: '20px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  button: {
    padding: '10px 18px',
    backgroundColor: '#28a745', // Green color for this button
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginRight: '10px',
  },
  loading: {
    color: '#555',
    fontStyle: 'italic',
  },
  error: {
    color: 'red',
    fontWeight: 'bold',
  },
  dataContainer: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '4px',
  },
  pre: {
    whiteSpace: 'pre-wrap', // Handles long lines
    wordBreak: 'break-all', // Breaks long words/strings
    maxHeight: '300px',
    overflowY: 'auto', // Scroll for long content
    backgroundColor: '#fff',
    padding: '10px',
    border: '1px solid #ddd',
  },
  mapContainer: {
    height: '500px', // Specific height for the map
    width: '100%',
    marginTop: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
  }
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WmsMapSection = () => {
  const [routesData, setRoutesData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [errorRoutes, setErrorRoutes] = useState(null);
  const [errorHeatmap, setErrorHeatmap] = useState(null);
  const [date, setDate] = useState(getTodayDateString()); // Default to today
  const [mapCenter, setMapCenter] = useState([5.6037, -0.1870]); // Default: Accra
  const [mapZoom, setMapZoom] = useState(13); // Default zoom

  // Function to update map center if data is available
  const updateMapCenter = useCallback((data) => {
    if (data && data.features && data.features.length > 0) {
      const firstFeature = data.features[0];
      if (firstFeature.geometry && firstFeature.geometry.coordinates) {
        // GeoJSON coordinates are [longitude, latitude]
        const [lon, lat] = firstFeature.geometry.coordinates;
        setMapCenter([lat, lon]); // Leaflet uses [latitude, longitude]
        // setMapZoom(14); // Optionally adjust zoom
      }
    } else if (data && data.routes && data.routes.length > 0 && data.routes[0].length > 0) {
      const firstPickup = data.routes[0][0];
      if (firstPickup && typeof firstPickup.latitude === 'number' && typeof firstPickup.longitude === 'number') {
        setMapCenter([firstPickup.latitude, firstPickup.longitude]);
        // setMapZoom(14); // Optionally adjust zoom
      }
    }
  }, []);


  const fetchRoutes = useCallback(async () => {
    if (!date) {
      setErrorRoutes("Date is required to fetch routes.");
      return;
    }
    setLoadingRoutes(true);
    setErrorRoutes(null);
    setRoutesData(null);

    try {
      const result = await getOptimizedRoutesAPI(date);
      if (result && result.error) {
        setErrorRoutes(result.error);
        setRoutesData(null); // Clear data on error
      } else if (result && result.routes) { // Assuming result has a .routes property
        setRoutesData(result);
        // updateMapCenter({ routes: result.routes }); // Update center based on route data - potentially
      } else {
        setErrorRoutes('Failed to fetch routes or no routes found.');
        setRoutesData(null);
      }
    } catch (e) {
      console.error("Fetch routes error:", e);
      setErrorRoutes(e.message || 'An unexpected error occurred while fetching routes.');
    } finally {
      setLoadingRoutes(false);
    }
  }, [date]);

  const fetchHeatmap = useCallback(async () => {
    if (!date) {
      setErrorHeatmap("Date is required to fetch heatmap data.");
      return;
    }
    setLoadingHeatmap(true);
    setErrorHeatmap(null);
    setHeatmapData(null);

    try {
      const result = await getPickupHeatmapDataAPI(date);
      if (result && result.error) {
        setErrorHeatmap(result.error);
        setHeatmapData(null); // Clear data on error
      } else if (result && result.features) { // GeoJSON data should have features
        setHeatmapData(result);
        updateMapCenter(result); // Update map center based on heatmap data if no route data
      } else {
        setErrorHeatmap('Failed to fetch heatmap data or no features found.');
        setHeatmapData(null);
      }
    } catch (e) {
      console.error("Fetch heatmap error:", e);
      setErrorHeatmap(e.message || 'An unexpected error occurred while fetching heatmap data.');
    } finally {
      setLoadingHeatmap(false);
    }
  }, [date]);

  const handleFetchAll = () => {
    fetchRoutes();
    fetchHeatmap();
  };
  
  // Optional: Fetch on initial mount for the default date
  // useEffect(() => {
  //   handleFetchAll();
  // }, []); // Empty dependency array means only on mount

  return (
    <div style={styles.section}>
      <h2>WMS Map Data Viewer</h2>
      <div style={styles.inputGroup}>
        <label htmlFor="dateInputMap" style={styles.label}>Date:</label>
        <input
          type="date"
          id="dateInputMap"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleFetchAll} disabled={loadingRoutes || loadingHeatmap} style={styles.button}>
          {loadingRoutes || loadingHeatmap ? 'Fetching...' : 'Fetch Map Data'}
        </button>
        {/* You could also have separate buttons:
        <button onClick={fetchRoutes} disabled={loadingRoutes} style={styles.button}>Fetch Routes</button>
        <button onClick={fetchHeatmap} disabled={loadingHeatmap} style={styles.button}>Fetch Heatmap</button>
        */}
      </div>

      <div style={styles.mapContainer}>
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Render Optimized Routes */}
          {routesData && routesData.routes && routesData.routes.map((route, routeIndex) => {
            // Assuming route is an array of pickup objects with lat/lon
            // This structure needs to be confirmed/adjusted based on actual API output in Step 3
            const positions = route
              .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number')
              .map(pickup => [pickup.latitude, pickup.longitude]);
            
            const routeColor = ['blue', 'green', 'purple', 'orange'][routeIndex % 4]; // Cycle through some colors

            return (
              <React.Fragment key={`route-${routeIndex}`}>
                {positions.length > 0 && <Polyline positions={positions} pathOptions={{ color: routeColor }} />}
                {route.map((pickup, pickupIndex) => (
                  (typeof pickup.latitude === 'number' && typeof pickup.longitude === 'number') && (
                    <Marker key={`route-${routeIndex}-pickup-${pickupIndex}`} position={[pickup.latitude, pickup.longitude]}>
                      <Popup>
                        Request ID: {pickup.requestId || 'N/A'} <br />
                        Weight: {pickup.approxGarbageWeight || 'N/A'} kg <br />
                        Order in route: {pickupIndex + 1}
                      </Popup>
                    </Marker>
                  )
                ))}
              </React.Fragment>
            );
          })}

          {/* Render Heatmap/Pickup Distribution Data */}
          {heatmapData && heatmapData.features && (
            <GeoJSON 
              data={heatmapData} 
              pointToLayer={(feature, latlng) => {
                // Default style for heatmap points (can be customized further)
                const weight = feature.properties.approxGarbageWeight || 0;
                let radius = 5; // Default radius
                if (weight > 100) radius = 10;
                if (weight > 200) radius = 15;

                return L.circleMarker(latlng, { 
                  radius: radius, 
                  fillColor: 'rgba(255,0,0,0.6)', // Semi-transparent red
                  color: '#ff0000', 
                  weight: 1, 
                  opacity: 1, 
                  fillOpacity: 0.6 
                });
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  layer.bindPopup(
                    `Request ID: ${feature.properties.requestId || 'N/A'}<br/>
                     Type: ${feature.properties.garbageType || 'N/A'}<br/>
                     Weight: ${feature.properties.approxGarbageWeight || 'N/A'} kg`
                  );
                }
              }}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Data display sections can be kept for debugging or removed if map is primary view */}
      <div style={styles.dataContainer}>
        <h3>Optimized Routes Data (Raw)</h3>
        {loadingRoutes && <p style={styles.loading}>Loading routes...</p>}
        {errorRoutes && <p style={styles.error}>Error fetching routes: {errorRoutes}</p>}
        {routesData && !errorRoutes && (
          <pre style={styles.pre}>{JSON.stringify(routesData, null, 2)}</pre>
        )}
        {!loadingRoutes && !errorRoutes && !routesData && <p>No route data loaded or available for the selected date.</p>}
      </div>

      <div style={styles.dataContainer}>
        <h3>Pickup Heatmap Data (GeoJSON - Raw)</h3>
        {loadingHeatmap && <p style={styles.loading}>Loading heatmap data...</p>}
        {errorHeatmap && <p style={styles.error}>Error fetching heatmap data: {errorHeatmap}</p>}
        {heatmapData && !errorHeatmap && (
          <pre style={styles.pre}>{JSON.stringify(heatmapData, null, 2)}</pre>
        )}
         {!loadingHeatmap && !errorHeatmap && !heatmapData && <p>No heatmap data loaded or available for the selected date.</p>}
      </div>
    </div>
  );
};

export default WmsMapSection;
