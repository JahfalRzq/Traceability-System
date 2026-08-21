import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { AppDataSource } from "./config/database";

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`[central] scale-service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start central server:", err);
    process.exit(1);
  }
};

start();