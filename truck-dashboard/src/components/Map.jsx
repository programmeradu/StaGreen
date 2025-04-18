import React, { useEffect, useState } from "react";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import tt from "@tomtom-international/web-sdk-maps";
import Banner from "./Banner";
import { Box } from "@mui/material";
import { getNearbyPlaces } from "../api/api";
import { ReactSearchAutocomplete } from "react-search-autocomplete";

const Map = () => {
  const [geoLocation, setGeoLocation] = useState({});
  const [geoError, setGeoError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (e) => {
        setGeoLocation(e.coords);
      },
      async (err) => {
        setGeoError(err);
      },
    );
  }, []);

  async function onSearchChange(query) {
    if (query.length > 0) {
      const resultsPromise = await getNearbyPlaces(
        query,
        geoLocation.latitude,
        geoLocation.longitude,
      );
      // resultsPromise.then((res) => {
      //     setSearchResults(res.results)
      // });
      setSearchResults(resultsPromise.results);
      console.log(resultsPromise);
    }
  }

  console.log(geoLocation);

  return (
    <div style={{ position: "absolute" }}>
      <Banner geoLocation={geoLocation} geoError={geoError} />
      <Box
        sx={{
          ml: 19,
          width: "500px",
          pt: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "450px" }}>
          <ReactSearchAutocomplete
            placeholder="Search for nearby places"
            // matchedRecords={
            //     searchResults.map(result => ({
            //         key: result.id,
            //         name: result.poi.name,
            //         dist: result.dist,
            //         value: `${result.poi.name} | ${(result.dist / 1000).toFixed(2)}km `
            //     })).sort((a, b) => a.dist - b.dist)
            // }
            items={searchResults
              .map((result) => ({
                id: result.id,
                name: result.poi.name,
                dist: result.dist,
                value: result.poi.name,
              }))
              .sort((a, b) => a.dist - b.dist)}
            onSelect={(place) => console.log(place)}
            onSearch={(query, results) => {
              onSearchChange(query);
            }}
            fuseOptions={{
              minMatchCharLength: 1,
              threshold: 1,
              distance: 100000,
              shouldSort: false,
            }}
            keys={["name"]}
            maxResults={5}
          />
        </div>
      </Box>
    </div>
  );
};

export default Map;
