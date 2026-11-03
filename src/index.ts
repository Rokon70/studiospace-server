import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db";
import studioRoutes from "./routes/studios";
import bookingRoutes from "./routes/bookings";
import wishlistRoutes from "./routes/wishlist";

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => res.send("StudioSpace API is running"));
app.use("/api/studios", studioRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const port = Number(process.env.PORT) || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`Server running on port ${port}`)))
  .catch((e) => {
    console.error("Failed to connect to MongoDB", e);
    process.exit(1);
  });
