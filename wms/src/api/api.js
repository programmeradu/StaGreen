export const getUsersList = async () => {
  try {
    const res = await fetch('http://localhost:8000/users')
    if (res.status === 200) {
      const response = await res.json()
      return response
    }
  } catch (error) {
    console.log('Error while calling getUsersList api', error)
  }
}

export const getPickUpRequests = async () => {
  try {
    const res = await fetch('http://localhost:8000/getAllPickUpRequests')
    if (res.status === 200) {
      const response = await res.json()
      return response
    }
  } catch (error) {
    console.log('Error while calling getPickUpRequests API', error)
  }
}

export const getTrucksList = async () => {
  try {
    const res = await fetch('http://localhost:8000/getTrucksList')
    if (res.status === 200) {
      const response = await res.json()
      return response
    }
  } catch (error) {
    console.log('Error while calling getTrucksList API', error)
  }
}

export const getPendingPickUpRequests = async () => {
  try {
    const res = await fetch('http://localhost:8000/getPendingPickUpRequests')
    if (res.status === 200) {
      const response = await res.json()
      return response
    }
  } catch (error) {
    console.log('Error while calling getPendingPickUpRequests API', error)
  }
}

export const getIdleTrucks = async () => {
  try {
    const res = await fetch('http://localhost:8000/getIdleTrucks')
    if (res.status === 200) {
      const response = await res.json()
      return response
    }
  } catch (error) {
    console.log('Error while calling getIdleTrucks API', error)
  }
}

export const getWastePredictionsAPI = async (area, days) => {
  try {
    const url = `http://localhost:8000/api/ml/waste-prediction?area=${encodeURIComponent(area)}&days=${days}`
    const res = await fetch(url)

    // It's good practice to check if the response is ok before parsing JSON
    if (!res.ok) {
      // Try to parse error response from backend if available
      const errorData = await res.json().catch(() => null) // Avoid crashing if error response isn't JSON
      console.error('Error fetching waste predictions:', res.status, res.statusText, errorData)
      // You might want to throw an error here or return a specific error object
      // For now, returning what the backend sent or a generic error
      return errorData || { error: `HTTP error! status: ${res.status}` }
    }

    const response = await res.json()
    return response
  } catch (error) {
    console.error('Error while calling getWastePredictionsAPI:', error)
    // Return an error object that the component can check
    return { error: error.message || 'Failed to fetch predictions.' }
  }
}

export const getOptimizedRoutesAPI = async (date) => {
  try {
    const url = `http://localhost:8000/api/ml/optimize-routes?date=${date}`
    const res = await fetch(url)

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      console.error('Error fetching optimized routes:', res.status, res.statusText, errorData)
      return errorData || { error: `HTTP error! status: ${res.status}` }
    }

    const response = await res.json()
    return response
  } catch (error) {
    console.error('Error while calling getOptimizedRoutesAPI:', error)
    return { error: error.message || 'Failed to fetch optimized routes.' }
  }
}

export const getPickupHeatmapDataAPI = async (date) => {
  try {
    const url = `http://localhost:8000/api/spatial/pickup-heatmap?date=${date}`
    const res = await fetch(url)

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      console.error('Error fetching pickup heatmap data:', res.status, res.statusText, errorData)
      return errorData || { error: `HTTP error! status: ${res.status}` }
    }

    const response = await res.json()
    return response
  } catch (error) {
    console.error('Error while calling getPickupHeatmapDataAPI:', error)
    return { error: error.message || 'Failed to fetch pickup heatmap data.' }
  }
}
