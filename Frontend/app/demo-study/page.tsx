"use client";

import { useEffect, useState } from "react";
import { Card, Spin, Alert, Typography, Space, Button } from "antd";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/AuthContext";
import api from "@/services/api";

const { Title, Paragraph, Text } = Typography;

/**
 * Interface SetSummary - Thông tin tóm tắt của một bộ thẻ
 */
interface SetSummary {
  id: string;
  title: string; // Tên bộ thẻ
  cardCount: number; // Số lượng thẻ
  studyMode?: string; // Chế độ học (flashcard, spaced_repetition, context_learning)
}

/**
 * modeInfo - Danh sách 3 chế độ học demo
 * Chứa key, path route, label và mô tả cho mỗi chế độ
 */
const modeInfo = [
  {
    key: "flashcard",
    path: "/study/flashcard",
    label: "Flashcard",
    description: "Ôn tập mặt trước / mặt sau của thẻ để ghi nhớ nhanh.",
  },
  {
    key: "spaced_repetition",
    path: "/study/spaced-repetition",
    label: "Spaced Repetition",
    description: "Lặp lại ngắt quãng để tăng hiệu quả ghi nhớ lâu dài.",
  },
  {
    key: "context_learning",
    path: "/study/context",
    label: "Context-based Learning",
    description: "Học qua ví dụ, collocation và ngữ cảnh thực tế.",
  },
];

/**
 * DemoStudyPage - Trang giới thiệu các chế độ học demo
 * Hiển thị 3 card cho 3 chế độ học, người dùng có thể bắt đầu ôn tập
 */
export default function DemoStudyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [demoSets, setDemoSets] = useState<SetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra xác thực: nếu chưa đăng nhập thì chuyển hướng tới /login
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("[DEMO] ❌ Chưa đăng nhập, chuyển hướng tới trang login");
      router.push("/login");
    }
  }, [user, isLoading, router]);

  /**
   * Tải danh sách bộ thẻ demo từ backend
   * Lọc để chỉ lấy các bộ có tiêu đề chứa "Demo"
   */
  useEffect(() => {
    const load = async () => {
      try {
        console.log("[DEMO] 📇 Tải danh sách bộ thẻ từ backend");
        const res = await api.get("/set");
        const sets = res.data?.sets ?? res.data ?? [];
        const list = Array.isArray(sets) ? sets : [];
        
        // Xử lý dữ liệu từ backend: chuẩn hóa ID, đếm card, lọc Demo sets
        const withCards = list
          .map((s: { _id?: string; id?: string; title?: string; cards?: unknown[]; studyMode?: string }) => ({
            id: String(s.id ?? s._id ?? ""),
            title: s.title ?? "Untitled",
            studyMode: s.studyMode,
            cardCount: Array.isArray(s.cards) ? s.cards.length : 0,
          }))
          .filter((s: SetSummary) =>
            s.id &&
            s.cardCount > 0 &&
            /demo/i.test(s.title) // Chỉ lấy bộ có tiêu đề chứa "Demo"
          );

        console.log(`[DEMO] ✅ Tải thành công ${withCards.length} bộ thẻ demo`);
        setDemoSets(withCards);
      } catch (err) {
        console.error("[DEMO] ❌ Lỗi tải bộ thẻ:", err);
        setError("Không tải được danh sách bộ thẻ. Hãy chạy backend và đăng nhập.");
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  if (isLoading || loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
        <Alert type="error" message={error} showIcon />
      </div>
    );
  }

  const modeSets = modeInfo.map((mode) => {
    const candidate = demoSets.find((set) => {
      if (set.studyMode === mode.key) return true;
      const title = (set.title ?? "").toLowerCase();
      if (mode.key === "flashcard") return title.includes("flashcard");
      if (mode.key === "spaced_repetition") return title.includes("spaced");
      if (mode.key === "context_learning") return title.includes("context");
      return false;
    });
    return {
      ...mode,
      set: candidate || null,
    };
  });

  if (demoSets.length === 0) {
    return (
      <div style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
        <Alert
          type="warning"
          message="Chưa có bộ thẻ demo"
          description="Hệ thống sẽ tự động tạo bộ thẻ demo khi bạn truy cập. Nếu cần, hãy đăng nhập lại và tải lại trang."
          showIcon
        />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <Title level={2}>Thử nghiệm các chế độ học</Title>
      <Paragraph>Chọn một chế độ học demo và mở bộ thẻ tương ứng.</Paragraph>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {modeSets.map((mode) => (
          <Card
            key={mode.key}
            title={mode.label}
            extra={<Text type="secondary">{mode.set ? `${mode.set.cardCount} thẻ` : "Chưa có bộ"}</Text>}
          >
            <Paragraph>{mode.description}</Paragraph>
            <Button
              type="primary"
              disabled={!mode.set}
              onClick={() => {
                if (!mode.set) return;
                router.push(`${mode.path}?setId=${mode.set.id}`);
              }}
            >
              {mode.set ? "Bắt đầu" : "Đang tạo..."}
            </Button>
          </Card>
        ))}
      </Space>
    </div>
      <Footer />
    </>
  );
}
