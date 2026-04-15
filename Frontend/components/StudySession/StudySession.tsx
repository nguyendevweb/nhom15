"use client";

import { useState, useEffect } from "react";
import { Card, Button, Progress, message, Space } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, SoundOutlined } from "@ant-design/icons";
import Flashcard from "../Flashcard/Flashcard";
import { useAuth } from "../../hooks/AuthContext";

interface StudyItem {
  _id: string;
  vocabularyId?: {
    word: string;
    phonetic?: string;
    definitions: Array<{
      partOfSpeech: string;
      meaning: string;
      example?: string;
    }>;
    examples: Array<{
      sentence: string;
      translation: string;
    }>;
    collocations: Array<{
      phrase: string;
      meaning: string;
      example: string;
    }>;
  };
  cardId?: {
    front: string;
    back: string;
    phonetic?: string;
    example?: string;
  };
  nextReviewDate: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

interface StudySessionProps {
  sessionId: string;
  onComplete?: () => void;
}

export default function StudySession({ sessionId, onComplete }: StudySessionProps) {
  const { token } = useAuth();
  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
  });

  useEffect(() => {
    loadDueCards();
  }, [sessionId, token]);

  const loadDueCards = async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ sessionId, limit: '100' });
      const response = await fetch(`http://localhost:5000/api/study/due?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load due cards');

      const data = await response.json();
      setStudyItems(data.cards);
      setSessionStats(prev => ({ ...prev, total: data.cards.length }));
    } catch (error) {
      message.error('Tải thẻ học thất bại');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (itemId: string, quality: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/study/${sessionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, quality }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      // Cập nhật số liệu buổi học
      setSessionStats(prev => ({
        ...prev,
        completed: prev.completed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
        incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
      }));

      // Chuyển sang thẻ tiếp theo
      if (currentIndex < studyItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Buổi học đã hoàn thành
        message.success('Buổi học đã hoàn thành!');
        onComplete?.();
      }
    } catch (error) {
      message.error('Gửi câu trả lời thất bại');
    }
  };

  const playAudio = (audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  if (loading) {
    return <div>Loading study cards...</div>;
  }

  if (studyItems.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>No cards due for review!</h3>
          <p>You&apos;ve completed all your scheduled reviews for today.</p>
          <Button type="primary" onClick={onComplete}>Back to Dashboard</Button>
        </div>
      </Card>
    );
  }

  const currentItem = studyItems[currentIndex];
  const progress = ((currentIndex + 1) / studyItems.length) * 100;

  // Chuẩn bị nội dung thẻ
  let frontContent = '';
  let backContent = '';

  const vocab = currentItem.vocabularyId;
  const hasVocabContent =
    vocab && typeof vocab === 'object' && 'word' in vocab && Array.isArray(vocab.definitions);

  if (hasVocabContent) {
    frontContent = vocab.word;
    backContent = vocab.definitions.map(def =>
      `${def.partOfSpeech}: ${def.meaning}${def.example ? `\nExample: ${def.example}` : ''}`
    ).join('\n\n');

    if (vocab.phonetic) {
      frontContent += `\n/${vocab.phonetic}/`;
    }
  } else if (currentItem.cardId) {
    // Thẻ truyền thống
    frontContent = currentItem.cardId.front;
    backContent = currentItem.cardId.back;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      {/* Tiến độ */}
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span>Progress: {currentIndex + 1} / {studyItems.length}</span>
          <span>Correct: {sessionStats.correct} | Incorrect: {sessionStats.incorrect}</span>
        </div>
        <Progress percent={progress} showInfo={false} />
      </Card>

      {/* Thẻ học */}
      <Flashcard
        front={frontContent}
        back={backContent}
        showControls={false}
      />

      {/* Nút trả lời */}
      <Card style={{ marginTop: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
            How well did you know this?
          </p>
          <Space size="middle">
            <Button
              danger
              icon={<CloseCircleOutlined />}
              size="large"
              onClick={() => submitAnswer(currentItem._id, 1)}
            >
              Again (1)
            </Button>
            <Button
              icon={<CloseCircleOutlined />}
              size="large"
              onClick={() => submitAnswer(currentItem._id, 2)}
            >
              Hard (2)
            </Button>
            <Button
              icon={<CheckCircleOutlined />}
              size="large"
              onClick={() => submitAnswer(currentItem._id, 3)}
            >
              Good (3)
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              size="large"
              onClick={() => submitAnswer(currentItem._id, 4)}
            >
              Easy (4)
            </Button>
          </Space>
          <p style={{ marginTop: '1rem', fontSize: '12px', color: '#666' }}>
            1=Complete blackout, 2=Incorrect but easy to recall, 3=Correct with effort, 4=Perfect response
          </p>
        </div>
      </Card>

      {/* Phần học ngữ cảnh */}
      {currentItem.vocabularyId?.examples && currentItem.vocabularyId.examples.length > 0 && (
        <Card style={{ marginTop: '1rem' }} title="Context Examples">
          {currentItem.vocabularyId.examples.slice(0, 2).map((example, index) => (
            <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <p style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>{example.sentence}</p>
              <p style={{ color: '#666', fontSize: '14px' }}>{example.translation}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Cụm từ thường gặp */}
      {currentItem.vocabularyId?.collocations && currentItem.vocabularyId.collocations.length > 0 && (
        <Card style={{ marginTop: '1rem' }} title="Common Collocations">
          {currentItem.vocabularyId.collocations.slice(0, 3).map((collocation, index) => (
            <div key={index} style={{ marginBottom: '0.5rem' }}>
              <strong>{collocation.phrase}</strong>: {collocation.meaning}
              {collocation.example && (
                <p style={{ fontStyle: 'italic', color: '#666', marginTop: '0.25rem' }}>
                  {collocation.example}
                </p>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}