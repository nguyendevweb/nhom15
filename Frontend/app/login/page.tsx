"use client";

import { Form, Input, Button, Card, message } from "antd";
import { useAuth } from "../../hooks/AuthContext";
import { useRouter } from "next/navigation";
import GoogleLoginButton from "../../components/GoogleLoginButton/GoogleLoginButton";
import { useEffect } from "react";

export default function Login() {
  const { login, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      message.success("Đăng nhập thành công!");
      setTimeout(() => router.push("/"), 500);
    } catch (err) {
      // Lỗi đã được hiển thị bởi useEffect ở trên
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        <Form onFinish={onFinish}>
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Login
          </Button>
        </Form>
        <div className="text-center my-4">
          <span>or</span>
        </div>
        <GoogleLoginButton />
        <div className="text-center mt-4">
          <span>Don&apos;t have an account? </span>
          <a href="/register" className="text-blue-500">Register</a>
        </div>
      </Card>
    </div>
  );
}