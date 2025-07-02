'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Game from '@/components/Game';
import { DotPulse } from 'ldrs/react';
import 'ldrs/react/DotPulse.css'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { getSessionData } from '@/firebase/firestoreUtils';
import FooterForGame from '@/components/FooterForGame';

export default function Home() {

  const { sessionId } = useParams();
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

  // useEffect(() => {
  //   const hostData = localStorage.getItem('hostData')
  //   if (hostData) {
  //     const { sessionId, hostUsername, hostPfp, difficulty } = JSON.parse(hostData)
  //     if (sessionId && hostUsername && hostPfp && difficulty) {
  //       const puzzleData = JSON.parse(localStorage.getItem('puzzleData'));
  //       if (puzzleData?.puzzle && puzzleData?.solution) {
  //         setPuzzle(puzzleData.puzzle)
  //         setSolution(puzzleData.solution)
  //         setTimeout(() => {
  //           setGameReady(true);
  //         }, 3000)
  //       } else {
  //         toast.error('Puzzle data is missing. Please start a new game.', {
  //           position: 'top-center',
  //           autoClose: 3000,
  //           pauseOnHover: true,
  //           theme: theme === 'dark' ? 'dark' : 'light'
  //         });
  //         // setTimeout(() => {
  //         //  router.push('/') 
  //         // }, 3000)
  //       }
  //     } else {
  //       toast.error('Invalid session data. Please start a new game.', {
  //         position: 'top-center',
  //         autoClose: 3000,
  //         pauseOnHover: true,
  //         theme: theme === 'dark' ? 'dark' : 'light'
  //       });
  //       setTimeout(() => {
  //         router.push('/')
  //       }, 3000)
  //     }
  //   }
  // }, [])

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSessionData(sessionId);
      if (session?.initialGrid && session?.solution) {
        setPuzzle(session.initialGrid);
        setSolution(session.solution);
        setTimeout(() => setGameReady(true), 3000);
      } else {
        toast.error('Invalid or missing session data.', {
          position: 'top-center',
          autoClose: 3000,
          pauseOnHover: true,
          theme: theme === 'dark' ? 'dark' : 'light'
        });
        router.push('/');
      }
    }

    fetchSession();
  }, []);


  if (!gameReady) {

    return (
      <div className="flex items-center justify-center h-screen">
        <ToastContainer />
        <div className="flex gap-1 text-2xl text-black dark:text-white items-center poppins-regular">
          Joining Game
          <div className=''>
            <DotPulse
              size="20"
              speed="1.3"
              color={theme === 'dark' ? '#ffffff' : '#000000'}
            />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className='flex flex-col min-h-screen w-screen'>
      <ToastContainer />
      <NavBar theme={theme} setTheme={setTheme} />
      <div className='flex-grow'>
        <Game puzzle={puzzle} sol={solution} />
      </div>
      <FooterForGame />

    </div>
  )
}