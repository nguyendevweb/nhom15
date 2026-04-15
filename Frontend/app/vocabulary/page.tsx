"use client";

import { useAuth } from "../../hooks/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import VocabularyManager from "../../components/VocabularyManager/VocabularyManager";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function VocabularyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div>
      <VocabularyManager />
    </div>
      <Footer />
    </>
  );
}