import express, { Application } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import router from "./routes";

const app: Application = express();

app.use(cors());
app.use(express.json());

// Interactive API Documentation (Swagger UI)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Scale Service API Docs",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "list",
    defaultModelsExpandDepth: 1,
    tryItOutEnabled: true,
  },
}));

// Redirect root to /docs
app.get("/", (_req, res) => {
  res.redirect("/docs");
});

app.use("/api", router);

export default app;