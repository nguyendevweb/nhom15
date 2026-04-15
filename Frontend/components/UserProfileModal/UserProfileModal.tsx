"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Avatar, Upload, Divider, Select } from "antd";
import { UserOutlined, UploadOutlined, SaveOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;
import { useAuth } from "../../hooks/AuthContext";
import { RcFile } from "antd/es/upload";

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  learningGoal?: string;
  level?: string;
}

export default function UserProfileModal({ visible, onClose }: UserProfileModalProps) {
  const { user, token, updateProfile } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<RcFile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        learningGoal: user.learningGoal || '',
        level: user.level || 'A1',
      });
      setAvatarPreview(user.avatar);
    }
  }, [visible, user, form]);

  const handleAvatarChange = (file: RcFile) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    return false; // Chặn upload tự động để xử lý file avatar thủ công
  };

  const handleSave = async (values: UserProfile) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('email', values.email);
      formData.append('learningGoal', values.learningGoal || '');
      formData.append('level', values.level || 'A1');
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await updateProfile(formData);
      message.success('Cập nhật hồ sơ thành công!');
      onClose();
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ:', error);
      message.error(error instanceof Error ? error.message : 'Cập nhật hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Modal.confirm({
      title: 'Delete Account',
      content: 'Are you sure you want to delete your account? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to delete account');
          }

          message.success('Xóa tài khoản thành công');
          // Đăng xuất và chuyển hướng
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } catch (error) {
          message.error('Xóa tài khoản thất bại');
        }
      },
    });
  };

  return (
    <Modal
      title="User Profile"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={80}
            src={avatarPreview || undefined}
            icon={!avatarPreview ? <UserOutlined /> : undefined}
            style={{ marginBottom: 16 }}
          />
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleAvatarChange}
          >
            <Button icon={<UploadOutlined />}>Change Avatar</Button>
          </Upload>
        </div>

        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input placeholder="Enter your name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item label="Learning Goal" name="learningGoal">
          <Input placeholder="e.g. IELTS, Communication, TOEIC" />
        </Form.Item>

        <Form.Item label="Level" name="level">
          <Select>
            <Option value="A1">A1</Option>
            <Option value="A2">A2</Option>
            <Option value="B1">B1</Option>
            <Option value="B2">B2</Option>
            <Option value="C1">C1</Option>
            <Option value="C2">C2</Option>
          </Select>
        </Form.Item>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteAccount}
            style={{ flex: 1 }}
          >
            Delete Account
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading}
            style={{ flex: 1 }}
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
}