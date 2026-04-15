"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Card, Input, Button, Modal, Form, Select, Tag, message, Space, Typography, Spin, Empty } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined, DownloadOutlined, SoundOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/AuthContext";
import { getSetById, getSetsByUser, updateSet } from "../../services/setService";

const { Title } = Typography;
const { Option } = Select;

interface VocabularyWord {
  id: string;
  _id?: string;
  word: string;
  phonetic?: string;
  definitions: Array<{
    partOfSpeech: string;
    meaning: string;
    example?: string;
  }>;
  synonyms: string[];
  antonyms: string[];
  examples: Array<{
    sentence: string;
    translation: string;
  }>;
  collocations: Array<{
    phrase: string;
    meaning: string;
    example: string;
  }>;
  difficulty: string;
  tags: string[];
  audioUrl?: string;
  createdBy?: {
    id?: string;
    _id?: string;
    name?: string;
  };
}

interface VocabularyFormValues {
  word: string;
  phonetic?: string;
  definitions: VocabularyWord["definitions"];
  synonyms: string[];
  antonyms: string[];
  examples: VocabularyWord["examples"];
  collocations: VocabularyWord["collocations"];
  difficulty: string;
  tags: string[];
}

export default function VocabularyManager() {
  const { token, user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [addToSetModalVisible, setAddToSetModalVisible] = useState(false);
  const [availableSets, setAvailableSets] = useState<Array<{ id: string; title: string; owner?: { id?: string; _id?: string } }>>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [addingWord, setAddingWord] = useState<VocabularyWord | null>(null);
  const [setActionLoading, setSetActionLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadVocabulary();
  }, []);

  useEffect(() => {
    loadVocabulary();
  }, [searchQuery, selectedDifficulty]);

  const loadVocabulary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('isPublic', 'true');
      if (searchQuery) params.append('search', searchQuery);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

      const response = await fetch(`http://localhost:5000/api/vocabulary?${params}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to load vocabulary');

      const data = await response.json();
      console.log('Từ vựng đã tải:', data);
      setVocabulary(data.vocabulary || []);
    } catch (error) {
      console.error('Lỗi tải từ vựng:', error);
      message.error('Tải từ vựng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = () => {
    setEditingWord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditWord = (word: VocabularyWord) => {
    setEditingWord(word);
    form.setFieldsValue({
      word: word.word,
      phonetic: word.phonetic,
      definitions: word.definitions,
      synonyms: word.synonyms,
      antonyms: word.antonyms,
      examples: word.examples,
      collocations: word.collocations,
      difficulty: word.difficulty,
      tags: word.tags,
    });
    setIsModalVisible(true);
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!token) {
      message.error('Bạn cần đăng nhập để xóa từ');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/vocabulary/${wordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete word');
      }

      message.success('Xóa từ thành công');
      loadVocabulary();
    } catch (error) {
      console.error('Lỗi xóa từ:', error);
      message.error(error instanceof Error ? error.message : 'Xóa từ thất bại');
    }
  };

  const handleSaveWord = async (values: VocabularyFormValues) => {
    if (!token) {
      message.error('Bạn cần đăng nhập để lưu từ');
      return;
    }

    try {
      const method = editingWord ? 'PUT' : 'POST';
      const url = editingWord
        ? `http://localhost:5000/api/vocabulary/${editingWord.id}`
        : 'http://localhost:5000/api/vocabulary';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save word');
      }

      message.success(`${editingWord ? 'Cập nhật từ thành công' : 'Thêm từ thành công'}`);
      setIsModalVisible(false);
      loadVocabulary();
    } catch (error) {
      console.error('Lỗi lưu từ:', error);
      message.error(error instanceof Error ? error.message : 'Lưu từ thất bại');
    }
  };

  const canModify = (word: VocabularyWord) => {
    if (!user) return false;
    return user.id === word.createdBy?.id || user.id === word.createdBy?._id;
  };

  const fetchUserSets = async () => {
    if (!user?.id) return;
    try {
      const response = await getSetsByUser(user.id);
      const sets = response.data?.sets || response.data || [];
      setAvailableSets(Array.isArray(sets) ? sets : []);
    } catch (error) {
      console.error('Lỗi tải danh sách set:', error);
      message.error('Không thể tải bộ học của bạn');
    }
  };

  const handleAddToSetClick = async (word: VocabularyWord) => {
    if (!user?.id) {
      message.error('Bạn cần đăng nhập để thêm vào bộ học');
      return;
    }
    setAddingWord(word);
    setSelectedSetId(null);
    setAddToSetModalVisible(true);
    await fetchUserSets();
  };

  const handleConfirmAddToSet = async () => {
    if (!selectedSetId || !addingWord) {
      message.error('Vui lòng chọn bộ học');
      return;
    }

    setSetActionLoading(true);
    try {
      const response = await getSetById(selectedSetId);
      const setData = response.data?.set || response.data;
      const existingCards = Array.isArray(setData.cards) ? setData.cards : [];
      const newCard = {
        front: addingWord.word,
        back: addingWord.definitions?.[0]?.meaning || '',
        phonetic: addingWord.phonetic || undefined,
        example: addingWord.definitions?.[0]?.example || undefined,
        audioUrl: addingWord.audioUrl || undefined,
      };

      await updateSet(selectedSetId, { cards: [...existingCards, newCard] });
      message.success(`Đã thêm "${addingWord.word}" vào bộ học`);
      setAddToSetModalVisible(false);
      setAddingWord(null);
      setSelectedSetId(null);
    } catch (error) {
      console.error('Lỗi thêm từ vào bộ học:', error);
      message.error('Không thể thêm từ vào bộ học');
    } finally {
      setSetActionLoading(false);
    }
  };

  const handlePlayAudio = (word: VocabularyWord) => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play().catch((error) => {
        console.error('Audio playback failed:', error);
        message.error('Không thể phát âm thanh từ file');
      });
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return;
    }

    message.error('Trình duyệt không hỗ trợ phát âm thanh');
  };

  const handleExportVocabulary = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/vocabulary/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vocabulary-export.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Xuất từ vựng thất bại');
    }
  };

  const handleImportVocabulary = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/vocabulary/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Import failed');
      }

      const data = await response.json();
      console.log('Kết quả import:', data);
      message.success(`Đã nhập thành công ${data.importedCount || 0} từ${data.skipped?.length ? `, bỏ qua ${data.skipped.length} từ` : ''}`);
      loadVocabulary();
    } catch (error) {
      console.error('Lỗi import:', error);
      message.error(error instanceof Error ? error.message : 'Nhập từ vựng thất bại');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'blue';
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Title level={3} style={{ margin: 0 }}>Vocabulary Manager</Title>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button type="default" icon={<DownloadOutlined />} onClick={handleExportVocabulary}>
              Export CSV
            </Button>
            <Button type="default" icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
              Import CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddWord}>
              Add Word
            </Button>
          </div>
        </div>
        <input
          type="file"
          accept=".csv"
          hidden
          ref={fileInputRef}
          onChange={handleImportVocabulary}
        />

        {/* Bộ lọc */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <Input
            placeholder="Search words..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Difficulty"
            value={selectedDifficulty}
            onChange={setSelectedDifficulty}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="beginner">Beginner</Option>
            <Option value="intermediate">Intermediate</Option>
            <Option value="advanced">Advanced</Option>
          </Select>
        </div>

        {/* Danh sách từ vựng */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Spin />
          </div>
        ) : vocabulary.length === 0 ? (
          <Empty description="No vocabulary found" />
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {vocabulary.map((word) => (
              <Card
                key={word.id}
                size="small"
                actions={[
                  <Button
                    key="audio"
                    icon={<SoundOutlined />}
                    onClick={() => handlePlayAudio(word)}
                  />,
                  <Button
                    key="addToSet"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddToSetClick(word)}
                  />,
                  ...(canModify(word)
                    ? [
                        <Button
                          key="edit"
                          icon={<EditOutlined />}
                          onClick={() => handleEditWord(word)}
                        />,
                        <Button
                          key="delete"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteWord(word.id)}
                        />,
                      ]
                    : []),
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <span style={{ fontWeight: 'bold' }}>{word.word}</span>
                      {word.phonetic && <span style={{ color: '#666' }}>/{word.phonetic}/</span>}
                      <Tag color={getDifficultyColor(word.difficulty)}>{word.difficulty}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      {word.definitions.slice(0, 2).map((def, index) => (
                        <div key={index} style={{ marginBottom: '0.25rem' }}>
                          <em>{def.partOfSpeech}:</em> {def.meaning}
                          {def.example && <span style={{ color: '#666' }}> - &quot;{def.example}&quot;</span>}
                        </div>
                      ))}
                      {word.tags.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          {word.tags.map((tag) => (
                            <Tag key={tag} style={{ fontSize: 12, padding: '0 6px' }}>{tag}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title={addingWord ? `Add "${addingWord.word}" to set` : 'Add word to set'}
        open={addToSetModalVisible}
        onCancel={() => {
          setAddToSetModalVisible(false);
          setAddingWord(null);
          setSelectedSetId(null);
        }}
        onOk={handleConfirmAddToSet}
        confirmLoading={setActionLoading}
      >
        <Form layout="vertical">
          <Form.Item label="Select a set" required>
            <Select
              placeholder="Choose one of your sets"
              value={selectedSetId || undefined}
              onChange={(value) => setSelectedSetId(value)}
              allowClear
            >
              {availableSets.map((set) => (
                <Option key={set.id} value={set.id}>
                  {set.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {availableSets.length === 0 && (
            <div>Chưa có bộ học nào. Vui lòng tạo bộ học trước.</div>
          )}
        </Form>
      </Modal>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingWord ? "Edit Word" : "Add New Word"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveWord}
        >
          <Form.Item
            label="Word"
            name="word"
            rules={[{ required: true, message: 'Please enter the word' }]}
          >
            <Input placeholder="Enter the word" />
          </Form.Item>

          <Form.Item label="Phonetic" name="phonetic">
            <Input placeholder="e.g., /ˈwɜːrd/" />
          </Form.Item>

          <Form.Item
            label="Difficulty"
            name="difficulty"
            rules={[{ required: true, message: 'Please select difficulty' }]}
          >
            <Select placeholder="Select difficulty">
              <Option value="beginner">Beginner</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Tags" name="tags">
            <Select mode="tags" placeholder="Add tags" />
          </Form.Item>

          <Form.Item label="Synonyms" name="synonyms">
            <Select mode="tags" placeholder="Add synonyms" />
          </Form.Item>

          <Form.Item label="Antonyms" name="antonyms">
            <Select mode="tags" placeholder="Add antonyms" />
          </Form.Item>

          <Form.List name="definitions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: '1rem' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'partOfSpeech']}
                      rules={[{ required: true, message: 'Missing part of speech' }]}
                    >
                      <Select placeholder="Part of speech">
                        <Option value="noun">Noun</Option>
                        <Option value="verb">Verb</Option>
                        <Option value="adjective">Adjective</Option>
                        <Option value="adverb">Adverb</Option>
                        <Option value="preposition">Preposition</Option>
                        <Option value="conjunction">Conjunction</Option>
                        <Option value="interjection">Interjection</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'meaning']}
                      rules={[{ required: true, message: 'Missing meaning' }]}
                    >
                      <Input placeholder="Meaning" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'example']}>
                      <Input placeholder="Example sentence" />
                    </Form.Item>
                    <Button danger onClick={() => remove(name)}>Remove Definition</Button>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  Add Definition
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: '2rem' }}>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingWord ? 'Update Word' : 'Add Word'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}