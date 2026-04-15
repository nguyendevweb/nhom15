import Vocabulary from "../models/Vocabulary.js";

// Controller xử lý từ vựng: lấy, tạo, cập nhật, xóa, import/export và gợi ý

const parseCsvCells = (value) => {
  if (!value || !value.trim()) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const parseDelimitedItems = (value, itemSeparator = ";;", fieldSeparator = "|") => {
  if (!value || !value.trim()) return [];
  return value.split(itemSeparator).map((item) => {
    const parts = item.split(fieldSeparator).map((part) => part.trim());
    return parts;
  }).filter((parts) => parts.length > 0);
};

const escapeCsvValue = (value) => {
  if (value == null) return "";
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// Get all vocabulary words with filtering
export const getVocabulary = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      difficulty,
      tags,
      search,
      isPublic = 'true'
    } = req.query;

    const isPublicValue = String(isPublic).toLowerCase() === 'true';
    const query = { isPublic: isPublicValue };

    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { 'definitions.meaning': { $regex: search, $options: 'i' } },
        { synonyms: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    console.log(`Lấy danh sách từ vựng, page=${page}, limit=${limit}, difficulty=${difficulty || 'all'}, tags=${tags || 'all'}, search=${search || 'none'}`);
    const vocabulary = await Vocabulary.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vocabulary.countDocuments(query);

    res.json({
      vocabulary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy vocabulary:", error.message);
    next(error);
  }
};

// Get single vocabulary word
export const getVocabularyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Lấy vocabulary theo id=${id}`);
    const vocabulary = await Vocabulary.findById(id).populate('createdBy', 'name');

    if (!vocabulary) {
      console.log(`Không tìm thấy vocabulary id=${id}`);
      return res.status(404).json({ message: "Vocabulary not found" });
    }

    res.json({ vocabulary });
  } catch (error) {
    console.error("Lỗi khi lấy vocabulary theo id:", error.message);
    next(error);
  }
};

// Create new vocabulary word
export const createVocabulary = async (req, res, next) => {
  try {
    const { word, phonetic, definitions, synonyms, antonyms, examples, collocations, difficulty, tags, audioUrl, imageUrl } = req.body;

    // Check if word already exists
    const existingWord = await Vocabulary.findOne({ word: word.toLowerCase() });
    if (existingWord) {
      console.log(`Tạo từ mới thất bại: từ đã tồn tại (${word})`);
      return res.status(409).json({ message: "Word already exists" });
    }

    const vocabulary = await Vocabulary.create({
      word: word.toLowerCase(),
      phonetic,
      definitions,
      synonyms,
      antonyms,
      examples,
      collocations,
      difficulty,
      tags,
      audioUrl,
      imageUrl,
      createdBy: req.user.id,
    });

    console.log(`Tạo từ mới thành công: ${word}`);
    res.status(201).json({ vocabulary });
  } catch (error) {
    console.error("Lỗi khi tạo vocabulary:", error.message);
    next(error);
  }
};

// Update vocabulary word
export const updateVocabulary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`Cập nhật vocabulary id=${id}`);
    const vocabulary = await Vocabulary.findByIdAndUpdate(id, updates, { new: true });
    if (!vocabulary) {
      console.log(`Không tìm thấy vocabulary id=${id}`);
      return res.status(404).json({ message: "Vocabulary not found" });
    }

    res.json({ vocabulary });
  } catch (error) {
    console.error("Lỗi khi cập nhật vocabulary:", error.message);
    next(error);
  }
};

// Delete vocabulary word
export const deleteVocabulary = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Xóa vocabulary id=${id}`);
    const vocabulary = await Vocabulary.findByIdAndDelete(id);

    if (!vocabulary) {
      console.log(`Không tìm thấy vocabulary để xóa id=${id}`);
      return res.status(404).json({ message: "Vocabulary not found" });
    }

    res.json({ message: "Vocabulary deleted successfully" });
  } catch (error) {
    console.error("Lỗi khi xóa vocabulary:", error.message);
    next(error);
  }
};

