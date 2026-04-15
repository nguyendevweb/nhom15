"use client";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useAuth } from "@/hooks/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, Statistic, Row, Col, Progress, Typography, Select, message, Empty, Tag } from "antd";
import { BookOutlined, CheckCircleOutlined, LineChartOutlined, RiseOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { getStudyStats } from "@/services/studyService";
import styles from "./dashboard.module.css";

const { Title } = Typography;

interface DailyActivityItem {
  date: string;
  cardsStudied: number;
}

interface DashboardStats {
  totalCardsStudied: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSessions: number;
  totalStudyTime: number;
  averageAccuracy: number;
  retentionRate: number;
  studyStreak: number;
  dailyActivity?: DailyActivityItem[];
}

const periodOptions = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDateLabel(value: string) {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
  } catch {
    return value;
  }
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("week");

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
      const response = await getStudyStats(period);
      const payload = response.data?.stats ?? response.data;
      setStats(payload);
    } catch (error) {
      console.error(error);
      message.error("Không tải được dashboard. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const activityData = useMemo(() => {
    if (!stats?.dailyActivity || stats.dailyActivity.length === 0) {
      return [];
    }

    return stats.dailyActivity.map((item) => ({
      ...item,
      label: formatDateLabel(item.date),
    }));
  }, [stats]);

  const maxActivity = useMemo(() => {
    if (!activityData.length) return 1;
    return Math.max(...activityData.map((item) => item.cardsStudied), 1);
  }, [activityData]);

  if (isLoading || loading) {
    return (
      <div className="flex-grow" style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <Title level={3}>Loading Dashboard...</Title>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.dashboardPage}>
      <Header />

      <div className={styles.dashboardHeader}>
        <div className={styles.dashboardIntro}>
          <Title level={2}>Dashboard</Title>
          <p>Thông tin học tập của bạn được cập nhật riêng cho mỗi tài khoản.</p>
        </div>

        <Select
          value={period}
          onChange={(value) => setPeriod(value)}
          options={periodOptions}
          style={{ minWidth: 180 }}
        />
      </div>

      {!stats ? (
        <Card>
          <div className={styles.noDataMessage}>
            <Empty description="Chưa có dữ liệu học tập" />
          </div>
        </Card>
      ) : (
        <>
          <div className={styles.summaryRow}>
            <Card>
              <Statistic
                title="Số từ đã học"
                value={stats.totalCardsStudied}
                prefix={<BookOutlined />}
              />
            </Card>
            <Card>
              <Statistic
                title="Streak"
                value={stats.studyStreak}
                suffix={stats.studyStreak > 1 ? "days" : "day"}
                prefix={<RiseOutlined />}
              />
            </Card>
            <Card>
              <Statistic
                title="Accuracy"
                value={stats.averageAccuracy}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: stats.averageAccuracy >= 80 ? "#3f8600" : stats.averageAccuracy >= 60 ? "#faad14" : "#cf1322" }}
              />
            </Card>
            <Card>
              <Statistic
                title="Retention Rate"
                value={stats.retentionRate}
                suffix="%"
                prefix={<LineChartOutlined />}
                valueStyle={{ color: stats.retentionRate >= 80 ? "#3f8600" : stats.retentionRate >= 60 ? "#faad14" : "#cf1322" }}
              />
            </Card>
          </div>

          <div className={styles.chartGrid}>
            <Card title="Daily Activity" className={styles.chartCard}>
              {activityData.length === 0 ? (
                <div className={styles.noDataMessage}>
                  <Empty description="Chưa có dữ liệu hoạt động hàng ngày" />
                </div>
              ) : (
                <div className={styles.activityChart}>
                  {activityData.map((item) => {
                    const percent = Math.round((item.cardsStudied / maxActivity) * 100);
                    return (
                      <div className={styles.activityBarItem} key={item.date}>
                        <div className={styles.barLabel}>
                          <span>{item.label}</span>
                          <span>{item.cardsStudied}</span>
                        </div>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title="Retention Summary" className={styles.chartCard}>
              <div className={styles.smallStatCard}>
                <div className={styles.smallStatCardItem}>
                  <span>Correct Answers</span>
                  <Tag color="success">{stats.totalCorrect}</Tag>
                </div>
                <div className={styles.smallStatCardItem}>
                  <span>Incorrect Answers</span>
                  <Tag color="error">{stats.totalIncorrect}</Tag>
                </div>
                <div className={styles.smallStatCardItem}>
                  <span>Total Sessions</span>
                  <Tag>{stats.totalSessions}</Tag>
                </div>
                <div className={styles.smallStatCardItem}>
                  <span>Average Session</span>
                  <Tag>{stats.totalSessions > 0 ? formatTime(Math.round(stats.totalStudyTime / stats.totalSessions)) : "0m"}</Tag>
                </div>
                <div className={styles.smallStatCardItem}>
                  <span>Overall Study Time</span>
                  <Tag>{formatTime(stats.totalStudyTime)}</Tag>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <p style={{ marginBottom: 12, fontWeight: 600 }}>Retention Rate</p>
                <Progress
                  percent={Math.min(100, Math.max(0, stats.retentionRate))}
                  status={stats.retentionRate >= 80 ? "success" : stats.retentionRate >= 60 ? "normal" : "exception"}
                />
                <p style={{ marginTop: 16, color: "#595959" }}>
                  Duy trì kiến thức bằng cách lặp lại các thẻ đã học và ôn tập đều đặn mỗi ngày.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
