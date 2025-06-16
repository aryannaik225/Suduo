'use client'

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Game from '@/components/Game';

export default function Home() {

  const [theme, setTheme] = useState('dark')
  
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

  return (
    <div>
      <NavBar theme={theme} setTheme={setTheme} />
      <Game />
    </div>
  )
}