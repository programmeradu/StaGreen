import React, { useState, useCallback } from 'react'; // Removed useEffect as it wasn't used for initial fetch
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import marker images for Leaflet icon fix
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { TextField, Button, Box, Typography, Paper, CircularProgress, Grid } from '@mui/material'; // Removed Alert, Skeleton
import { getOptimizedRoutesAPI, getPickupHeatmapDataAPI } from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

// Fix for default Leaflet marker icons (Webpack issue)
// Ensure you have 'file-loader' or similar for image assets if using require,
// or place images in the public folder and adjust paths.
// If 'require' is not available (e.g., strict ES Modules without Babel/Webpack for this),
// this specific fix might need adjustment (e.g., copying images to public and setting L.Icon.Default.imagePath).
// This block should run once when the module is loaded.
try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIconRetina,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
} catch (e) {
    console.error("Error setting up Leaflet default icons", e);
    // Fallback or alternative icon setup might be needed here if require fails.
    // For instance, L.Icon.Default.imagePath = '/path/to/leaflet/images/';
}


// Note: Removed the 'styles' object as styling will be handled by MUI sx props or styled-components

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
  const [errorRoutes, setErrorRoutes] = useState(''); // Initialize with empty string for Alert
  const [errorHeatmap, setErrorHeatmap] = useState(''); // Initialize with empty string for Alert
  const [date, setDate] = useState(getTodayDateString()); // Default to today
  const [mapCenter, setMapCenter] = useState([5.6037, -0.1870]); // Default: Accra
  const [mapZoom, _setMapZoom] = useState(13); // Default zoom, setMapZoom is unused, prefixed with _ or remove
  const [dateError, setDateError] = useState('');

  // Function to update map center if data is available
  // This function is stable as setMapCenter is a state setter.
  const updateMapCenter = useCallback((data) => {
    if (data && data.features && data.features.length > 0) {
      const firstFeature = data.features[0];
      if (firstFeature.geometry && firstFeature.geometry.coordinates) {
        const [lon, lat] = firstFeature.geometry.coordinates;
        setMapCenter([lat, lon]);
        // _setMapZoom(14); // If we decide to use setMapZoom
      }
    } else if (data && data.routes && data.routes.length > 0 && data.routes[0].length > 0) {
      const firstPickup = data.routes[0][0];
      if (firstPickup && typeof firstPickup.latitude === 'number' && typeof firstPickup.longitude === 'number') {
        setMapCenter([firstPickup.latitude, firstPickup.longitude]);
        // _setMapZoom(14); // If we decide to use setMapZoom
      }
    }
  }, []); // setMapCenter (and _setMapZoom) are stable and don't need to be in deps


  const validateDate = (selectedDate) => {
    if (!selectedDate) {
      setDateError('Date is required.');
      return false;
    }
    // Basic regex for YYYY-MM-DD, can be more robust if needed
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        setDateError('Invalid date format. Please use YYYY-MM-DD.');
        return false;
    }
    setDateError('');
    return true;
  };

  const fetchRoutes = useCallback(async () => {
    if (!validateDate(date)) {
      setErrorRoutes(dateError || "Date is required to fetch routes."); // Use dateError if set
      return;
    }
    setLoadingRoutes(true);
    setErrorRoutes('');
    setRoutesData(null);

    try {
      const result = await getOptimizedRoutesAPI(date);
      if (result && result.error) {
        setErrorRoutes(result.error);
      } else if (result && result.routes) {
        setRoutesData(result);
        // updateMapCenter({ routes: result.routes }); // Potentially update center
      } else {
        setErrorRoutes('No routes found or data is in unexpected format.');
      }
    } catch (e) {
      console.error("Fetch routes error:", e);
      setErrorRoutes(e.message || 'An unexpected error occurred while fetching routes.');
    } finally {
      setLoadingRoutes(false);
    }
  }, [date, dateError]); // Removed updateMapCenter as it's stable and not a direct dependency for fetching logic

  const fetchHeatmap = useCallback(async () => {
    if (!validateDate(date)) {
      setErrorHeatmap(dateError || "Date is required to fetch heatmap data.");
      return;
    }
    setLoadingHeatmap(true);
    setErrorHeatmap('');
    setHeatmapData(null);

    try {
      const result = await getPickupHeatmapDataAPI(date);
      if (result && result.error) {
        setErrorHeatmap(result.error);
      } else if (result && result.features) {
        setHeatmapData(result);
        updateMapCenter(result); // updateMapCenter is called here but is stable
      } else {
        setErrorHeatmap('No heatmap features found or data is in unexpected format.');
      }
    } catch (e) {
      console.error("Fetch heatmap error:", e);
      setErrorHeatmap(e.message || 'An unexpected error occurred while fetching heatmap data.');
    } finally {
      setLoadingHeatmap(false);
    }
  }, [date, dateError, updateMapCenter]); // updateMapCenter is kept here as it's part of the effect of this callback

  const handleFetchAll = () => {
    // Ensure date is validated once before fetching both
    if (validateDate(date)) {
        fetchRoutes();
        fetchHeatmap();
    } else {
        // If date is invalid, set errors for both sections to give feedback
        setErrorRoutes(dateError || "A valid date is required.");
        setErrorHeatmap(dateError || "A valid date is required.");
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom component="div">
        WMS Map Data Viewer
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          type="date"
          label="Select Date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            if (dateError) validateDate(e.target.value); // Re-validate if there was an error
          }}
          error={!!dateError}
          helperText={dateError}
          InputLabelProps={{ shrink: true }}
          disabled={loadingRoutes || loadingHeatmap}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: '180px' }}
        />
        <Button 
          variant="contained" 
          onClick={handleFetchAll} 
          disabled={loadingRoutes || loadingHeatmap}
          size="large" // Make button a bit larger to match TextField height
          sx={{ height: '56px' }} // Match TextField height
        >
          {loadingRoutes || loadingHeatmap ? <CircularProgress size={24} color="inherit" /> : 'Fetch Map Data'}
        </Button>
      </Box>

      <ErrorMessage error={errorRoutes} title="Route Data Error" sx={{ mb: 1 }} />
      <ErrorMessage error={errorHeatmap} title="Heatmap Data Error" sx={{ mb: 2 }} />


      {(loadingRoutes || loadingHeatmap) && !(routesData || heatmapData) ? ( 
        // Show main spinner instead of Skeleton when both are loading and no data is yet available for the map area
        <LoadingSpinner sx={{ height: 500, my: 2, border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box' }} />
      ) : (
        <Box sx={{ 
            height: '500px', 
            width: '100%', 
            marginTop: '20px', 
            border: '1px solid #ccc', 
            borderRadius: '8px',
            position: 'relative' // For potential overlay of individual loaders if needed
        }}>
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Render Optimized Routes */}
          {routesData && routesData.routes && routesData.routes.map((route, routeIndex) => {
            const positions = route
              .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number')
              .map(pickup => [pickup.latitude, pickup.longitude]);
            
            const routeColor = ['blue', 'green', 'purple', 'orange'][routeIndex % 4];

            return (
              <React.Fragment key={`route-${routeIndex}`}>
                {positions.length > 0 && <Polyline positions={positions} pathOptions={{ color: routeColor }} />}
                {route.map((pickup, pickupIndex) => (
                  (typeof pickup.latitude === 'number' && typeof pickup.longitude === 'number') && (
                    <Marker key={`route-${routeIndex}-pickup-${pickupIndex}`} position={[pickup.latitude, pickup.longitude]}>
                      <Popup>
                        <div><strong>Request ID:</strong> {pickup.requestId || 'N/A'}</div>
                        <div><strong>Weight:</strong> {pickup.approxGarbageWeight || 'N/A'} kg</div>
                        <div><strong>Order in route:</strong> {pickupIndex + 1}</div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </React.Fragment>
            );
          })}

          {/* Render Heatmap Data */}
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
                  // Simple HTML content for popup
                  layer.bindPopup(
                    `<div><strong>Request ID:</strong> ${feature.properties.requestId || 'N/A'}</div>
                     <div><strong>Type:</strong> ${feature.properties.garbageType || 'N/A'}</div>
                     <div><strong>Weight:</strong> ${feature.properties.approxGarbageWeight || 'N/A'} kg</div>`
                  );
                }
              }}
            />
          )}
        </MapContainer>
       </Box>
      )}
      
      {/* Raw JSON Data Display (Optional for debugging) */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Optimized Routes Data (Raw)</Typography>
            {loadingRoutes && !routesData && <LoadingSpinner size={24} />}
            <ErrorMessage error={errorRoutes} title="Routes Error" sx={{ mt: 1 }} />
            {routesData && !errorRoutes && (
              <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '300px', overflowY: 'auto', bgcolor: 'grey.100', p:1, borderRadius: 1 }}>
                {JSON.stringify(routesData, null, 2)}
              </Box>
            )}
            {!loadingRoutes && !errorRoutes && !routesData && <Typography variant="body2">No route data loaded.</Typography>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Pickup Heatmap Data (GeoJSON - Raw)</Typography>
            {loadingHeatmap && !heatmapData && <LoadingSpinner size={24} />}
            <ErrorMessage error={errorHeatmap} title="Heatmap Error" sx={{ mt: 1 }} />
            {heatmapData && !errorHeatmap && (
               <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '300px', overflowY: 'auto', bgcolor: 'grey.100', p:1, borderRadius: 1 }}>
                {JSON.stringify(heatmapData, null, 2)}
              </Box>
            )}
            {!loadingHeatmap && !errorHeatmap && !heatmapData && <Typography variant="body2">No heatmap data loaded.</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default WmsMapSection;
