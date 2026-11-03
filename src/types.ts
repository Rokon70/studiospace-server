import { ObjectId } from "mongodb";

export const CATEGORIES = [
  "Photo Studio",
  "Film Stage",
  "Podcast Lounge",
  "Music Suite",
  "Workshop",
] as const;
export type StudioCategory = (typeof CATEGORIES)[number];

export interface Review {
  userEmail: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Studio {
  _id?: ObjectId;
  title: string;
  category: StudioCategory;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  image: string;
  gallery: string[];
  amenities: string[];
  overview: string;
  rating: number;
  reviews: Review[];
  ownerEmail: string;
  ownerName: string;
  createdAt: Date;
}

export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export interface Booking {
  _id?: ObjectId;
  studioId: ObjectId;
  studioTitle: string;
  studioImage: string;
  userEmail: string;
  userName: string;
  startAt: Date;
  endAt: Date;
  hours: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date;
}

export interface WishlistItem {
  _id?: ObjectId;
  userEmail: string;
  studioId: ObjectId;
}

export interface AuthUser {
  email: string;
  name: string;
  image?: string;
}
