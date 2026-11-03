import "dotenv/config";
import { connectDB, studios } from "./db";
import { Studio } from "./types";

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const base = { rating: 0, reviews: [], ownerEmail: "host@studiospace.com", ownerName: "StudioSpace Demo Host" };
const items: Omit<Studio, "createdAt">[] = [
  { ...base, title: "Northlight Cyc Wall Studio", category: "Photo Studio", hourlyRate: 45, securityDeposit: 100, maxCapacity: 8, location: "Banani, Dhaka", image: u("photo-1492691527719-9d1e07e534b4"), gallery: [], amenities: ["Cyc Wall", "Lighting Kit", "Wi-Fi", "Air Conditioning"], overview: "A 900 sq ft white cyclorama wall with north-facing windows and a full strobe kit. Ideal for product, fashion and portrait shoots with a changing room on site." },
  { ...base, title: "Stage 9 Cinema Sound Stage", category: "Film Stage", hourlyRate: 180, securityDeposit: 500, maxCapacity: 40, location: "Uttara, Dhaka", image: u("photo-1478720568477-152d9b164e26"), gallery: [], amenities: ["Soundproofing", "Green Screen", "Lighting Kit", "Parking", "Wi-Fi"], overview: "A fully soundproofed 2,400 sq ft stage with a 14 ft grid, green screen, blackout curtains and three-phase power for feature and commercial productions." },
  { ...base, title: "Quiet Hour Podcast Lounge", category: "Podcast Lounge", hourlyRate: 35, securityDeposit: 50, maxCapacity: 5, location: "Dhanmondi, Dhaka", image: u("photo-1478737270239-2f02b77fc618"), gallery: [], amenities: ["Microphones", "Soundproofing", "Air Conditioning", "Kitchenette"], overview: "A treated room with four Shure mics, a mixer and a comfortable sofa set-up. Record, edit and leave with clean audio for up to four guests." },
  { ...base, title: "Redwave Recording Suite", category: "Music Suite", hourlyRate: 70, securityDeposit: 150, maxCapacity: 10, location: "Gulshan 2, Dhaka", image: u("photo-1598488035139-bdbb2231ce04"), gallery: [], amenities: ["Mixing Console", "Microphones", "Soundproofing", "Wi-Fi"], overview: "A control room and live room with a 24-channel console, isolation booth and a house engineer available on request for tracking and mixing sessions." },
  { ...base, title: "Clay & Canvas Art Workshop", category: "Workshop", hourlyRate: 30, securityDeposit: 40, maxCapacity: 16, location: "Mirpur, Dhaka", image: u("photo-1513364776144-60967b0f800f"), gallery: [], amenities: ["Wi-Fi", "Air Conditioning", "Backdrops", "Kitchenette"], overview: "A bright workshop space with long tables, easels, a sink station and storage shelves for painting classes, pottery sessions and creative meetups." },
  { ...base, title: "Monochrome Portrait Room", category: "Photo Studio", hourlyRate: 40, securityDeposit: 80, maxCapacity: 6, location: "Chattogram", image: u("photo-1516035069371-29a1b244cc32"), gallery: [], amenities: ["Backdrops", "Lighting Kit", "Changing Room", "Wi-Fi"], overview: "A compact portrait studio with six paper backdrops, continuous and flash lighting, and a makeup station for headshots and editorial work." },
];

(async () => {
  await connectDB();
  const count = await studios().countDocuments();
  if (count > 0) {
    console.log(`studios collection already has ${count} documents. Skipping seed.`);
    process.exit(0);
  }
  const now = Date.now();
  await studios().insertMany(items.map((s, i) => ({ ...s, createdAt: new Date(now - i * 3600_000) })));
  console.log(`Seeded ${items.length} studios`);
  process.exit(0);
})();
