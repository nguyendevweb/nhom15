"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Space, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function FlashcardEntryPage() {
  const router = useRouter();
  const [setId, setSetId] = useState<string | null>(null);
  const [hasReadParams, setHasReadParams] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSetId(params.get("setId"));
    setHasReadParams(true);
  }, []);

  useEffect(() => {
    const trimmed = setId?.trim() ?? "";
    const looksLikeMongoId = /^[a-f\d]{24}$/i.test(trimmed);
    if (looksLikeMongoId) {
      router.replace(`/set/${setId}/study`);
    }
  }, [setId, router]);

  const trimmed = setId?.trim() ?? "";
  const looksLikeMongoId = /^[a-f\d]{24}$/i.test(trimmed);

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <Card>
        <Title level={3}>Flashcard Mode</Title>
        {looksLikeMongoId ? (
          <Paragraph>Redirecting to your set...</Paragraph>
        ) : (
          <>
            {hasReadParams && trimmed && (
              <Paragraph type="danger">
                Invalid <code>setId</code> in URL. Please open Flashcard mode from a set page.
              </Paragraph>
            )}
            <Paragraph>
              Please choose a study set first, then open Flashcard mode to review cards.
            </Paragraph>
          </>
        )}
        <Space>
          <Button type="primary" onClick={() => router.push("/")}>
            Go to Home
          </Button>
          <Button onClick={() => router.push("/create")}>
            Create New Set
          </Button>
        </Space>
      </Card>
    </div>
  );
}
