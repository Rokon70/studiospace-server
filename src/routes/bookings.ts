import { Router } from "express";
import { Filter, ObjectId } from "mongodb";
import { bookings, studios } from "../db";
import { verifyToken } from "../middleware/auth";
import { Booking } from "../types";

const router = Router();
const parseId = (id: string) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

// Challenge 2: overlap rule -> existingStart < newEnd AND existingEnd > newStart
async function hasClash(studioId: ObjectId, start: Date, end: Date, excludeId?: ObjectId) {
  const filter: Filter<Booking> = {
    studioId,
    status: "Confirmed",
    startAt: { $lt: end },
    endAt: { $gt: start },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return !!(await bookings().findOne(filter));
}

// Create booking (status: Pending)
router.post("/", verifyToken, async (req, res) => {
  const { studioId, startAt, endAt } = (req.body ?? {}) as {
    studioId?: string;
    startAt?: string;
    endAt?: string;
  };
  const sid = parseId(String(studioId));
  if (!sid) return res.status(400).json({ message: "Invalid studio id" });

  const start = new Date(String(startAt));
  const end = new Date(String(endAt));
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ message: "End time must be after the start time" });
  }
  if (start < new Date()) {
    return res.status(400).json({ message: "Start time must be in the future" });
  }

  const studio = await studios().findOne({ _id: sid });
  if (!studio) return res.status(404).json({ message: "Studio not found" });
  if (studio.ownerEmail === req.user!.email) {
    return res.status(400).json({ message: "You cannot book your own studio" });
  }

  if (await hasClash(sid, start, end)) {
    return res
      .status(409)
      .json({ message: "This time slot is already booked. Please choose a different time." });
  }

  const hours = Math.round(((end.getTime() - start.getTime()) / 36e5) * 100) / 100;
  const booking: Booking = {
    studioId: sid,
    studioTitle: studio.title,
    studioImage: studio.image,
    userEmail: req.user!.email,
    userName: req.user!.name,
    startAt: start,
    endAt: end,
    hours,
    totalPrice: Math.round((hours * studio.hourlyRate + studio.securityDeposit) * 100) / 100,
    status: "Pending",
    createdAt: new Date(),
  };
  const result = await bookings().insertOne(booking);
  res.status(201).json({ insertedId: result.insertedId });
});

// My bookings
router.get("/mine", verifyToken, async (req, res) => {
  res.json(await bookings().find({ userEmail: req.user!.email }).sort({ createdAt: -1 }).toArray());
});

// Booking requests for studios I own
router.get("/requests", verifyToken, async (req, res) => {
  const mine = await studios()
    .find({ ownerEmail: req.user!.email }, { projection: { _id: 1 } })
    .toArray();
  const ids = mine.map((s) => s._id as ObjectId);
  res.json(await bookings().find({ studioId: { $in: ids } }).sort({ createdAt: -1 }).toArray());
});

// Guest cancels (Pending only)
router.patch("/:id/cancel", verifyToken, async (req, res) => {
  const id = parseId(String(req.params.id));
  if (!id) return res.status(400).json({ message: "Invalid booking id" });
  const result = await bookings().updateOne(
    { _id: id, userEmail: req.user!.email, status: "Pending" },
    { $set: { status: "Cancelled" } }
  );
  if (!result.matchedCount) return res.status(400).json({ message: "Only pending bookings can be cancelled" });
  res.json({ success: true });
});

// Host updates status: Confirmed / Completed / Cancelled
router.patch("/:id/status", verifyToken, async (req, res) => {
  const id = parseId(String(req.params.id));
  if (!id) return res.status(400).json({ message: "Invalid booking id" });
  const next = String(req.body?.status);
  if (!["Confirmed", "Completed", "Cancelled"].includes(next)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const booking = await bookings().findOne({ _id: id });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  const studio = await studios().findOne({ _id: booking.studioId });
  if (!studio || studio.ownerEmail !== req.user!.email) {
    return res.status(403).json({ message: "Only the studio host can change this booking" });
  }

  if (next === "Confirmed") {
    if (booking.status !== "Pending") return res.status(400).json({ message: "Only pending bookings can be confirmed" });
    if (await hasClash(booking.studioId, booking.startAt, booking.endAt, booking._id)) {
      return res.status(409).json({ message: "Another confirmed booking already uses this time slot" });
    }
  }
  if (next === "Completed" && booking.status !== "Confirmed") {
    return res.status(400).json({ message: "Only confirmed bookings can be completed" });
  }
  if (next === "Cancelled" && !["Pending", "Confirmed"].includes(booking.status)) {
    return res.status(400).json({ message: "This booking can no longer be cancelled" });
  }

  await bookings().updateOne({ _id: id }, { $set: { status: next as Booking["status"] } });
  res.json({ success: true });
});

export default router;
