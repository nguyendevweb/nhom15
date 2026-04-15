'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Spin, Alert, Button, Progress } from 'antd'
import Header from '@/components/Header/Header'
import Footer from '@/components/Footer/Footer'
import { getSetById } from '../../../../services/setService'
import Flashcard from '../../../../components/Flashcard/Flashcard'

interface CardItem {
  id: string
  front: string
  back: string
}

interface SetData {
  id: string
  title: string
  cards: CardItem[]
}

export default function StudyPage() {
  const { id } = useParams()
  const router = useRouter()
  const [setData, setSetData] = useState<SetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const fetchSet = useCallback(async () => {
    if (!id) return
    try {
      const response = await getSetById(id as string)
      const rawSet = response.data?.set ?? response.data
      setSetData({
        id: rawSet?.id ?? rawSet?._id ?? "",
        title: rawSet?.title ?? "",
        cards: Array.isArray(rawSet?.cards)
          ? rawSet.cards.map((card: { id?: string; _id?: string; front?: string; back?: string }) => ({
              id: card.id ?? card._id ?? "",
              front: card.front ?? "",
              back: card.back ?? "",
            }))
          : [],
      })
    } catch {
      setError('Failed to load set')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSet()
  }, [fetchSet])

  if (loading) return <Spin size="large" className="flex justify-center mt-10" />
  if (error) return <Alert title={error} type="error" className="mt-10" />
  if (!setData || setData.cards.length === 0) return <Alert title="No cards to study" type="warning" className="mt-10" />

  const currentCard = setData.cards[currentIndex]
  const progress = ((currentIndex + 1) / setData.cards.length) * 100

  const handleNext = () => {
    if (currentIndex < setData.cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <Button onClick={() => router.push(`/set/${id}`)}>Back to Set</Button>
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {setData.cards.length}
          </span>
        </div>
        <Progress percent={progress} showInfo={false} className="mb-4" />
        <Flashcard
          front={currentCard.front}
          back={currentCard.back}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </div>
    </div>
      <Footer />
    </>
  )
}