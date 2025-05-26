import React, { useState, useCallback } from 'react';
import { 
    TextField, 
    Button, 
    Box, 
    Typography, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    CircularProgress,
    Alert,
    Grid,
    Fade 
} from '@mui/material';
import { getWastePredictionsAPI } from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';


const WastePredictionSection = () => {
  const [predictionsData, setPredictionsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Initialize with empty string for Alert
  const [area, setArea] = useState('Accra'); // Default area
  const [days, setDays] = useState('7');   // Default days as string for input field
  const [areaError, setAreaError] = useState('');
  const [daysError, setDaysError] = useState('');

  const validateInputs = () => {
    let isValid = true;
    if (!area.trim()) {
      setAreaError('Area is required.');
      isValid = false;
    } else {
      setAreaError('');
    }

    const daysInt = parseInt(days, 10);
    if (isNaN(daysInt) || daysInt <= 0) {
      setDaysError('Days must be a positive integer.');
      isValid = false;
    } else {
      setDaysError('');
    }
    return isValid;
  };

  const fetchPredictions = useCallback(async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    setError('');
    setPredictionsData(null);

    try {
      const daysInt = parseInt(days, 10);
      const result = await getWastePredictionsAPI(area, daysInt);
      if (result && result.error) {
        setError(result.error);
      } else if (result) {
        setPredictionsData(result);
      } else {
        setError('Failed to fetch predictions. No data returned or unexpected format.');
      }
    } catch (e) {
      console.error("Fetch predictions error:", e);
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [area, days]);


  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom component="div">
        Waste Predictions
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          label="Area"
          variant="outlined"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          error={!!areaError}
          helperText={areaError}
          disabled={loading}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          label="Days to Predict"
          variant="outlined"
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          error={!!daysError}
          helperText={daysError}
          inputProps={{ min: "1" }}
          disabled={loading}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        />
        <Button 
          variant="contained" 
          onClick={fetchPredictions} 
          disabled={loading}
          size="large"
          sx={{ height: '56px' }} // Match TextField height
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Fetch Predictions'}
        </Button>
      </Box>

      <ErrorMessage error={error} title="Prediction Error" />

      {loading && !error && ( // Show loader only if no error is present
        <LoadingSpinner sx={{ my: 3 }} />
      )}
      
      <Fade in={predictionsData && !error && !loading} timeout={500}>
        <Box>
          {predictionsData && !error && !loading && (
            <>
              <Typography variant="h6" gutterBottom component="div" sx={{mt: 2}}>
                Predictions for {predictionsData.area}
              </Typography>
              {predictionsData.predictions && predictionsData.predictions.length > 0 ? (
                <TableContainer component={Paper} elevation={2}>
                  <Table aria-label="predictions table">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.main' }}>
                        <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Date</TableCell>
                        <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Predicted Waste (kg/tons)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {predictionsData.predictions.map((item, index) => (
                        <TableRow 
                          key={index}
                          sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' }, '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            {item.date}
                          </TableCell>
                          <TableCell align="right">{item.predicted_waste}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ mt: 2 }}>
                  No predictions available for this area and timeframe.
                </Typography>
              )}
              <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                Chart visualization of predictions will be displayed here.
              </Typography>
            </>
          )}
        </Box>
      </Fade>
    </Paper>
  );
};

export default WastePredictionSection;
