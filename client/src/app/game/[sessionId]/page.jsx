'use client'

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Game from '@/components/Game';
import { DotPulse } from 'ldrs/react';
import 'ldrs/react/DotPulse.css'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

export default function Home() {

  const [theme, setTheme] = useState('dark')
  const [gameReady, setGameReady] = useState(false)

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


  // -------------- Username and Pfp and puzzle ---------------

  useEffect(() => {
    const hostData = localStorage.getItem('hostData')

    if (hostData) {
      const { sessionId, hostUsername, hostPfp, difficulty } = JSON.parse(hostData)
      if (sessionId && hostUsername && hostPfp && difficulty) {
        try {
          const res = axios.get(`/api/generate-sudoku?difficulty=${difficulty}`)
          const { puzzle, solution, difficultyRating } = res.data;
          setGameReady(true);
        } catch (error) {
          console.error('Error fetching puzzle:', error);
          toast.error('Failed to load puzzle. Please try again.', {
            position: 'top-center',
            autoClose: 3000,
            pauseOnHover: true,
            theme: theme === 'dark' ? 'dark' : 'light'
          });
          return;
        }
      } else {
        toast.error('Invalid session data. Please start a new game.', {
          position: 'top-center',
          autoClose: 3000,
          pauseOnHover: true,
          theme: theme === 'dark' ? 'dark' : 'light'
        });
        setTimeout(() => {
          router.push('/')
        }, 3000)
        return;
      }
    }
  })

  if (!gameReady) {

    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex gap-1 text-2xl text-gray-500 items-end">
          Loading
          <DotPulse
            size="43"
            speed="1.3"
            color="black"
          />
        </div>
      </div>
    )
  }
  return (
    <div>
      <NavBar theme={theme} setTheme={setTheme} />
      <Game />
    </div>
  )
}