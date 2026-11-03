import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { MongoClient, Db, Collection } from "mongodb";
import { Studio, Booking, WishlistItem } from "./types";

const client = new MongoClient(process.env.MONGODB_URI as string);
let db: Db;

export async function connectDB() {
  await client.connect();
  db = client.db("studiospace");
  console.log("MongoDB connected");
}

export const studios = (): Collection<Studio> => db.collection<Studio>("studios");
export const bookings = (): Collection<Booking> => db.collection<Booking>("bookings");
export const wishlist = (): Collection<WishlistItem> => db.collection<WishlistItem>("wishlist");