// Import vocabulary words from CSV
export const importVocabulary = async (req, res, next) => {
  try {
    if (!req.file) {
      console.log("Import vocabulary thất bại: không tìm thấy file CSV");
      return res.status(400).json({ message: "CSV file is required" });
    }

    const csvText = req.file.buffer.toString('utf8');
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (rows.length < 2) {
      console.log("Import CSV thất bại: file CSV không có header hoặc dữ liệu");
      return res.status(400).json({ message: "CSV file must contain a header and at least one row" });
    }

    const detectDelimiter = (line) => {
      const commaCount = (line.match(/,/g) || []).length;
      const semicolonCount = (line.match(/;/g) || []).length;
      return semicolonCount > commaCount ? ';' : ',';
    };

    const parseCsvLine = (line, delimiter) => {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);
      return values.map((value) => value.trim());
    };

    const delimiter = detectDelimiter(rows[0]);
    const headers = parseCsvLine(rows[0], delimiter)
      .map((item) => item.replace(/^\uFEFF/, '').trim().toLowerCase());
    const requiredHeaders = ['word', 'phonetic', 'difficulty', 'tags', 'synonyms', 'antonyms', 'definitions', 'examples', 'collocations'];


    const headerMap = headers.reduce((map, header, index) => {
      map[header] = index;
      return map;
    }, {});

    const missingHeaders = requiredHeaders.filter((header) => !(header in headerMap));
    if (missingHeaders.length > 0) {
      console.log(`Import CSV thất bại: thiếu header ${missingHeaders.join(', ')}`);
      return res.status(400).json({ message: `CSV headers must include: ${requiredHeaders.join(', ')}` });
    }

    const imported = [];
    const skipped = [];

    const getColumn = (columns, header) => {
      const index = headerMap[header];
      return index >= 0 ? (columns[index] || '').trim() : '';
    };

    for (let i = 1; i < rows.length; i += 1) {
      const columns = parseCsvLine(rows[i], delimiter);
      const word = getColumn(columns, 'word');
      const phonetic = getColumn(columns, 'phonetic');
      const difficulty = getColumn(columns, 'difficulty');
      const tags = getColumn(columns, 'tags');
      const synonyms = getColumn(columns, 'synonyms');
      const antonyms = getColumn(columns, 'antonyms');
      const definitions = getColumn(columns, 'definitions');
      const examples = getColumn(columns, 'examples');
      const collocations = getColumn(columns, 'collocations');
      const audioUrl = getColumn(columns, 'audiourl');
      const imageUrl = getColumn(columns, 'imageurl');
      if (!word) {
        skipped.push({ row: i + 1, reason: 'Missing word' });
        continue;
      }

      const existing = await Vocabulary.findOne({ word: word.toLowerCase() });
      if (existing) {
        skipped.push({ row: i + 1, word, reason: 'Already exists' });
        continue;
      }

      const definitionItems = parseDelimitedItems(definitions).map((parts) => ({
        partOfSpeech: parts[0] || 'unknown',
        meaning: parts[1] || '',
        example: parts[2] || '',
      }));

      const exampleItems = parseDelimitedItems(examples).map((parts) => ({
        sentence: parts[0] || '',
        translation: parts[1] || '',
      }));

      const collocationItems = parseDelimitedItems(collocations).map((parts) => ({
        phrase: parts[0] || '',
        meaning: parts[1] || '',
        example: parts[2] || '',
      }));

      const vocabulary = await Vocabulary.create({
        word: word.toLowerCase(),
        phonetic,
        difficulty: difficulty || 'intermediate',
        tags: parseCsvCells(tags),
        synonyms: parseCsvCells(synonyms),
        antonyms: parseCsvCells(antonyms),
        definitions: definitionItems,
        examples: exampleItems,
        collocations: collocationItems,
        audioUrl: audioUrl || '',
        imageUrl: imageUrl || '',
        createdBy: req.user.id,
      });

      imported.push(vocabulary);
    }

    res.json({ importedCount: imported.length, skipped, imported });
  } catch (error) {
    next(error);
  }
};

// Export vocabulary words to CSV
export const exportVocabulary = async (req, res, next) => {
  try {
    const {
      difficulty,
      tags,
      search,
      isPublic = 'true'
    } = req.query;

    const query = { isPublic: isPublic === 'true' };
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { 'definitions.meaning': { $regex: search, $options: 'i' } },
        { synonyms: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    console.log(`Xuất vocabulary ra CSV với filter difficulty=${difficulty || 'all'} tags=${tags || 'all'} search=${search || 'none'}`);
    const vocabulary = await Vocabulary.find(query).sort({ createdAt: -1 });
    const headers = ['word', 'phonetic', 'difficulty', 'tags', 'synonyms', 'antonyms', 'definitions', 'examples', 'collocations', 'audioUrl', 'imageUrl'];
    const csvRows = [headers.join(',')];

    vocabulary.forEach((word) => {
      const definitionString = word.definitions.map((def) => `${def.partOfSpeech}|${def.meaning}|${def.example || ''}`).join(';;');
      const exampleString = word.examples.map((ex) => `${ex.sentence}|${ex.translation}`).join(';;');
      const collocationString = word.collocations.map((col) => `${col.phrase}|${col.meaning}|${col.example || ''}`).join(';;');

      const row = [
        escapeCsvValue(word.word),
        escapeCsvValue(word.phonetic),
        escapeCsvValue(word.difficulty),
        escapeCsvValue((word.tags || []).join(',')),
        escapeCsvValue((word.synonyms || []).join(',')),
        escapeCsvValue((word.antonyms || []).join(',')),
        escapeCsvValue(definitionString),
        escapeCsvValue(exampleString),
        escapeCsvValue(collocationString),
        escapeCsvValue(word.audioUrl),
        escapeCsvValue(word.imageUrl),
      ];

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('vocabulary-export.csv');
    res.send(csvContent);
  } catch (error) {
    console.error("Lỗi khi xuất CSV vocabulary:", error.message);
    next(error);
  }
};

// Get vocabulary suggestions for autocomplete
export const getVocabularySuggestions = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      console.log("Gợi ý từ vựng: query quá ngắn hoặc trống");
      return res.json({ suggestions: [] });
    }

    console.log(`Gợi ý từ vựng cho: ${q}`);
    const suggestions = await Vocabulary.find({
      word: { $regex: `^${q}`, $options: 'i' },
      isPublic: true,
    })
      .select('word definitions.partOfSpeech')
      .limit(parseInt(limit));

    res.json({ suggestions });
  } catch (error) {
    console.error("Lỗi khi gợi ý vocabulary:", error.message);
    next(error);
  }
};