import { Suspense } from "react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SpacedRepetitionClient from "./SpacedRepetitionClient";

export default function SpacedRepetitionPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>}>
        <SpacedRepetitionClient />
      </Suspense>
      <Footer />
    </>
  );
}
