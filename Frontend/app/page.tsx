"use client";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import StudyModes from "@/components/StudyModes/StudyModes";
import { useEffect, useState } from "react";
import { getAllSets } from "@/services/setService";
import SetCard from "../components/SetCard/SetCard";
import { useAuth } from "@/hooks/AuthContext";
import { Button, Row, Col, Alert } from "antd";
import { useRouter } from "next/navigation";

interface Set {
  _id: string;
  title: string;
  description?: string;
  cards: { front: string; back: string }[];
  userId: string;
  userName: string;
}

export default function Home() {
  const [sets, setSets] = useState<Set[]>([]);
  const [dueCount, setDueCount] = useState<number>(0);
  const { user, token } = useAuth();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const res = await getAllSets();
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setSets(data);
    } catch (error) {
      console.error("Không tải được bộ thẻ:", error);
      setSets([]);
    }
  };

  const fetchDueCards = async () => {
    if (!token) {
      setDueCount(0);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/study/due?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch due cards');
      const data = await response.json();
      setDueCount(Array.isArray(data.cards) ? data.cards.length : 0);
    } catch (error) {
      console.error('Không tải được số lượng thẻ cần ôn:', error);
      setDueCount(0);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchDueCards();
  }, [token]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="hero-section">
        <div className="container text-center py-5">
          <h1>MinLish - Ứng dựng hỗ trợ học từ vựng tiếng Anh</h1>
          <p>Master whatever you&apos;re learning with MinLish&apos;s interactive flashcards, practice tests, and study activities.</p>
          <Button type="primary" size="large" onClick={() => router.push("/register")}>Sign up for free</Button>
          {user && dueCount > 0 && (
            <div className="mt-4">
              <Alert
                message={`You have ${dueCount} words due for review today`}
                type="info"
                showIcon
                closable
              />
            </div>
          )}
        </div>
      </div>

      <StudyModes />

      <div className="container mt-4 flex-grow">
        <h2>{user ? "Your sets" : "Popular study sets"}</h2>

        <Row gutter={[16, 16]}>
          {sets.map((s) => (
            <Col xs={24} sm={12} md={8} lg={6} key={s._id}>
              <SetCard set={s} />
            </Col>
          ))}
        </Row>
      </div>

      <Footer />
    </div>
  );
}