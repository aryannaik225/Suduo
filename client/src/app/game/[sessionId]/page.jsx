'use client'

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {

  const [theme, setTheme] = useState('dark')
  const [username, setUsername] = useState('')
  const [pfp, setPfp] = useState('')
  const [difficulty, setDifficulty] = useState('')
  
  const router = useRouter()


  // -------------- Theme ---------------

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) setTheme(savedTheme)
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])


  // -------------- Username and Pfp ---------------

  useEffect(() => {
    const storedData = localStorage.getItem('sudokuGameData')
    if (!storedData) {
      alert('Missing game data. Please restart.')
      router.push('/')
      return
    }

    const parsed = JSON.parse(storedData)
    setUsername(parsed.name)
    setPfp(parsed.pfp)
    setDifficulty(parsed.difficulty)
  })

  return (
    <div>
      Hello
    </div>
  )
}