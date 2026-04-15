'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Button, Spin, Alert, List } from 'antd'
import Header from '@/components/Header/Header'
import Footer from '@/components/Footer/Footer'
import { getSetById } from '../../../services/setService'
import { useAuth } from '../../../hooks/AuthContext'
import StudyModes from '../../../components/StudyModes/StudyModes'

interface CardItem {
  id: string
  front: string
  back: string
}

interface SetData {
  id: string
  title: string
  description?: string
  cards: CardItem[]
  userId: string
  userName: string
  tags?: string[]
  category?: string
  studyMode?: string
}

export default function SetDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [setData, setSetData] = useState<SetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSet = useCallback(async () => {
    if (!id) return
    try {
      const response = await getSetById(id as string)
      const rawSet = response.data?.set ?? response.data
      setSetData({
        id: rawSet?.id ?? rawSet?._id ?? "",
        title: rawSet?.title ?? "",
        description: rawSet?.description ?? "",
        cards: Array.isArray(rawSet?.cards) ? rawSet.cards : [],
        userId: rawSet?.userId ?? rawSet?.owner?._id ?? rawSet?.owner?.id ?? "",
        userName: rawSet?.userName ?? rawSet?.owner?.name ?? "Unknown",
        tags: Array.isArray(rawSet?.tags) ? rawSet.tags : [],
        category: rawSet?.category,
        studyMode: rawSet?.studyMode,
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
  if (!setData) return <Alert title="Set not found" type="warning" className="mt-10" />

  const isOwner = user?.id === setData.userId

  const studyLabel = setData.studyMode === 'spaced_repetition'
    ? 'Start Spaced Repetition'
    : setData.studyMode === 'context_learning'
    ? 'Start Context Learning'
    : setData.studyMode === 'mixed'
    ? 'Choose a study mode below'
    : 'Start Flashcard'

  const studyUrl = setData.studyMode === 'spaced_repetition'
    ? `/study/spaced-repetition?setId=${id}`
    : setData.studyMode === 'context_learning'
    ? `/study/context?setId=${id}`
    : setData.studyMode === 'flashcard'
    ? `/set/${id}/study`
    : ''

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card style={{ marginBottom: '2rem' }}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{setData.title}</h1>
            {setData.description && <p className="text-gray-600 mt-2">{setData.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <p className="text-sm text-gray-500">Created by {setData.userName}</p>
              <p className="text-sm text-gray-500">{setData.cards.length} cards</p>
              {setData.category && <p className="text-sm text-gray-500">Category: {setData.category}</p>}
              {setData.studyMode && <p className="text-sm text-gray-500">Mode: {setData.studyMode}</p>}
            </div>
            {setData.studyMode === 'mixed' && (
              <p className="text-sm text-blue-600 mt-2">
                Mixed mode includes Flashcard, Spaced Repetition and Context Learning. Choose one of them below.
              </p>
            )}
            {setData.tags && setData.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {setData.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4 flex gap-2 flex-wrap">
            <Button
              type="primary"
              onClick={() => studyUrl && router.push(studyUrl)}
              disabled={setData.cards.length === 0 || setData.studyMode === 'mixed'}
            >
              {studyLabel}
            </Button>
            {setData.studyMode === 'mixed' && (
              <span className="text-sm text-gray-500 self-center">
                Mixed mode includes Flashcard, Spaced Repetition and Context Learning. Please choose one of them below.
              </span>
            )}
            {isOwner && (
              <Button onClick={() => router.push(`/set/${id}/edit`)}>
                Edit Set
              </Button>
            )}
          </div>
        </Card>

        <StudyModes setId={id as string} />

        <Card title="Cards Preview" style={{ marginTop: '2rem' }}>
          <List
            dataSource={setData.cards}
            renderItem={(card) => (
              <List.Item>
                <Card size="small" className="w-full">
                  <div className="flex justify-between">
                    <div>
                      <strong>Front:</strong> {card.front}
                    </div>
                    <div>
                      <strong>Back:</strong> {card.back}
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </>
  )
}