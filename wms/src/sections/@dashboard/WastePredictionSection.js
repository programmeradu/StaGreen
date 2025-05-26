import React, { useState, useEffect, useCallback } from 'react';
import { getWastePredictionsAPI } from '../../api/api';

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
    marginBottom: '10px',
  },
  label: {
    marginRight: '10px',
  },
  input: {
    marginRight: '20px',
    padding: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    padding: '8px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: {
    color: '#555',
  },
  error: {
    color: 'red',
  },
  table: {
    marginTop: '20px',
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    borderBottom: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f7f7f7',
  },
  td: {
    borderBottom: '1px solid #ddd',
    padding: '8px',
  }
};

const WastePredictionSection = () => {
  const [predictionsData, setPredictionsData] = useState(null);
  const [loading, setLoading] = useState(false); // Default to false, true when fetch starts
  const [error, setError] = useState(null);
  const [area, setArea] = useState('Accra'); // Default area
  const [days, setDays] = useState('7');   // Default days as string for input field

  const fetchPredictions = useCallback(async () => {
    if (!area || !days) {
      setError("Area and Days are required.");
      return;
    }
    const daysInt = parseInt(days, 10);
    if (isNaN(daysInt) || daysInt <= 0) {
      setError("Days must be a positive number.");
      return;
    }

    setLoading(true);
    setError(null);
    setPredictionsData(null); // Clear previous data

    try {
      const result = await getWastePredictionsAPI(area, daysInt);
      if (result && result.error) {
        setError(result.error); // Handle errors returned from API (e.g., backend script error)
      } else if (result) {
        setPredictionsData(result);
      } else {
        setError('Failed to fetch predictions. No data returned.');
      }
    } catch (e) {
      // This catch block handles network errors or errors thrown by getWastePredictionsAPI itself
      console.error("Fetch predictions error:", e);
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [area, days]); // Dependencies for useCallback

  // Optional: Fetch predictions on initial mount if desired, or rely on button click.
  // For this example, we'll rely on the button click.
  // useEffect(() => {
  //   fetchPredictions();
  // }, [fetchPredictions]); // fetchPredictions is memoized by useCallback

  return (
    <div style={styles.section}>
      <h2>Waste Predictions</h2>
      <div style={styles.inputGroup}>
        <label htmlFor="areaInput" style={styles.label}>Area:</label>
        <input
          type="text"
          id="areaInput"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          style={styles.input}
        />
        <label htmlFor="daysInput" style={styles.label}>Days:</label>
        <input
          type="number"
          id="daysInput"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          min="1"
          style={styles.input}
        />
        <button onClick={fetchPredictions} disabled={loading} style={styles.button}>
          {loading ? 'Fetching...' : 'Fetch Predictions'}
        </button>
      </div>

      {loading && <p style={styles.loading}>Loading predictions...</p>}
      {error && <p style={styles.error}>Error: {error}</p>}

      {predictionsData && !error && (
        <div>
          <h3>Predictions for {predictionsData.area}</h3>
          {predictionsData.predictions && predictionsData.predictions.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Predicted Waste (kg/tons)</th> 
                  {/* Clarify unit with backend or assume one */}
                </tr>
              </thead>
              <tbody>
                {predictionsData.predictions.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{item.date}</td>
                    <td style={styles.td}>{item.predicted_waste}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No predictions available for this area and timeframe.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WastePredictionSection;
