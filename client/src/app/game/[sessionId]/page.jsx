'use client'

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Game from '@/components/Game';
import { DotPulse } from 'ldrs/react';
import 'ldrs/react/DotPulse.css'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

export default function Home() {

  const [theme, setTheme] = useState('dark')
  const [gameReady, setGameReady] = useState(false)
  const [puzzle, setPuzzle] = useState(null)
  const [solution, setSolution] = useState(null)

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
        const puzzleData = JSON.parse(localStorage.getItem('puzzleData'));
        if (puzzleData?.puzzle && puzzleData?.solution) {
          setPuzzle(puzzleData.puzzle)
          setSolution(puzzleData.solution)
          setTimeout(() => {
            setGameReady(true);
          }, 3000)
        } else {
          toast.error('Puzzle data is missing. Please start a new game.', {
            position: 'top-center',
            autoClose: 3000,
            pauseOnHover: true,
            theme: theme === 'dark' ? 'dark' : 'light'
          });
          // setTimeout(() => {
          //  router.push('/') 
          // }, 3000)
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
      }
    }
  }, [])


  if (!gameReady) {

    return (
      <div className="flex items-center justify-center h-screen">
        <ToastContainer />
        <div className="flex gap-1 text-2xl text-white items-center poppins-regular">
          Joining Game
          <div className=''>
            <DotPulse
              size="20"
              speed="1.3"
              color="white"
            />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div>
      <ToastContainer />
      <NavBar theme={theme} setTheme={setTheme} />
      <Game puzzle={puzzle} sol={solution} />
    </div>
  )
}