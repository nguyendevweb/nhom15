"use client";

import { useRouter } from "next/navigation";
import { Button, message, Popconfirm } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/AuthContext";
import { deleteSet } from "@/services/setService";
import styles from "./SetCard.module.css";

interface Set {
  id?: string;
  _id?: string;
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
  const { user } = useAuth();
  const setId = set._id ?? set.id;
  const isOwner = user?.id === set.userId;

  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (setId) {
      router.push(`/set/${setId}/edit`);
    }
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!setId) return;
    try {
      await deleteSet(setId);
      message.success("Xóa bộ thẻ thành công");
      router.refresh();
    } catch (error) {
      console.error("Xóa bộ thẻ thất bại", error);
      message.error("Xóa bộ thẻ thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div
      className={styles.card}
      onClick={() => setId && router.push(`/set/${setId}`)}
    >
      <h3 className={styles.title}>{set.title}</h3>

      <p className={styles.count}>
        {set.cards?.length || 0} terms
      </p>

      <div className={styles.footer}>
        <span className={styles.user}>
          👤 {set.userName || "Anonymous"}
        </span>
        {isOwner && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <Button type="text" icon={<EditOutlined />} onClick={handleEdit} />
            <Popconfirm
              title="Bạn có chắc muốn xóa bộ thẻ này không?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={handleDelete}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        )}
      </div>
    </div>
  );
}