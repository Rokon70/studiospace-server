import { Router } from "express";
import { Filter, ObjectId, Sort } from "mongodb";
import { studios } from "../db";
import { verifyToken } from "../middleware/auth";
import { CATEGORIES, Review, Studio, StudioCategory } from "../types";

const router = Router();

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const parseId = (id: string) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

function sanitize(b: Record<string, unknown>) {
  const list = (v: unknown) =>
    Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
  return {
    title: String(b.title ?? "").trim(),
    category: String(b.category ?? "") as StudioCategory,
    hourlyRate: Number(b.hourlyRate),
    securityDeposit: Number(b.securityDeposit),
    maxCapacity: Number(b.maxCapacity),
    location: String(b.location ?? "").trim(),
    image: String(b.image ?? "").trim(),
    gallery: list(b.gallery),
    amenities: list(b.amenities),
    overview: String(b.overview ?? "").trim(),
  };
}

function validate(s: ReturnType<typeof sanitize>): string | null {
  if (!s.title || !s.location || !s.image || !s.overview) return "Please fill in all required fields";
  if (!CATEGORIES.includes(s.category)) return "Please choose a valid category";
  if (!(s.hourlyRate > 0)) return "Hourly rate must be greater than 0";
  if (!(s.securityDeposit >= 0)) return "Security deposit cannot be negative";
  if (!(s.maxCapacity >= 1)) return "Max capacity must be at least 1";
  return null;
}

// Public: list with search / filter / sort / limit
router.get("/", async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const filter: Filter<Studio> = {};
  if (q.category && CATEGORIES.includes(q.category as StudioCategory)) {
    filter.category = q.category as StudioCategory;
  }
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    filter.$or = [{ title: rx }, { location: rx }];
  }
  const sort: Sort =
    q.sort === "price-asc"
      ? { hourlyRate: 1 }
      : q.sort === "price-desc"
      ? { hourlyRate: -1 }
      : q.sort === "rating"
      ? { rating: -1, createdAt: -1 }
      : { createdAt: -1 };

  let cursor = studios().find(filter, { projection: { reviews: 0 } }).sort(sort);
  const limit = Number(q.limit);
  if (limit > 0) cursor = cursor.limit(Math.min(limit, 60)); // Home page uses ?limit=6
  res.json(await cursor.toArray());
});

// Private: my listings (must be above "/:id")
router.get("/mine/list", verifyToken, async (req, res) => {
  const list = await studios()
    .find({ ownerEmail: req.user!.email }, { projection: { reviews: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(list);
});

// Public: details
router.get("/:id", async (req, res) => {
  const id = parseId(String(req.params.id));
  if (!id) return res.status(400).json({ message: "Invalid studio id" });
  const studio = await studios().findOne({ _id: id });
  if (!studio) return res.status(404).json({ message: "Studio not found" });
  res.json(studio);
});

// Private: create
router.post("/", verifyToken, async (req, res) => {
  const data = sanitize(req.body ?? {});
  const error = validate(data);
  if (error) return res.status(400).json({ message: error });

  const doc: Studio = {
    ...data,
    rating: 0,
    reviews: [],
    ownerEmail: req.user!.email, // taken from the token, never from the body
    ownerName: req.user!.name,
    createdAt: new Date(),
  };
  const result = await studios().insertOne(doc);
  res.status(201).json({ insertedId: result.insertedId });
});

// Private: update (owner only)
router.put("/:id", verifyToken, async (req, res) => {
  const id = parseId(String(req.params.id));
  if (!id) return res.status(400).json({ message: "Invalid studio id" });
  const data = sanitize(req.body ?? {});
  const error = validate(data);
  if (error) return res.status(400).json({ message: error });

  const result = await studios().updateOne(
    { _id: id, ownerEmail: req.user!.email },
    { $set: data }
  );
  if (!result.matchedCount) return res.status(403).json({ message: "You can only edit your own listings" });
  res.json({ success: true });
});

// Private: delete (owner only)
router.delete("/:id", verifyToken, async (req, res) => {
  const id = parseId(String(req.params.id));
  if (!id) return res.status(400).json({ message: "Invalid studio id" });
  const result = await studios().deleteOne({ _id: id, ownerEmail: req.user!.email });
  if (!result.deletedCount) return res.status(403).json({ message: "You can only delete your own listings" });
  res.json({ success: true });
});

// Private: add a review
router.post("/:id/reviews", verifyToken, async (req, res) => {
  const id = parseId(String(req.params.id));
  if (!id) return res.status(400).json({ message: "Invalid studio id" });
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment ?? "").trim();
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: "Rating must be between 1 and 5" });
  if (comment.length < 3) return res.status(400).json({ message: "Please write a short comment" });

  const studio = await studios().findOne({ _id: id });
  if (!studio) return res.status(404).json({ message: "Studio not found" });
  if (studio.ownerEmail === req.user!.email) {
    return res.status(400).json({ message: "You cannot review your own studio" });
  }
  const existing = studio.reviews ?? [];
  if (existing.some((r) => r.userEmail === req.user!.email)) {
    return res.status(409).json({ message: "You have already reviewed this studio" });
  }

  const review: Review = {
    userEmail: req.user!.email,
    userName: req.user!.name,
    userImage: req.user!.image,
    rating,
    comment,
    createdAt: new Date(),
  };
  const all = [...existing, review];
  const avg = Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10;
  await studios().updateOne({ _id: id }, { $push: { reviews: review }, $set: { rating: avg } });
  res.status(201).json({ rating: avg, review });
});

export default router;
