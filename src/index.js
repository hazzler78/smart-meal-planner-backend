const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/recipes", require("./routes/recipeRoutes"));
app.use("/api/mealplans", require("./routes/mealPlanRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/suggestions", require("./routes/suggestionRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
