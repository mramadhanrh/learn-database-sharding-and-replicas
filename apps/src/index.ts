import express from "express";
import cors from "cors";
import { config } from "./config/env.ts";
import { shardManager } from "./infrastructure/database.ts";
import { errorHandler } from "./middleware/validation.ts";
import userRoutes from "./presentation/routes/user.routes.ts";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use("/api/users", userRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize and start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize shard connections
    shardManager.initialize();

    // Start server
    app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await shardManager.closeAll();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await shardManager.closeAll();
  process.exit(0);
});

startServer();
