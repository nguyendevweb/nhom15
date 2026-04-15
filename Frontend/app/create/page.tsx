"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Form, Card, Space, Select, Switch, message } from "antd";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { createSet } from "@/services/setService";
import { useAuth } from "@/hooks/AuthContext";

const { TextArea } = Input;
const { Option } = Select;

type StudyMode = "flashcard" | "spaced_repetition" | "context_learning" | "mixed";

interface DraftCard {
  term: string;
  definition: string;
}

export default function Create() {
  const { user, isLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("vocabulary");
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards] = useState<DraftCard[]>([{ term: "", definition: "" }]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  const addCard = () => {
    setCards([...cards, { term: "", definition: "" }]);
  };

  const updateCard = (index: number, field: string, value: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const save = async () => {
    try {
      if (!title.trim()) {
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
      const res = await createSet({
        title: title.trim(),
        description: description.trim(),
        tags,
        category,
        studyMode,
        isPublic,
        cards: normalizedCards,
      });

      const createdSet = res.data?.set ?? res.data;
      const newSetId = createdSet?.id || createdSet?._id;
      if (typeof window !== "undefined" && createdSet && newSetId) {
        localStorage.setItem(
          "lastCreatedSet",
          JSON.stringify({ ...createdSet, _id: newSetId })
        );
      }

      message.success("Tạo bộ thẻ thành công");
      router.push("/");
    } catch (error) {
      console.error("Không lưu được bộ thẻ", error);
      message.error("Tạo bộ thẻ thất bại. Vui lòng đăng nhập và thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mt-4">
      <h1>Create a new study set</h1>

      <Form layout="vertical">
        <Form.Item label="Title">
          <Input
            placeholder="Enter a title, like 'Biology - Chapter 10'"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form.Item>

        <Form.Item label="Description (optional)">
          <TextArea
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </Form.Item>

        <Form.Item label="Tags">
          <Select
            mode="tags"
            style={{ width: '100%' }}
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

        {cards.map((card, i) => (
          <Card key={i} size="small" className="mb-3">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Input
                placeholder="Term"
                value={card.term}
                onChange={(e) => updateCard(i, "term", e.target.value)}
              />
              <Input
                placeholder="Definition"
                value={card.definition}
                onChange={(e) => updateCard(i, "definition", e.target.value)}
              />
            </Space>
          </Card>
        ))}

        <Button icon={<PlusOutlined />} onClick={addCard} className="mb-4">
          Add card
        </Button>

        <br />

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          size="large"
          loading={saving}
          disabled={!canSubmit}
        >
          Create set
        </Button>
      </Form>
    </div>
      <Footer />
    </>
  );
}