"use client";

import { useAuth } from "../../../hooks/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Statistic, Row, Col, Progress, Typography, Select, message } from "antd";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { BookOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

interface StudyStats {
  totalSessions: number;
  totalStudyTime: number;
  totalCardsStudied: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageAccuracy: number;
  retentionRate: number;
  studyStreak: number;
}

export default function StudyStatsPage() {
  const { user, isLoading, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/study/stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load statistics');

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      message.error('Tải thống kê học tập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading || loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Title level={2}>Study Statistics</Title>
        <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
          <Option value="week">This Week</Option>
          <Option value="month">This Month</Option>
          <Option value="year">This Year</Option>
        </Select>
      </div>

      {!stats ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <BookOutlined style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }} />
            <Title level={3}>No Study Data Yet</Title>
            <p>Start studying to see your progress statistics here!</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Thống kê tổng quan */}
          <Row gutter={[16, 16]} style={{ marginBottom: '2rem' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Study Sessions"
                  value={stats.totalSessions}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Study Time"
                  value={formatTime(stats.totalStudyTime)}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Cards Studied"
                  value={stats.totalCardsStudied}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Average Accuracy"
                  value={stats.averageAccuracy}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: stats.averageAccuracy >= 80 ? '#3f8600' : stats.averageAccuracy >= 60 ? '#faad14' : '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Retention Rate"
                  value={stats.retentionRate}
                  suffix="%"
                  prefix={<BookOutlined />}
                  valueStyle={{ color: stats.retentionRate >= 80 ? '#3f8600' : stats.retentionRate >= 60 ? '#faad14' : '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Thống kê chi tiết */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Performance Breakdown">
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Correct Answers</span>
                    <span style={{ color: '#52c41a' }}>{stats.totalCorrect}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Incorrect Answers</span>
                    <span style={{ color: '#ff4d4f' }}>{stats.totalIncorrect}</span>
                  </div>
                </div>
                <Progress
                  percent={stats.averageAccuracy}
                  status={stats.averageAccuracy >= 80 ? 'success' : stats.averageAccuracy >= 60 ? 'normal' : 'exception'}
                  strokeColor={stats.averageAccuracy >= 80 ? '#52c41a' : stats.averageAccuracy >= 60 ? '#faad14' : '#ff4d4f'}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Study Habits">
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>Average Session Duration:</strong> {stats.totalSessions > 0 ? formatTime(stats.totalStudyTime / stats.totalSessions) : '0m'}</p>
                  <p><strong>Cards per Session:</strong> {stats.totalSessions > 0 ? Math.round(stats.totalCardsStudied / stats.totalSessions) : 0}</p>
                  <p><strong>Study Streak:</strong> {stats.studyStreak} day{stats.studyStreak === 1 ? '' : 's'}</p>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <Title level={4}>Tips for Better Learning</Title>
                  <ul style={{ paddingLeft: '1.5rem' }}>
                    <li>Study regularly using spaced repetition</li>
                    <li>Focus on understanding context and examples</li>
                    <li>Review difficult words more frequently</li>
                    <li>Use the vocabulary in real conversations</li>
                  </ul>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Phần thành tích */}
          <Card style={{ marginTop: '2rem' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '1rem' }}>
              🎯 Your Achievements
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  {stats.totalSessions >= 10 ? '🏆' : '📚'}
                  <br />
                  <strong>{stats.totalSessions >= 10 ? 'Study Champion' : 'Getting Started'}</strong>
                  <br />
                  <small>{stats.totalSessions >= 10 ? 'Completed 10+ sessions' : `${10 - stats.totalSessions} more sessions to go`}</small>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  {stats.averageAccuracy >= 85 ? '🎯' : '🎯'}
                  <br />
                  <strong>{stats.averageAccuracy >= 85 ? 'Accuracy Master' : 'Sharpshooter'}</strong>
                  <br />
                  <small>{stats.averageAccuracy >= 85 ? '85%+ accuracy' : `Current: ${stats.averageAccuracy}%`}</small>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  {stats.totalCardsStudied >= 100 ? '🚀' : '📈'}
                  <br />
                  <strong>{stats.totalCardsStudied >= 100 ? 'Vocabulary Builder' : 'Growing Knowledge'}</strong>
                  <br />
                  <small>{stats.totalCardsStudied >= 100 ? '100+ cards studied' : `${100 - stats.totalCardsStudied} more cards to go`}</small>
                </Card>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
      <Footer />
    </>
  );
}