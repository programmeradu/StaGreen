import React, { useEffect, useState } from "react";
import Banner from "./Banner";
import { Box } from "@mui/material";
import { getAddressFromCoordinates, getNearbyPlaces } from "../api/api";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import * as tt from "@tomtom-international/web-sdk-maps";

const LocationSearchBox = ({ address, setAddress }) => {
  const [geoLocation, setGeoLocation] = useState({});
  const [geoError, setGeoError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (e) => {
        setGeoLocation({
          latitude: e.coords.latitude,
          longitude: e.coords.longitude,
        });
        getAddress(e.coords.latitude, e.coords.longitude);
      },
      async (err) => {
        setGeoError(err);
      },
    );
  }, []);

  async function getAddress(lat, long) {
    const addressPromise = await getAddressFromCoordinates(lat, long);
    setAddress(addressPromise.addresses[0].address.freeformAddress.toString());
    // console.log(address);
  }

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
    }
  }

  // console.log(geoLocation);

  return (
    <div style={{ position: "absolute" }}>
      {/* <Banner
                geoLocation={geoLocation}
                geoError={geoError}
            /> */}
      <Box
        sx={{
          width: "500px",
          pt: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "450px" }}>
          <ReactSearchAutocomplete
            placeholder="Search for your location"
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
                adr: result.address,
              }))
              .sort((a, b) => a.dist - b.dist)}
            onSelect={(place) => {
              geoLocation.latitude = place.latitude;
              geoLocation.longitude = place.longitude;
              setAddress(`${place.name}, ${place.adr.freeformAddress}`);
              console.log(place.adr.freeformAddress);
              console.log(place);
            }}
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

export default LocationSearchBox;
