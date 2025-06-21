import { Alert } from "@mui/material";
import React, { createContext, useState, useEffect, useContext } from "react";
import Cookies from "universal-cookie";

const cookies = new Cookies();

const setCookie = (email, firstName) => {
  cookies.set("email", email, { path: "/", maxAge: 2592000 });
  cookies.set("firstName", firstName, { path: "/", maxAge: 2592000 });
  console.log(cookies.get("email"));
};

const setLogin = (email, firstName) => {
  setCookie(email, firstName);
};

// API base URL - configurable via environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const postRegisterForm = async (finalValues) => {
  console.log(finalValues);
  try {
    const res = await fetch(`${API_BASE_URL}/add`, {
      method: "POST",
      body: JSON.stringify(finalValues),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.status == 200) {
      const response = await res.json();
      setLogin(finalValues.email, finalValues.firstName);
      // alert(response);
      return response;
    }
  } catch (error) {
    console.log("Error while calling addUser api", error);
  }
};

export const postPickUpRequest = async (finalValues) => {
  console.log("inside postPickUpRequest");
  console.log(finalValues);
  try {
    const res = await fetch(`${API_BASE_URL}/addPickUp`, {
      method: "POST",
      body: JSON.stringify(finalValues),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.status == 200) {
      const response = await res.json();
      alert(response);
      return res;
    }
  } catch (error) {
    console.log("Error while calling addPickUp api", error);
  }
};

export const getPickUpInfo = async (pickUpId) => {
  console.log("inside getPickUp Client");
  try {
    const res = await fetch(`${API_BASE_URL}/getPickUp`);
    if (res.status === 200) {
      const response = await res.json();
      return response;
    }
  } catch (error) {
    console.log("Error while calling getPickUp api", error);
  }
};

export const getNearbyPlaces = async (
  query,
  lat,
  long,
  limit = 5,
  radius = 10000,
) => {
  const baseUrl = "https://api.tomtom.com/search/2/poiSearch";
  const queryString = `limit=${limit}&lat=${lat}&lon=${long}&radius=${radius}&key=g9V9sGqvIMdVtmAgA1gjsBcXyV7Qc1gg`;
  const response = await fetch(`${baseUrl}/${query}.json?${queryString}`);
  return response.json();
};

export const getAddressFromCoordinates = async (lat, long) => {
  const baseUrl = "https://api.tomtom.com/search/2/reverseGeocode";
  const queryString = `${lat},${long}`;
  const response = await fetch(
    `${baseUrl}/${queryString}.json?&key=g9V9sGqvIMdVtmAgA1gjsBcXyV7Qc1gg`,
  );
  return response.json();
};

export const getCoordinatesFromAddress = async (address) => {
  const baseUrl = "https://api.tomtom.com/search/2/geocode";
  const response = await fetch(
    `${baseUrl}/${address}.json?&key=g9V9sGqvIMdVtmAgA1gjsBcXyV7Qc1gg`,
  );
  console.log(response.json());
};

// https://api.tomtom.com/search/2/poiSearch/tha.json?limit=5&lat=19.2217&lon=72.8596&radius=10000&key=g9V9sGqvIMdVtmAgA1gjsBcXyV7Qc1gg
