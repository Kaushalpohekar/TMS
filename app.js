const express = require('express');
const cors = require('cors');
// const router = require('./routes');
// const fs = require('fs');
const bodyParser = require('body-parser');
// const cron = require('node-cron');
const path = require('path');
// require('./dash/alert');

const authRoute= require('./routes/authRoute');
const dashRoute= require('./routes/dashboardRoutes');
const app = express();
const port = 8080;

// CORS Configuration
// const allowedOrigins = ['http://localhost:4200', 'localhost:4200', 'http://localhost:4000', 'localhost:4000','http://localhost:8080','localhost:8080']; // Update with your actual allowed origins


// app.use((req, res, next) => {
//   const origin = req.headers.origin || req.headers.host; // Use host if origin is undefined
//   console.log(`Request received from Origin: ${origin}, Host: ${req.headers.host}`);

//   // Allow requests with undefined origin or matching allowed origins
//   if (!origin || allowedOrigins.includes(origin)) {
//     next();
//   } else {
//     console.error(`Access Denied: Origin "${origin}" or Host "${req.headers.host}" is not allowed.`);
//     return res.status(403).sendFile(path.join(__dirname, 'public', 'access_denied.html'));
//   }
// });

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


app.use('/api',authRoute);
app.use('/dash',dashRoute);



// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});