"use client";

import { Card } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./StudyModes.module.css";

const modes = [
  {
    title: "Flashcard",
    description: "Review terms with traditional flashcards",
    icon: "📄",
    path: "/study/flashcard",
  },
  {
    title: "Spaced Repetition",
    description: "Learn with intelligent spaced repetition",
    icon: "⏰",
    path: "/study/spaced-repetition",
  },
  {
    title: "Context-based learning",
    description: "Learn through examples and collocations",
    icon: "📚",
    path: "/study/context",
  },
  {
    title: "Vocabulary Manager",
    description: "Manage your vocabulary database",
    icon: "📝",
    path: "/vocabulary",
  },
  {
    title: "Study Statistics",
    description: "View your learning progress",
    icon: "📊",
    path: "/study/stats",
  },
];

interface StudyModesProps {
  setId?: string;
}

export default function StudyModes({ setId }: StudyModesProps) {
  const router = useRouter();

  const handleModeClick = (path: string) => {
    if (setId) {
      router.push(`${path}?setId=${setId}`);
    } else {
      router.push(path);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>How do you want to study?</h2>
      <p style={{ textAlign: "center", marginBottom: "1rem", color: "#666" }}>
        Mở trang{" "}
        <Link href="/demo-study">demo-study</Link> để thử nhanh Flashcard, Spaced repetition và Context learning với một bộ thẻ có sẵn.
      </p>
      <div className={styles.grid}>
        {modes.map((mode, index) => (
          <Card
            key={index}
            className={styles.card}
            hoverable
            onClick={() => handleModeClick(mode.path)}
          >
            <div className={styles.icon}>{mode.icon}</div>
            <h3 className={styles.cardTitle}>{mode.title}</h3>
            <p className={styles.description}>{mode.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}