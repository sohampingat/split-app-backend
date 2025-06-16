const express = require("express");
const cors = require("cors");
const expenseRoutes = require("./routes/expenseRoutes");
const settlementRoutes = require("./routes/settlementRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/expenses", expenseRoutes);
app.use("/", settlementRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;