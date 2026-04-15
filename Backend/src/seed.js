import mongoose from "mongoose";
import Vocabulary from "../models/Vocabulary.js";
import Set from "../models/Set.js";
import User from "../models/User.js";

const sampleVocabulary = [
  {
    word: "ubiquitous",
    phonetic: "/juːˈbɪkwɪtəs/",
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "present, appearing, or found everywhere",
        example: "Smartphones have become ubiquitous in modern society."
      }
    ],
    synonyms: ["omnipresent", "universal", "pervasive"],
    antonyms: ["rare", "scarce", "uncommon"],
    examples: [
      {
        sentence: "In today's digital age, social media has become ubiquitous, with people accessing it from anywhere at any time.",
        translation: "Trong thời đại kỹ thuật số ngày nay, mạng xã hội đã trở nên phổ biến, với mọi người truy cập nó từ bất kỳ đâu vào bất kỳ lúc nào."
      },
      {
        sentence: "The ubiquitous presence of surveillance cameras in cities raises concerns about privacy.",
        translation: "Sự hiện diện phổ biến của camera giám sát trong các thành phố gây lo ngại về quyền riêng tư."
      },
      {
        sentence: "Plastic packaging has become ubiquitous in supermarkets, making waste reduction a global challenge.",
        translation: "Bao bì nhựa đã trở nên phổ biến trong siêu thị, khiến việc giảm rác thải trở thành thách thức toàn cầu."
      }
    ],
    collocations: [
      {
        phrase: "ubiquitous technology",
        meaning: "công nghệ phổ biến",
        example: "Ubiquitous technology has transformed the way we communicate."
      },
      {
        phrase: "become ubiquitous",
        meaning: "trở nên phổ biến",
        example: "Wireless internet has become ubiquitous in urban areas."
      }
    ],
    difficulty: "advanced",
    tags: ["technology", "society", "modern"],
  },
  {
    word: "meticulous",
    phonetic: "/məˈtɪkjələs/",
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "showing great attention to detail; very careful and precise",
        example: "The scientist was meticulous in her research methodology."
      }
    ],
    synonyms: ["careful", "thorough", "precise", "painstaking"],
    antonyms: ["careless", "sloppy", "negligent"],
    examples: [
      {
        sentence: "The artist was meticulous in painting every tiny detail of the landscape.",
        translation: "Họa sĩ rất tỉ mỉ trong việc vẽ từng chi tiết nhỏ của cảnh quan."
      },
      {
        sentence: "She kept meticulous records of all her expenses for tax purposes.",
        translation: "Cô ấy giữ hồ sơ tỉ mỉ về tất cả các chi phí của mình cho mục đích thuế."
      },
      {
        sentence: "A meticulous proofreader can catch errors that automated tools often miss.",
        translation: "Một người đọc sửa tỉ mỉ có thể phát hiện lỗi mà công cụ tự động thường bỏ sót."
      }
    ],
    collocations: [
      {
        phrase: "meticulous attention",
        meaning: "sự chú ý tỉ mỉ",
        example: "He paid meticulous attention to every aspect of the project."
      },
      {
        phrase: "meticulous planning",
        meaning: "sự lập kế hoạch tỉ mỉ",
        example: "The success of the event was due to meticulous planning."
      }
    ],
    difficulty: "intermediate",
    tags: ["personality", "work", "precision"],
  },
  {
    word: "resilient",
    phonetic: "/rɪˈzɪliənt/",
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "able to recover quickly from difficulties; tough",
        example: "Children are often more resilient than adults in coping with change."
      }
    ],
    synonyms: ["tough", "strong", "durable", "hardy"],
    antonyms: ["fragile", "weak", "vulnerable"],
    examples: [
      {
        sentence: "The resilient community quickly rebuilt their homes after the natural disaster.",
        translation: "Cộng đồng kiên cường nhanh chóng xây dựng lại nhà cửa sau thảm họa tự nhiên."
      },
      {
        sentence: "Despite facing numerous setbacks, she remained resilient and determined to succeed.",
        translation: "Mặc dù đối mặt với nhiều thất bại, cô ấy vẫn kiên cường và quyết tâm thành công."
      },
      {
        sentence: "Rubber bands are resilient; they return to their original shape after being stretched.",
        translation: "Dây thun có độ đàn hồi; chúng trở lại hình dạng ban đầu sau khi bị kéo giãn."
      }
    ],
    collocations: [
      {
        phrase: "resilient economy",
        meaning: "nền kinh tế kiên cường",
        example: "The country's resilient economy recovered quickly from the recession."
      },
      {
        phrase: "build resilience",
        meaning: "xây dựng khả năng phục hồi",
        example: "Regular exercise helps build physical and mental resilience."
      }
    ],
    difficulty: "intermediate",
    tags: ["strength", "recovery", "character"],
  }
];

const sampleSets = [
  {
    title: "Advanced English Vocabulary",
    description: "A collection of advanced English words with detailed definitions, examples, and collocations",
    cards: [
      {
        front: "ubiquitous",
        back: "present, appearing, or found everywhere\n\nSynonyms: omnipresent, universal, pervasive\n\nExample: Smartphones have become ubiquitous in modern society.",
        vocabularyId: null, // Will be set after creating vocabulary
        difficulty: "hard",
        tags: ["advanced", "technology"],
      },
      {
        front: "meticulous",
        back: "showing great attention to detail; very careful and precise\n\nSynonyms: careful, thorough, precise\n\nExample: The scientist was meticulous in her research methodology.",
        vocabularyId: null,
        difficulty: "medium",
        tags: ["intermediate", "personality"],
      },
      {
        front: "resilient",
        back: "able to recover quickly from difficulties; tough\n\nSynonyms: tough, strong, durable\n\nExample: Children are often more resilient than adults in coping with change.",
        vocabularyId: null,
        difficulty: "medium",
        tags: ["intermediate", "strength"],
      }
    ],
    studyMode: "mixed",
    category: "vocabulary",
    language: "en",
    targetLanguage: "vi",
    isPublic: true,
  }
];

export const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Create vocabulary
    console.log("📚 Creating vocabulary...");
    const createdVocabulary = await Vocabulary.insertMany(sampleVocabulary);
    console.log(`✅ Created ${createdVocabulary.length} vocabulary words`);

    // Update set cards with vocabulary IDs
    sampleSets[0].cards[0].vocabularyId = createdVocabulary[0]._id;
    sampleSets[0].cards[1].vocabularyId = createdVocabulary[1]._id;
    sampleSets[0].cards[2].vocabularyId = createdVocabulary[2]._id;

    // Get a sample user (assuming there's at least one user)
    const sampleUser = await User.findOne();
    if (!sampleUser) {
      console.log("⚠️  No users found. Please create a user first.");
      return;
    }

    // Create sets
    console.log("📋 Creating sets...");
    const setsWithOwner = sampleSets.map(set => ({
      ...set,
      owner: sampleUser._id,
    }));

    const createdSets = await Set.insertMany(setsWithOwner);
    console.log(`✅ Created ${createdSets.length} sets`);

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${createdVocabulary.length} vocabulary words`);
    console.log(`   - ${createdSets.length} sets`);
    console.log(`   - ${createdSets[0].cards.length} cards in the main set`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
};

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoose = require('mongoose');
  const dotenv = require('dotenv');

  dotenv.config();

  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log("📦 Connected to MongoDB");
      return seedDatabase();
    })
    .then(() => {
      console.log("🏁 Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}