import { Router } from "express";
import { ObjectId } from "mongodb";
import { wishlist } from "../db";
import { verifyToken } from "../middleware/auth";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  const items = await wishlist().find({ userEmail: req.user!.email }).toArray();
  res.json(items.map((i) => i.studioId.toString()));
});

// Toggle save / unsave
router.post("/:studioId", verifyToken, async (req, res) => {
  if (!ObjectId.isValid(String(req.params.studioId))) return res.status(400).json({ message: "Invalid studio id" });
  const studioId = new ObjectId(String(req.params.studioId));
  const filter = { userEmail: req.user!.email, studioId };
  const existing = await wishlist().findOne(filter);
  if (existing) {
    await wishlist().deleteOne(filter);
    return res.json({ saved: false });
  }
  await wishlist().insertOne(filter);
  res.json({ saved: true });
});

export default router;
