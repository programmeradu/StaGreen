import Express from "express";
import {
  addUser,
  getUsers,
  addPickUp,
  getPickUp,
  getPickUpList,
  trackPickUp,
  deleteRequestU,
  getNotifications,
  addContact,
} from "../controllers/citizen-controller.js";
import {
  getAllPickUpRequests,
  getPendingPickUpRequests,
  getIdleTrucks,
  getTrucksList,
  getAvailableSlot,
  addRoute,
  getRoute,
  pickUpComplete,
} from "../controllers/admin-controller.js";
import {
  getWastePrediction,
  getOptimizedRoutes,
  getPickupHeatmapData,
} from "../controllers/ml-controller.js";
import { detectBinsInImage } from "../controllers/cv-controller.js";
import { generateDynamicRoutes } from "../controllers/fleet-controller.js";

const route = Express.Router();

// defining add API and call addUser() function on post request sent
// Citizen
route.post("/add", addUser); // signup
route.get("/users", getUsers); // login

route.post("/addPickUp", addPickUp); // add pick up  request to be scheduled
route.get("/getPickUp", getPickUp); // add pick up  request to be scheduled
route.post("/trackPickUp", trackPickUp); // track the pick up request

route.get("/PickUpList", getPickUpList); // access persent pick up  request

route.delete("/deleteRequest", deleteRequestU); // delete request

// route.get('/notify', notify);  //send notification
route.get("/getNotifications", getNotifications); // access notifications

route.post("/addContact", addContact); // add request to be scheduled
// route.get('/request', getRequest);  //access request

// --------------------------------------------------------------------
// Admin
route.get("/getAllPickUpRequests", getAllPickUpRequests); // get pending pick-up request to be scheduled
route.get("/getTrucksList", getTrucksList);
route.get("/getPendingPickUpRequests", getPendingPickUpRequests);
route.get("/getIdleTrucks", getIdleTrucks); // get information of available truck

route.post("/addRoute", getAvailableSlot); // get information of available time slot
route.get("/getRoute", getRoute); // get information of available time slot
route.get("/addRoute", addRoute); // get information of available time slot

// --------------------------------------------------------------------
// Truck
route.put("/pickUpComplete", pickUpComplete); //

// --------------------------------------------------------------------
// ML Features
route.get("/api/ml/waste-prediction", getWastePrediction);
route.get("/api/ml/optimize-routes", getOptimizedRoutes);

// Spatial Analysis Features
route.get("/api/spatial/pickup-heatmap", getPickupHeatmapData);

// --------------------------------------------------------------------
// Computer Vision Features
route.post("/api/cv/detect-bins", detectBinsInImage);

// --------------------------------------------------------------------
// Fleet Management / Dynamic Routing
route.post("/api/fleet/generate-dynamic-routes", generateDynamicRoutes);

export default route;
