"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Card, Input, Button, Modal, Form, Select, Tag, message, Space, Typography, Spin, Empty } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/AuthContext";

const { Title } = Typography;
const { Option } = Select;

interface VocabularyWord {
  _id: string;
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
  const { token } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
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
    try {
      const response = await fetch(`http://localhost:5000/api/vocabulary/${wordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete word');

      message.success('Xóa từ thành công');
      loadVocabulary();
    } catch (error) {
      message.error('Xóa từ thất bại');
    }
  };

  const handleSaveWord = async (values: VocabularyFormValues) => {
    try {
      const method = editingWord ? 'PUT' : 'POST';
      const url = editingWord
        ? `http://localhost:5000/api/vocabulary/${editingWord._id}`
        : 'http://localhost:5000/api/vocabulary';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to save word');

      message.success(`${editingWord ? 'Cập nhật từ thành công' : 'Thêm từ thành công'}`);
      setIsModalVisible(false);
      loadVocabulary();
    } catch (error) {
      message.error('Lưu từ thất bại');
    }
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
                key={word._id}
                size="small"
                actions={[
                  <Button
                    key="edit"
                    icon={<EditOutlined />}
                    onClick={() => handleEditWord(word)}
                  />,
                  <Button
                    key="delete"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteWord(word._id)}
                  />,
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