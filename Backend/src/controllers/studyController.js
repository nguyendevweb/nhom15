import StudySession from "../models/StudySession.js";
import Set from "../models/Set.js";
import Vocabulary from "../models/Vocabulary.js";

/**
 * Controller xử lý phiên học của người dùng
 * Bao gồm: khởi tạo phiên học, lấy card cần ôn, ghi nhận đáp án,
 * tính toán SM-2 spaced repetition, và lấy thống kê học tập
 */

/**
 * SM-2 Spaced Repetition Algorithm
 * Thuật toán được phát triển bởi Piotr Wozniak
 * Tính toán khoảng thời gian ôn tập tiếp theo dựa trên hiệu suất
 *
 * @param {Object} item - đối tượng thẻ hiện tại với easeFactor, interval, repetitions
 * @param {number} quality - điểm đánh giá từ 0-5:
 *   0 = quên hoàn toàn, 1-2 = sai, 3-4 = đúng với khó khăn, 5 = hoàn hảo
 * @returns {Object} đối tượng chứa easeFactor, interval, repetitions, nextReviewDate mới
 */
const calculateNextReview = (item, quality) => {
  let { easeFactor, interval, repetitions } = item;

  if (quality >= 3) {
    // Câu trả lời đúng: tăng interval
    if (repetitions === 0) {
      interval = 1; // Lần 1: ôn tập sau 1 ngày
    } else if (repetitions === 1) {
      interval = 6; // Lần 2: ôn tập sau 6 ngày
    } else {
      // Lần 3+: nhân thêm với easeFactor
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Câu trả lời sai: reset về lần 1
    repetitions = 0;
    interval = 1;
  }

  // Điều chỉnh easeFactor dựa trên công thức SM-2
  // EF' = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor); // easeFactor tối thiểu là 1.3

  // Tính ngày ôn tập tiếp theo
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  console.log(`[SM-2] Cập nhật: quality=${quality}, repetitions=${repetitions}, interval=${interval} ngày, EF=${easeFactor.toFixed(2)}`);
  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
};

/**
 * Tạo phiên học mới
 * Khởi tạo danh sách card từ bộ thẻ đã chọn
 */
export const createStudySession = async (req, res, next) => {
  try {
    const { setId, sessionType = 'flashcard' } = req.body;
    const userId = req.user.id;

    console.log(`[STUDY] 🎓 Khởi tạo study session cho userId=${userId}, sessionType=${sessionType}, setId=${setId}`);
    let studyItems = [];

    if (setId) {
      const set = await Set.findById(setId);
      if (!set) {
        console.log(`[STUDY] ❌ Không tìm thấy set để tạo session: ${setId}`);
        return res.status(404).json({ message: "Set not found" });
      }

      // Xóa phiên học chưa hoàn thành cũ để tránh trùng lặp
      const deletedCount = await StudySession.deleteMany({
        userId,
        setId,
        isCompleted: false,
      }).then(result => result.deletedCount);
      
      if (deletedCount > 0) {
        console.log(`[STUDY] 🧹 Đã xóa ${deletedCount} phiên học chưa hoàn thành`);
      }

      // Tạo studyItems từ tất cả card trong set
      studyItems = set.cards.map((card) => {
        const item = {
          cardId: card._id,
          nextReviewDate: new Date(), // Card mới cần ôn tập ngay
        };
        if (card.vocabularyId) {
          item.vocabularyId = card.vocabularyId;
        }
        return item;
      });
      console.log(`[STUDY] 📇 Tạo ${studyItems.length} study items từ card`);
    }

    const session = await StudySession.create({
      userId,
      setId,
      sessionType,
      studyItems,
      totalItems: studyItems.length,
    });

    console.log(`[STUDY] ✅ Tạo study session thành công id=${session._id}`);
    res.status(201).json({ session });
  } catch (error) {
    console.error("[STUDY] ❌ Lỗi khi tạo study session:", error.message);
    next(error);
  }
};

// Get study session
export const getStudySession = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Lấy study session id=${id} cho user=${req.user.id}`);
    const session = await StudySession.findById(id)
      .populate('studyItems.vocabularyId')
      .populate('setId', 'title description');

    if (!session) {
      console.log(`Study session không tồn tại id=${id}`);
      return res.status(404).json({ message: "Study session not found" });
    }

    if (session.userId.toString() !== req.user.id) {
      console.log(`Truy cập bị từ chối cho user=${req.user.id} vào session ${id}`);
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ session });
  } catch (error) {
    console.error("Lỗi khi lấy study session:", error.message);
    next(error);
  }
};

// Get user's active study sessions
export const getUserStudySessions = async (req, res, next) => {
  try {
    const { status = 'active', sessionType } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (status === 'active') {
      query.isCompleted = false;
    } else if (status === 'completed') {
      query.isCompleted = true;
    }

    if (sessionType) {
      query.sessionType = sessionType;
    }

    console.log(`Lấy danh sách study sessions cho user=${userId} status=${status} type=${sessionType || 'all'}`);
    const sessions = await StudySession.find(query)
      .populate('setId', 'title description')
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách study sessions:", error.message);
    next(error);
  }
};

const enrichStudyItemForClient = (item, session, setDoc) => {
  const plain = item.toObject ? item.toObject() : { ...item };
  const vocabIdRaw = plain.vocabularyId;
  const vocabIdStr = vocabIdRaw?._id
    ? vocabIdRaw._id.toString()
    : vocabIdRaw?.toString?.();

  let vocabularyId = plain.vocabularyId;
  let cardId = plain.cardId;

  const cardLooksLikeContent =
    cardId && typeof cardId === 'object' && typeof cardId.front === 'string';
  if (
    setDoc &&
    cardId &&
    !cardLooksLikeContent &&
    (!vocabIdStr || (typeof vocabularyId !== 'object' || !vocabularyId.word))
  ) {
    const sub = setDoc.cards.id(cardId);
    if (sub) {
      cardId = {
        front: sub.front,
        back: sub.back,
        phonetic: sub.phonetic,
        example: sub.example,
      };
    }
  }

  return {
    ...plain,
    vocabularyId,
    cardId,
    sessionId: session._id,
  };
};

// Get cards due for review (spaced repetition)
export const getDueCards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, sessionId } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 200);
    const now = new Date();

    console.log(`Lấy danh sách card đến hạn cho user=${userId} sessionId=${sessionId || 'all'} limit=${limitNum}`);

    if (sessionId) {
      const session = await StudySession.findOne({
        _id: sessionId,
        userId,
        isCompleted: false,
      });

      if (!session) {
        console.log(`Không tìm thấy session đang hoạt động id=${sessionId}`);
        return res.json({ cards: [] });
      }

      const setDoc = session.setId ? await Set.findById(session.setId) : null;

      const dueItems = session.studyItems
        .filter((item) => item.nextReviewDate <= now)
        .slice(0, limitNum);

      const vocabularyIds = dueItems
        .map((item) => item.vocabularyId)
        .filter(Boolean);

      const vocabularyDocs = vocabularyIds.length
        ? await Vocabulary.find({ _id: { $in: vocabularyIds } })
        : [];
      const vocabById = new Map(
        vocabularyDocs.map((v) => [v._id.toString(), v])
      );

      const cards = dueItems.map((item) => {
        const base = enrichStudyItemForClient(item, session, setDoc);
        const vid = item.vocabularyId?.toString?.();
        if (vid && vocabById.has(vid)) {
          base.vocabularyId = vocabById.get(vid);
        }
        return base;
      });

      console.log(`Trả về ${cards.length} card đến hạn cho session id=${sessionId}`);
      return res.json({ cards });
    }

    const sessions = await StudySession.find({
      userId,
      isCompleted: false,
    });

    let dueCards = [];

    for (const session of sessions) {
      const setDoc = session.setId ? await Set.findById(session.setId) : null;

      const sessionDueCards = session.studyItems
        .filter((item) => item.nextReviewDate <= now)
        .slice(0, limitNum - dueCards.length);

      dueCards.push(
        ...sessionDueCards.map((item) => enrichStudyItemForClient(item, session, setDoc))
      );

      if (dueCards.length >= limitNum) break;
    }

    const vocabularyIds = dueCards
      .map((card) => card.vocabularyId)
      .filter(Boolean)
      .map((id) => (id?._id ? id._id : id));

    const vocabularyDocs = vocabularyIds.length
      ? await Vocabulary.find({ _id: { $in: vocabularyIds } })
      : [];
    const vocabById = new Map(
      vocabularyDocs.map((v) => [v._id.toString(), v])
    );

    const cardsWithData = dueCards.map((card) => {
      const vid = card.vocabularyId?._id
        ? card.vocabularyId._id.toString()
        : card.vocabularyId?.toString?.();
      if (vid && vocabById.has(vid)) {
        return { ...card, vocabularyId: vocabById.get(vid) };
      }
      return card;
    });

    console.log(`Trả về tổng cộng ${cardsWithData.length} card đến hạn cho user=${userId}`);
    res.json({ cards: cardsWithData });
  } catch (error) {
    console.error("Lỗi khi lấy card đến hạn:", error.message);
    next(error);
  }
};

// Submit answer for spaced repetition
export const submitAnswer = async (req, res, next) => {
  try {
    const sessionId = req.params.id || req.body.sessionId;
    const { itemId, quality } = req.body;
    const userId = req.user.id;

    console.log(`Gửi đáp án cho user=${userId}, sessionId=${sessionId}, itemId=${itemId}, quality=${quality}`);
    const session = await StudySession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      console.log(`Không tìm thấy study session id=${sessionId}`);
      return res.status(404).json({ message: "Study session not found" });
    }

    const studyItem = session.studyItems.id(itemId);
    if (!studyItem) {
      console.log(`Không tìm thấy study item id=${itemId} trong session ${sessionId}`);
      return res.status(404).json({ message: "Study item not found" });
    }

    // Update performance tracking
    if (quality >= 3) {
      studyItem.correctCount += 1;
      studyItem.streak += 1;
      session.correctAnswers += 1;
    } else {
      studyItem.incorrectCount += 1;
      studyItem.streak = 0;
      session.incorrectAnswers += 1;
    }

    // Calculate next review using SM-2 algorithm
    const { easeFactor, interval, repetitions, nextReviewDate } = calculateNextReview(studyItem, quality);

    studyItem.easeFactor = easeFactor;
    studyItem.interval = interval;
    studyItem.repetitions = repetitions;
    studyItem.nextReviewDate = nextReviewDate;
    studyItem.lastReviewed = new Date();

    session.completedItems += 1;

    // Check if session is completed
    if (session.completedItems >= session.totalItems) {
      session.isCompleted = true;
      session.endTime = new Date();
      session.sessionDuration = Math.floor((session.endTime - session.startTime) / 1000);
      console.log(`Session id=${sessionId} đã hoàn thành sau ${session.sessionDuration} giây`);
    }

    await session.save();

    console.log(`Cập nhật kết quả review cho itemId=${itemId}: interval=${interval}, easeFactor=${easeFactor}`);
    res.json({
      success: true,
      nextReviewDate,
      interval,
      easeFactor,
      repetitions,
    });
  } catch (error) {
    console.error("Lỗi khi submit answer:", error.message);
    next(error);
  }
};

// Complete study session
export const completeStudySession = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Hoàn thành study session id=${id} cho user=${req.user.id}`);
    const session = await StudySession.findOne({ _id: id, userId: req.user.id });
    if (!session) {
      console.log(`Không tìm thấy session id=${id} khi hoàn thành`);
      return res.status(404).json({ message: "Study session not found" });
    }

    session.isCompleted = true;
    session.endTime = new Date();
    session.sessionDuration = Math.floor((session.endTime - session.startTime) / 1000);
    await session.save();

    res.json({ session });
  } catch (error) {
    console.error("Lỗi khi hoàn thành study session:", error.message);
    next(error);
  }
};

