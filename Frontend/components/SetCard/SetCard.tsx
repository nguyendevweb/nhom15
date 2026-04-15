"use client";

import { useRouter } from "next/navigation";
import styles from "./SetCard.module.css";

interface Set {
  _id: string;
  title: string;
  description?: string;
  cards: { front: string; back: string }[];
  userId: string;
  userName: string;
}

interface SetCardProps {
  set: Set;
}

export default function SetCard({ set }: SetCardProps) {
  const router = useRouter();

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/set/${set._id}`)}
    >
      <h3 className={styles.title}>{set.title}</h3>

      <p className={styles.count}>
        {set.cards?.length || 0} terms
      </p>

      <div className={styles.footer}>
        <span className={styles.user}>
          👤 {set.userName || "Anonymous"}
        </span>
      </div>
    </div>
  );
}