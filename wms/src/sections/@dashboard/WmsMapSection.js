import React, { useState, useEffect, useCallback } from 'react';
import { getOptimizedRoutesAPI, getPickupHeatmapDataAPI } from '../../api/api';

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
      } else if (result) {
        setRoutesData(result);
      } else {
        setErrorRoutes('Failed to fetch routes. No data returned.');
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
      } else if (result) {
        setHeatmapData(result);
      } else {
        setErrorHeatmap('Failed to fetch heatmap data. No data returned.');
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

      {/* TODO: Integrate a map library (e.g., Azure Maps, Leaflet, Mapbox GL JS) here to visualize routes and heatmap. */}
      
      <div style={styles.dataContainer}>
        <h3>Optimized Routes Data</h3>
        {loadingRoutes && <p style={styles.loading}>Loading routes...</p>}
        {errorRoutes && <p style={styles.error}>Error fetching routes: {errorRoutes}</p>}
        {routesData && !errorRoutes && (
          <pre style={styles.pre}>{JSON.stringify(routesData, null, 2)}</pre>
        )}
        {!loadingRoutes && !errorRoutes && !routesData && <p>No route data loaded or available for the selected date.</p>}
      </div>

      <div style={styles.dataContainer}>
        <h3>Pickup Heatmap Data (GeoJSON)</h3>
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
