import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

import route from './Router/routes.js';
import Connection from './database/db.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', route);

const PORT = 8000;

Connection();

app.listen(PORT, () => console.log('Your server is up and running on PORT: ' + PORT));

// console.log("Hello Nodemon");