/**
 * Thêm 3 từ mẫu (demo) vào MongoDB nếu chưa tồn tại — mỗi từ có 3 ví dụ + collocation.
 * Chạy: npm run seed:demo (từ thư mục Backend, cần MONGO_URI và ít nhất một user để gán createdBy).
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import Vocabulary from "./models/Vocabulary.js";
import { demoSampleWords } from "./data/demoSampleWords.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  if (!MONGO_URI) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const user = await User.findOne();
  if (!user) {
    console.warn("No user in database — run register first. Words will be created without createdBy.");
  }

  let inserted = 0;
  let skipped = 0;

  for (const entry of demoSampleWords) {
    const word = entry.word.toLowerCase();
    const exists = await Vocabulary.findOne({ word });
    if (exists) {
      console.log(`Skip (exists): ${word}`);
      skipped += 1;
      continue;
    }
    await Vocabulary.create({
      ...entry,
      word,
      isPublic: true,
      createdBy: user?._id,
    });
    console.log(`Inserted: ${word} (3 examples, 3 collocations)`);
    inserted += 1;
  }

  console.log(`\nDone. Inserted: ${inserted}, skipped: ${skipped}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
