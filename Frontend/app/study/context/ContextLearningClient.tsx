"use client";

import { useAuth } from "../../../hooks/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Typography, Space, message } from "antd";
import { SoundOutlined, BookOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface VocabularyWord {
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
}

interface SetCardRef {
  vocabularyId?: string;
  front?: string;
  back?: string;
  example?: string;
}

export default function ContextLearningClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setId = searchParams.get("setId");

  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (setId) {
      loadVocabularyFromSet();
    }
  }, [setId]);

  const loadVocabularyFromSet = async () => {
    setLoading(true);
    try {
      const setResponse = await fetch(`http://localhost:5000/api/set/${setId}`);
      if (!setResponse.ok) throw new Error("Failed to load set");

      const setData = await setResponse.json();
      const rawSet = setData?.set ?? setData;
      const cards: SetCardRef[] = Array.isArray(rawSet?.cards) ? rawSet.cards : [];

      const vocabIds = cards
        .map((card) => card.vocabularyId)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      if (vocabIds.length > 0) {
        const vocabPromises = vocabIds.map((id) =>
          fetch(`http://localhost:5000/api/vocabulary/${id}`)
        );

        const vocabResponses = await Promise.all(vocabPromises);
        const vocabData = await Promise.all(
          vocabResponses.map((r) => (r.ok ? r.json() : null))
        );

        setVocabulary(vocabData.filter(Boolean).map((d) => d.vocabulary));
      } else if (cards.length > 0) {
        const fallback: VocabularyWord[] = cards.map((card) => ({
          word: card.front || "—",
          phonetic: undefined,
          definitions: [
            {
              partOfSpeech: "note",
              meaning: card.back || "",
              example: card.example,
            },
          ],
          examples: card.example
            ? [{ sentence: card.example, translation: "" }]
            : [],
          collocations: [],
        }));
        setVocabulary(fallback);
      }
    } catch (error) {
      message.error("Tải từ vựng thất bại");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Phát âm từ vựng bằng Web Speech API (Text-to-Speech)
   * Sử dụng SpeechSynthesisUtterance để chuyển text thành giọng nói
   * @param word - Từ cần phát âm
   */
  const playAudio = (word: string) => {
    console.log(`[AUDIO] 🔊 Phát âm: "${word}"`);
    // Kiểm tra xem trình duyệt có hỗ trợ Web Speech API không
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        // Tạo utterance (đoạn văn bản để chuyển thành giọng nói)
        const utterance = new SpeechSynthesisUtterance(word);
        // Đặt ngôn ngữ là tiếng Anh Mỹ
        utterance.lang = "en-US";
        // Hủy bất kỳ phát âm nào đang chạy trước đó
        window.speechSynthesis.cancel();
        // Phát âm từ
        window.speechSynthesis.speak(utterance);
        console.log(`[AUDIO] ✅ Đang phát âm: "${word}"`);
        message.success(`Đang phát phát âm: ${word}`);
      } catch (error) {
        console.error("[AUDIO] ❌ Lỗi phát âm:", error);
        message.error("Lỗi khi phát âm. Vui lòng thử lại.");
      }
    } else {
      console.warn("[AUDIO] ⚠️ Trình duyệt không hỗ trợ Web Speech API");
      message.error("Trình duyệt của bạn không hỗ trợ phát âm thanh TTS.");
    }
  };

  const nextWord = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isLoading || loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (vocabulary.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <BookOutlined style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }} />
            <Title level={3}>Context-Based Learning</Title>
            <Paragraph>
              Learn vocabulary through real-world examples and common collocations.
              This method helps you understand how words are used in context.
            </Paragraph>
            {!setId && (
              <Button type="primary" onClick={() => router.push('/')}>
                Select a Set to Study
              </Button>
            )}
            {setId && (
              <Button style={{ marginTop: 12 }} onClick={() => router.push('/demo-study')}>
                Hướng dẫn thử 3 chế độ học
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const currentWord = vocabulary[currentIndex];

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Word {currentIndex + 1} of {vocabulary.length}</Text>
          <Space>
            <Button disabled={currentIndex === 0} onClick={prevWord}>
              Previous
            </Button>
            <Button disabled={currentIndex === vocabulary.length - 1} onClick={nextWord}>
              Next
            </Button>
          </Space>
        </div>
      </Card>

      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Title level={2} style={{ marginBottom: '0.5rem' }}>
            {currentWord.word}
            {currentWord.phonetic && (
              <Text style={{ fontSize: '16px', color: '#666', marginLeft: '1rem' }}>
                /{currentWord.phonetic}/
              </Text>
            )}
            <Button
              icon={<SoundOutlined />}
              style={{ marginLeft: '1rem' }}
              onClick={() => playAudio(currentWord.word)}
            />
          </Title>

          {currentWord.definitions.map((def, index) => (
            <div key={index} style={{ marginBottom: '1rem' }}>
              <Text strong>{def.partOfSpeech}: </Text>
              <Text>{def.meaning}</Text>
              {def.example && (
                <div style={{ marginTop: '0.5rem' }}>
                  <Text italic>&quot;{def.example}&quot;</Text>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {currentWord.examples && currentWord.examples.length > 0 && (
        <Card title="Context Examples" style={{ marginBottom: '1rem' }}>
          {currentWord.examples.map((example, index) => (
            <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <Paragraph style={{ fontSize: '16px', marginBottom: '0.5rem' }}>
                <strong>Example {index + 1}:</strong>
              </Paragraph>
              <Paragraph style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>
                {example.sentence}
              </Paragraph>
              <Paragraph style={{ color: '#666' }}>
                <strong>Translation:</strong> {example.translation}
              </Paragraph>
            </div>
          ))}
        </Card>
      )}

      {currentWord.collocations && currentWord.collocations.length > 0 && (
        <Card title="Common Collocations">
          {currentWord.collocations.map((collocation, index) => (
            <div key={index} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <Text strong style={{ fontSize: '16px' }}>{collocation.phrase}</Text>
                <Text style={{ marginLeft: '1rem', color: '#666' }}>{collocation.meaning}</Text>
              </div>
              {collocation.example && (
                <Paragraph style={{ fontStyle: 'italic', color: '#555' }}>
                  &quot;{collocation.example}&quot;
                </Paragraph>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
