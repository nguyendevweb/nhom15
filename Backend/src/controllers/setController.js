import Set from "../models/Set.js";

// Controller xử lý bộ flashcard (set) của người dùng
// Bao gồm lấy danh sách, tạo set mới, cập nhật, xóa, nhân bản và tìm kiếm

export const getAllSets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let sets = await Set.find({ $or: [{ isPublic: true }, { owner: userId }] }).populate("owner", "name email avatar");

    const demoTitles = [
      "Demo Flashcard",
      "Demo Spaced Repetition",
      "Demo Context Learning",
    ];
    const hasDemoSets = sets.some((set) => demoTitles.includes(set.title));

    // Nếu user chưa có bộ demo, tạo các bộ demo riêng cho user
    if (!hasDemoSets) {
      const demoSets = [
        {
          title: "Demo Flashcard",
          description: "Bộ thẻ mẫu cho chế độ flashcard",
          studyMode: 'flashcard',
          cards: [
            { front: "Hello", back: "Xin chào", phonetic: "/həˈloʊ/" },
            { front: "Thank you", back: "Cảm ơn", phonetic: "/ˈθæŋk juː/" },
            { front: "Goodbye", back: "Tạm biệt", phonetic: "/ˌɡʊdˈbaɪ/" },
          ],
        },
        {
          title: "Demo Spaced Repetition",
          description: "Bộ thẻ mẫu cho chế độ spaced repetition",
          studyMode: 'spaced_repetition',
          cards: [
            { front: "Please", back: "Làm ơn", phonetic: "/pliz/" },
            { front: "Sorry", back: "Xin lỗi", phonetic: "/ˈsɔːri/" },
            { front: "Yes", back: "Có", phonetic: "/jes/" },
            { front: "No", back: "Không", phonetic: "/noʊ/" },
            { front: "Maybe", back: "Có thể", phonetic: "/ˈmeɪbi/" },
            { front: "Good", back: "Tốt", phonetic: "/ɡʊd/" },
          ],
        },
        {
          title: "Demo Context Learning",
          description: "Bộ thẻ mẫu cho chế độ context learning",
          studyMode: 'context_learning',
          cards: [
            { front: "Water", back: "Nước", phonetic: "/ˈwɔːtər/" },
            { front: "Food", back: "Thức ăn", phonetic: "/fuːd/" },
            { front: "House", back: "Ngôi nhà", phonetic: "/haʊs/" },
          ],
        },
      ];

      for (const demo of demoSets) {
        const demoSet = await Set.create({
          ...demo,
          owner: userId,
          isPublic: false,
          category: 'vocabulary',
        });
        sets.push(demoSet);
      }
    }

    console.log(`Lấy danh sách sets cho user ${userId}, tổng ${sets.length} sets`);
    res.json({ sets });
  } catch (error) {
    console.error("Lỗi khi lấy sets:", error.message);
    next(error);
  }
};

export const getSetById = async (req, res, next) => {
  try {
    const set = await Set.findById(req.params.id).populate("owner", "name email avatar");
    if (!set) {
      console.log(`Không tìm thấy set với id=${req.params.id}`);
      return res.status(404).json({ message: "Set not found" });
    }
    console.log(`Lấy thông tin set id=${req.params.id}`);
    res.json({ set });
  } catch (error) {
    console.error("Lỗi khi lấy set theo id:", error.message);
    next(error);
  }
};

export const createSet = async (req, res, next) => {
  try {
    const { title, description, cards, tags, category, studyMode, isPublic } = req.body;
    if (!title) {
      console.log("Tạo set thất bại: thiếu tiêu đề");
      return res.status(400).json({ message: "Set title is required" });
    }

    const set = await Set.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      tags: Array.isArray(tags) ? tags : [],
      category: category || 'vocabulary',
      studyMode: studyMode || 'flashcard',
      isPublic: typeof isPublic === 'boolean' ? isPublic : true,
      cards: Array.isArray(cards) ? cards : [],
      owner: req.user.id,
    });

    console.log(`Tạo set mới thành công cho userId=${req.user.id}`);
    res.status(201).json({ set });
  } catch (error) {
    console.error("Lỗi khi tạo set:", error.message);
    next(error);
  }
};