// Get study statistics
export const getStudyStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = 'week' } = req.query;

    console.log(`Lấy thống kê học tập cho user=${userId} với khoảng thời gian=${period}`);
    let dateFilter = new Date();
    if (period === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === 'year') {
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    const sessions = await StudySession.find({
      userId,
      createdAt: { $gte: dateFilter },
    });

    const totalStudyTime = sessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0);
    const totalCardsStudied = sessions.reduce((sum, s) => sum + s.completedItems, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalIncorrect = sessions.reduce((sum, s) => sum + s.incorrectAnswers, 0);

    const formatDay = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const studiedDays = sessions
      .filter(s => s.isCompleted)
      .map((s) => formatDay(s.createdAt));

    let studyStreak = 0;
    const today = new Date();
    while (true) {
      const dayString = formatDay(today);
      if (!studiedDays.includes(dayString)) break;
      studyStreak += 1;
      today.setDate(today.getDate() - 1);
    }

    const averageAccuracy = totalCardsStudied > 0 ? Math.round((totalCorrect / totalCardsStudied) * 100) : 0;
    const retentionRate = totalCardsStudied > 0 ? Math.round((totalCorrect / totalCardsStudied) * 100) : 0;

    const stats = {
      totalSessions: sessions.length,
      totalStudyTime,
      totalCardsStudied,
      totalCorrect,
      totalIncorrect,
      averageAccuracy,
      retentionRate,
      studyStreak,
    };

    console.log(`Thống kê trả về: ${JSON.stringify(stats)}`);
    res.json({ stats });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê học tập:", error.message);
    next(error);
  }
};