require('dotenv').config();

// const app = require("./src/app");
// const prisma = require("./src/database");

// const PORT = process.env.PORT || 4000;

// app.listen(PORT, async () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
//   try {
//     await prisma.$connect();
//     console.log("Prisma connected to the database");
//   } catch (error) {
//     console.error("Error connecting to the database:", error);
//   }
// });
// server.js
// server.js or main file
require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const io = require('./socketio'); // Ensure this path is correct
const prisma = require('./src/database');

const PORT = process.env.PORT || 4000;

// Create HTTP server and attach Express app
const server = http.createServer(app);

// Attach Socket.IO instance to the HTTP server
io.attach(server);

server.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log("Prisma connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
});

