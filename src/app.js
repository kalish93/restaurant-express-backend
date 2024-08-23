const express = require("express");
const userRoutes = require("./routes/auth/useRoutes");
const roleRoutes = require("./routes/auth/roleRoutes");
const restaurantRoutes = require("./routes/restaurant/restaurantRoutes");
const stockRoutes = require("./routes/restaurant/stockRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const cors = require("cors");
const app = express();
app.use(cors());

const fs = require('fs');
const path = require('path');

// Define the path to the uploads directory
const uploadsDir = path.join(__dirname, '/public/uploads');
app.use('/api/uploads', express.static(path.join(__dirname, '/public/uploads')));


// Create the directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const { json, urlencoded } = require("body-parser");

// app.use(express.json());
app.use(json({ limit: '10mb' }))
app.use(urlencoded({ limit: '10mb', extended: true }))

app.use("/api", userRoutes);
app.use("/api", roleRoutes);
app.use("/api", restaurantRoutes);
app.use("/api", stockRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
