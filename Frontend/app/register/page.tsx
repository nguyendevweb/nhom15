'use client'

import { Form, Input, Button, Alert, Card, message } from 'antd'
import { useAuth } from '../../hooks/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RegisterPage() {
  const { register, isLoading, error } = useAuth()
  const [form] = Form.useForm()
  const router = useRouter()

  useEffect(() => {
    if (error) {
      message.error(error)
    }
  }, [error])

  const onFinish = async (values: { name: string; email: string; password: string; confirmPassword: string }) => {
    try {
      await register({ name: values.name, email: values.email, password: values.password })
      message.success('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...')
      setTimeout(() => router.push('/login'), 1000)
    } catch (err) {
      // Lỗi đã được hiển thị bởi useEffect ở trên
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input placeholder="Enter your name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match!'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm your password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              Register
            </Button>
          </Form.Item>
        </Form>
        <div className="text-center">
          <span>Already have an account? </span>
          <a href="/login" className="text-blue-500">Login</a>
        </div>
      </Card>
    </div>
  )
}