export const updateSet = async (req, res, next) => {
  try {
    const set = await Set.findById(req.params.id);
    if (!set) {
      console.log(`Không tìm thấy set cần cập nhật id=${req.params.id}`);
      return res.status(404).json({ message: "Set not found" });
    }
    if (set.owner.toString() !== req.user.id.toString()) {
      console.log(`Người dùng không có quyền cập nhật set id=${req.params.id}`);
      return res.status(403).json({ message: "Forbidden" });
    }

    set.title = req.body.title ?? set.title;
    set.description = req.body.description ?? set.description;
    if (Array.isArray(req.body.tags)) {
      set.tags = req.body.tags;
    }
    if (req.body.category) {
      set.category = req.body.category;
    }
    if (req.body.studyMode) {
      set.studyMode = req.body.studyMode;
    }
    if (typeof req.body.isPublic === 'boolean') {
      set.isPublic = req.body.isPublic;
    }
    if (Array.isArray(req.body.cards)) {
      set.cards = req.body.cards;
    }
    await set.save();

    console.log(`Cập nhật set id=${req.params.id} thành công`);
    res.json({ set });
  } catch (error) {
    console.error("Lỗi khi cập nhật set:", error.message);
    next(error);
  }
};

export const deleteSet = async (req, res, next) => {
  try {
    const set = await Set.findById(req.params.id);
    if (!set) {
      console.log(`Không tìm thấy set cần xóa id=${req.params.id}`);
      return res.status(404).json({ message: "Set not found" });
    }
    if (set.owner.toString() !== req.user.id.toString()) {
      console.log(`Người dùng không có quyền xóa set id=${req.params.id}`);
      return res.status(403).json({ message: "Forbidden" });
    }

    await set.deleteOne();
    console.log(`Xóa set id=${req.params.id} thành công`);
    res.json({ message: "Set deleted" });
  } catch (error) {
    console.error("Lỗi khi xóa set:", error.message);
    next(error);
  }
};

export const duplicateSet = async (req, res, next) => {
  try {
    const original = await Set.findById(req.params.id);
    if (!original) {
      console.log(`Không tìm thấy set gốc để sao chép id=${req.params.id}`);
      return res.status(404).json({ message: "Set not found" });
    }

    const duplicated = await Set.create({
      title: `${original.title} (Copy)`,
      description: original.description,
      tags: original.tags,
      category: original.category,
      studyMode: original.studyMode,
      isPublic: original.isPublic,
      cards: original.cards,
      owner: req.user.id,
    });

    console.log(`Nhân bản set id=${req.params.id} thành công`);
    res.status(201).json({ set: duplicated });
  } catch (error) {
    console.error("Lỗi khi nhân bản set:", error.message);
    next(error);
  }
};

export const searchSets = async (req, res, next) => {
  try {
    const query = req.query.q || "";
    const regex = new RegExp(query, "i");
    const sets = await Set.find({
      $or: [
        { title: regex },
        { description: regex },
      ],
    }).populate("owner", "name email avatar");

    console.log(`Tìm kiếm set với từ khóa: ${query}`);
    res.json({ sets });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm set:", error.message);
    next(error);
  }
};

export const getSetsByUser = async (req, res, next) => {
  try {
    const sets = await Set.find({ owner: req.params.userId }).populate("owner", "name email avatar");
    console.log(`Lấy set của userId=${req.params.userId}`);
    res.json({ sets });
  } catch (error) {
    console.error("Lỗi khi lấy set theo user:", error.message);
    next(error);
  }
};

export const favoriteSet = async (req, res, next) => {
  try {
    const set = await Set.findById(req.params.id);
    if (!set) {
      console.log(`Không tìm thấy set để thêm yêu thích id=${req.params.id}`);
      return res.status(404).json({ message: "Set not found" });
    }

    const userId = req.user.id.toString();
    if (!set.favorites.map((id) => id.toString()).includes(userId)) {
      set.favorites.push(req.user.id);
      await set.save();
      console.log(`Đã thêm set id=${req.params.id} vào danh sách yêu thích của user=${userId}`);
    }

    res.json({ set });
  } catch (error) {
    console.error("Lỗi khi thêm set yêu thích:", error.message);
    next(error);
  }
};

export const unfavoriteSet = async (req, res, next) => {
  try {
    const set = await Set.findById(req.params.id);
    if (!set) {
      console.log(`Không tìm thấy set để bỏ yêu thích id=${req.params.id}`);
      return res.status(404).json({ message: "Set not found" });
    }

    set.favorites = set.favorites.filter((id) => id.toString() !== req.user.id.toString());
    await set.save();
    console.log(`Đã bỏ yêu thích set id=${req.params.id} cho user=${req.user.id}`);

    res.json({ set });
  } catch (error) {
    console.error("Lỗi khi bỏ yêu thích set:", error.message);
    next(error);
  }
};
