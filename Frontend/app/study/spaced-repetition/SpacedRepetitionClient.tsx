"use client";

import { useAuth } from "../../../hooks/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, message } from "antd";
import StudySession from "../../../components/StudySession/StudySession";

export default function SpacedRepetitionClient() {
  const { user, isLoading, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setId = searchParams.get('setId');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const startStudySession = async () => {
    if (!setId) {
      message.error('Chưa chọn bộ thẻ');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          setId,
          sessionType: 'spaced_repetition',
        }),
      });

      if (!response.ok) throw new Error('Failed to create study session');

      const data = await response.json();
      const sid = data.session?.id ?? data.session?._id;
      if (sid) setSessionId(String(sid));
    } catch (error) {
      message.error('Khởi động buổi học thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = () => {
    setSessionId(null);
    message.success('Buổi học đã hoàn thành!');
    router.push('/');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (sessionId) {
    return (
      <StudySession
        sessionId={sessionId}
        onComplete={handleSessionComplete}
      />
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Spaced Repetition Study</h2>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            Review cards using intelligent spaced repetition to optimize your learning.
            Cards will be shown based on when you last reviewed them and how well you knew them.
          </p>

          {!setId && (
            <p style={{ marginBottom: '1rem', color: '#c00' }}>
              Chọn một bộ thẻ từ trang chủ (ô Study modes có gắn setId) hoặc mở trang <strong>/demo-study</strong> để thử nhanh.
            </p>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <h3>How it works:</h3>
            <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
              <li>New cards are shown immediately</li>
              <li>Correct answers increase the interval between reviews</li>
              <li>Incorrect answers decrease the interval</li>
              <li>The algorithm adapts to your learning pace</li>
            </ul>
          </div>

          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={startStudySession}
            disabled={!setId}
          >
            Start Spaced Repetition
          </Button>
        </div>
      </Card>
    </div>
  );
}
