import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 1433,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "ScrapSystemManagement",
  synchronize: false, // pakai migration, jangan auto-sync di production
  logging: true,
  entities: [__dirname + "/../entities/*.{ts,js}"],
  migrations: [__dirname + "/../migrations/*.{ts,js}"],
  options: {
    encrypt: false, // true kalau pakai Azure SQL
    trustServerCertificate: true, // untuk local dev
  },
});