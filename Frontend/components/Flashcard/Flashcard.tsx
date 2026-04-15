'use client'

import { useState } from 'react'
import styles from './Flashcard.module.css'

interface FlashcardProps {
  front: string
  back: string
  onFlip?: () => void
  onNext?: () => void
  onPrev?: () => void
  showControls?: boolean
}

export default function Flashcard({ front, back, onFlip, onNext, onPrev, showControls = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    onFlip?.()
  }

  return (
    <div className={styles.flashcardContainer}>
      <div className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`} onClick={handleFlip}>
        <div className={styles.front}>
          <div className={styles.content}>{front}</div>
        </div>
        <div className={styles.back}>
          <div className={styles.content}>{back}</div>
        </div>
      </div>
      {showControls && (
        <div className={styles.controls}>
          <button onClick={onPrev} disabled={!onPrev}>Previous</button>
          <button onClick={handleFlip}>Flip</button>
          <button onClick={onNext} disabled={!onNext}>Next</button>
        </div>
      )}
    </div>
  )
}