"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input, Button, Form, Card, Space, Select, Switch, message, Spin, Alert } from "antd";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { PlusOutlined, SaveOutlined, DeleteOutlined } from "@ant-design/icons";
import { getSetById, updateSet, deleteSet } from "@/services/setService";
import { useAuth } from "@/hooks/AuthContext";

const { TextArea } = Input;
const { Option } = Select;

type StudyMode = "flashcard" | "spaced_repetition" | "context_learning" | "mixed";

interface DraftCard {
  id?: string;
  term: string;
  definition: string;
}

export default function EditSetPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setTitle, setSetTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("vocabulary");
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards] = useState<DraftCard[]>([{ term: "", definition: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const fetchSet = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getSetById(id as string);
      const rawSet = response.data?.set ?? response.data;
      const ownerId = rawSet?.userId ?? rawSet?.owner?._id ?? rawSet?.owner?.id;
      setIsOwner(user?.id === ownerId);
      setSetTitle(rawSet?.title ?? "");
      setDescription(rawSet?.description ?? "");
      setTags(Array.isArray(rawSet?.tags) ? rawSet.tags : []);
      setCategory(rawSet?.category ?? "vocabulary");
      setStudyMode(rawSet?.studyMode ?? "flashcard");
      setIsPublic(typeof rawSet?.isPublic === "boolean" ? rawSet.isPublic : true);
      setCards(
        Array.isArray(rawSet?.cards) && rawSet.cards.length > 0
          ? rawSet.cards.map((card: any) => ({
              id: card.id ?? card._id,
              term: card.front ?? "",
              definition: card.back ?? "",
            }))
          : [{ term: "", definition: "" }]
      );
    } catch (fetchError) {
      console.error("Không tải được set để sửa", fetchError);
      setError("Không thể tải thông tin set.");
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchSet();
  }, [fetchSet]);

  const canSubmit = useMemo(() => setTitle.trim().length > 0, [setTitle]);

  const addCard = () => {
    setCards([...cards, { term: "", definition: "" }]);
  };

  const updateCard = (index: number, field: "term" | "definition", value: string) => {
    const nextCards = [...cards];
    nextCards[index] = { ...nextCards[index], [field]: value };
    setCards(nextCards);
  };

  const handleSave = async () => {
    if (!canSubmit) {
      message.error("Tiêu đề là bắt buộc");
      return;
    }
    const normalizedCards = cards
      .map((c) => ({ front: c.term.trim(), back: c.definition.trim() }))
      .filter((c) => c.front || c.back);
    if (normalizedCards.length === 0) {
      message.error("Vui lòng thêm ít nhất 1 thẻ");
      return;
    }

    setSaving(true);
    try {
      await updateSet(id as string, {
        title: setTitle.trim(),
        description: description.trim(),
        tags,
        category,
        studyMode,
        isPublic,
        cards: normalizedCards,
      });
      message.success("Cập nhật bộ thẻ thành công");
      router.push(`/set/${id}`);
    } catch (updateError) {
      console.error("Cập nhật set thất bại", updateError);
      message.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteSet(id as string);
      message.success("Xóa bộ thẻ thành công");
      router.push("/");
    } catch (deleteError) {
      console.error("Xóa set thất bại", deleteError);
      message.error("Không thể xóa bộ thẻ. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Spin size="large" className="flex justify-center mt-10" />
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mt-10">
          <Alert title={error} type="error" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mt-4">
        <h1>Edit Set</h1>

        <Form layout="vertical">
          <Form.Item label="Title">
            <Input value={setTitle} onChange={(e) => setSetTitle(e.target.value)} />
          </Form.Item>

          <Form.Item label="Description (optional)">
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Form.Item>

          <Form.Item label="Tags">
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Add tags like IELTS, Business, Travel"
              value={tags}
              onChange={(value) => setTags(value as string[])}
            />
          </Form.Item>

          <Form.Item label="Category">
            <Select value={category} onChange={(value) => setCategory(value)}>
              <Option value="vocabulary">Vocabulary</Option>
              <Option value="grammar">Grammar</Option>
              <Option value="phrases">Phrases</Option>
              <Option value="mixed">Mixed</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Study mode">
            <Select value={studyMode} onChange={(value) => setStudyMode(value)}>
              <Option value="flashcard">Flashcard</Option>
              <Option value="spaced_repetition">Spaced Repetition</Option>
              <Option value="context_learning">Context Learning</Option>
              <Option value="mixed">Mixed (Flashcard + Spaced Repetition + Context Learning)</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Visibility">
            <Space>
              <Switch checked={isPublic} onChange={setIsPublic} />
              <span>{isPublic ? "Public" : "Private"}</span>
            </Space>
          </Form.Item>

          <h3>Terms in this set</h3>

          {cards.map((card, index) => (
            <Card key={index} size="small" className="mb-3">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input
                  placeholder="Term"
                  value={card.term}
                  onChange={(e) => updateCard(index, "term", e.target.value)}
                />
                <Input
                  placeholder="Definition"
                  value={card.definition}
                  onChange={(e) => updateCard(index, "definition", e.target.value)}
                />
              </Space>
            </Card>
          ))}

          <Button icon={<PlusOutlined />} onClick={addCard} className="mb-4">
            Add card
          </Button>

          <br />

          <Space wrap>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!canSubmit}>
              Save changes
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete} disabled={!isOwner || saving}>
              Delete set
            </Button>
          </Space>
        </Form>
      </div>
      <Footer />
    </>
  );
}
