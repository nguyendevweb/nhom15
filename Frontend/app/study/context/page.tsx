import { Suspense } from "react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ContextLearningClient from "./ContextLearningClient";

export default function ContextLearningPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>}>
        <ContextLearningClient />
      </Suspense>
      <Footer />
    </>
  );
}
