/**
 * Dữ liệu mẫu cho demo: 3 từ, mỗi từ có ít nhất 3 ví dụ (câu + bản dịch).
 * Dùng bởi seed-demo-extra.js hoặc tham chiếu cùng vocabulary-demo-sample.csv ở thư mục gốc dự án.
 */
export const demoSampleWords = [
  {
    word: "sustainable",
    phonetic: "/səˈsteɪnəbl/",
    difficulty: "intermediate",
    tags: ["demo", "ielts", "environment"],
    synonyms: ["renewable", "eco-friendly"],
    antonyms: ["unsustainable", "harmful"],
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "able to continue without harming people or the environment",
        example: "Solar power is a sustainable energy source.",
      },
    ],
    examples: [
      {
        sentence: "We need sustainable cities for the next generation.",
        translation: "Chúng ta cần các thành phố bền vững cho thế hệ tới.",
      },
      {
        sentence: "This policy aims to keep growth economically sustainable.",
        translation: "Chính sách này nhằm duy trì tăng trưởng bền vững về kinh tế.",
      },
      {
        sentence: "The forest is managed in a sustainable way to protect biodiversity.",
        translation: "Khu rừng được quản lý bền vững để bảo vệ đa dạng sinh học.",
      },
    ],
    collocations: [
      {
        phrase: "sustainable development",
        meaning: "phát triển bền vững",
        example: "The UN promotes sustainable development goals worldwide.",
      },
      {
        phrase: "sustainable energy",
        meaning: "năng lượng bền vững",
        example: "Wind farms provide sustainable energy for rural areas.",
      },
      {
        phrase: "sustainable future",
        meaning: "tương lai bền vững",
        example: "Students want a sustainable future with clean air and water.",
      },
    ],
  },
  {
    word: "innovative",
    phonetic: "/ˈɪnəveɪtɪv/",
    difficulty: "intermediate",
    tags: ["demo", "ielts", "business"],
    synonyms: ["creative", "original"],
    antonyms: ["traditional", "outdated"],
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "introducing new ideas or methods",
        example: "The startup is known for its innovative products.",
      },
    ],
    examples: [
      {
        sentence: "The hospital introduced an innovative treatment for patients.",
        translation: "Bệnh viện áp dụng phương pháp điều trị đổi mới cho bệnh nhân.",
      },
      {
        sentence: "Teachers use innovative tools to engage students online.",
        translation: "Giáo viên dùng công cụ đổi mới để tương tác với học sinh trực tuyến.",
      },
      {
        sentence: "Her innovative design won an international award.",
        translation: "Thiết kế đột phá của cô ấy đoạt giải quốc tế.",
      },
    ],
    collocations: [
      {
        phrase: "innovative solution",
        meaning: "giải pháp đổi mới",
        example: "The team proposed an innovative solution to reduce waste.",
      },
      {
        phrase: "innovative thinking",
        meaning: "tư duy đổi mới",
        example: "Innovative thinking helps companies adapt quickly.",
      },
      {
        phrase: "innovative approach",
        meaning: "cách tiếp cận mới",
        example: "An innovative approach saved time and money.",
      },
    ],
  },
  {
    word: "collaborate",
    phonetic: "/kəˈlæbəreɪt/",
    difficulty: "beginner",
    tags: ["demo", "ielts", "work"],
    synonyms: ["cooperate", "partner"],
    antonyms: ["compete", "isolate"],
    definitions: [
      {
        partOfSpeech: "verb",
        meaning: "to work together with someone to achieve something",
        example: "Researchers collaborate across countries.",
      },
    ],
    examples: [
      {
        sentence: "We collaborate with local schools on reading programs.",
        translation: "Chúng ta phối hợp với trường địa phương trong chương trình đọc.",
      },
      {
        sentence: "Two teams collaborate to finish the project before the deadline.",
        translation: "Hai nhóm phối hợp để hoàn thành dự án trước hạn.",
      },
      {
        sentence: "Artists collaborate with engineers to build interactive exhibits.",
        translation: "Nghệ sĩ hợp tác với kỹ sư để dựng triển lãm tương tác.",
      },
    ],
    collocations: [
      {
        phrase: "collaborate with colleagues",
        meaning: "hợp tác với đồng nghiệp",
        example: "We collaborate with colleagues in other time zones daily.",
      },
      {
        phrase: "collaborate on research",
        meaning: "cộng tác nghiên cứu",
        example: "Universities collaborate on research about climate change.",
      },
      {
        phrase: "collaborate effectively",
        meaning: "phối hợp hiệu quả",
        example: "Clear roles help teams collaborate effectively.",
      },
    ],
  },
];
