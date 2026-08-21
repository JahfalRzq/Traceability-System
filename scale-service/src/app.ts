import express, { Application } from "express";
import cors from "cors";
import weighingRoutes from "./routes/weighingRoutes";

const app: Application = express();

app.use(cors());
app.use(express.json());

// routes akan di-register di sini setelah dibuat
// app.use("/api/weighing", weighingRoutes);

app.use("/api/weighing", weighingRoutes);

export default app;