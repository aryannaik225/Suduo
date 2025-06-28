'use client'

import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { SiTicktick } from "react-icons/si";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { createSession } from '@/firebase/firestoreUtils';
import Footer from '@/components/Footer';

const difficulties = ['Easy', 'Medium', 'Hard', 'Insane', 'Inhuman']

export default function Home() {

  const [theme, setTheme] = useState('dark')
  const [name, setName] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  const router = useRouter()

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


  const handleStartGame = async () => {
    if (!name || !difficulty) {
      toast.error('Please enter your username and select a difficulty level.', {
        position: 'top-center',
        autoClose: 3000,
        pauseOnHover: true,
        theme: theme === 'dark' ? 'dark' : 'light'
      })
      return;
    }

    setLoading(true)

    try {

      const sessionId = nanoid()
      const hostId = nanoid(10)
      const hostUsername = name
      const hostPfp = `/profile_avatars/pfp${Math.floor(Math.random() * 16) + 1}.svg`;

      localStorage.setItem('hostData', JSON.stringify({
        sessionId,
        difficulty,
        hostId,
        hostUsername,
        hostPfp,
      }));

      const res = await axios.get(`/api/generate-sudoku?difficulty=${difficulty}`);
      const { puzzle, solution, difficultyRating } = res.data;
      if (!puzzle || !solution) {
        throw new Error('Failed to generate puzzle');
      }

      const initialState = {
        initialGrid: puzzle,
        solution: solution,
        userGrid: Array(81).fill(null),
        notesGrid: Object.fromEntries(Array(81).fill(null).map((_, idx) => [idx, []])),
        mistakes: 0,
        pause: false,
        failed: false,
        undoStack: [],
        redoStack: [],
        players: [{
          id: hostId,
          username: hostUsername,
          avatar: hostPfp,
          joinedAt: Date.now()
        }]
      };

      await createSession(sessionId, initialState);


      if (!sessionId || !hostId) {
        toast.error('Failed to create game session. Please try again.', {
          position: 'top-center',
          autoClose: 3000,
          pauseOnHover: true,
          theme: theme === 'dark' ? 'dark' : 'light'
        });
        return
      }

      if (!hostId || !hostUsername || !hostPfp) {
        toast.error('Failed to create host data. Please try again.', {
          position: 'top-center',
          autoClose: 3000,
          pauseOnHover: true,
          theme: theme === 'dark' ? 'dark' : 'light'
        });
        return
      }

      setReady(true);

      setTimeout(() => {
        router.push(`/game/${sessionId}`)
      }, 2000)

    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start the game. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
        pauseOnHover: true,
        theme: theme === 'dark' ? 'dark' : 'light'
      });
      setLoading(false);
    }
  }


  return (
    <div className='relative w-screen h-screen overflow-hidden flex justify-center items-center'>

      <div className="absolute inset-0 z-0 opacity-20 bg-[url('/sudoku-bg-dark.svg')] dark:bg-[url('/sudoku-bg.svg')] bg-center bg-cover blur-sm"></div>


      <div className='relative z-10 flex flex-col items-center min-h-10 w-80'>

        <div className='text-3xl poppins-semibold text-black dark:text-white mb-5' onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
          Select Difficulty
        </div>

        <div className='flex flex-col gap-2 w-full'>
          <div className='bg-white dark:bg-[#020817] px-3 py-3 rounded-lg border-2 border-gray-300 dark:border-[#324465] focus-within:border-black dark:focus-within:border-white w-full mb-5'>
            <input
              type="text"
              placeholder='Enter your username'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full h-full bg-transparent placeholder:text-gray-500 dark:placeholder:text-slate-400 text-black dark:text-white text-[15px] focus:outline-none inter-regular'
            />
          </div>
        </div>

        <div className='flex flex-col gap-2 w-full mb-5'>
          <div className='flex flex-col items-center gap-2 w-full'>
            {difficulties.map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`w-full py-3
              ${difficulty === level
                    ? 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'
                    : 'bg-slate-200 dark:bg-[#020817] text-black dark:text-gray-500'}
              hover:bg-slate-300 dark:hover:bg-[#101929] hover:text-black dark:hover:text-white
              rounded-lg text-[15px] inter-regular duration-200 transition`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <button
          className='mt-5 w-full py-3 bg-gray-300 dark:bg-gray-800 text-black dark:text-white rounded-lg text-[15px] inter-regular hover:bg-gray-400 dark:hover:bg-gray-700 duration-200 transition flex justify-center items-center'
          onClick={handleStartGame}
          disabled={loading}
        >
          {loading
            ? ready
              ? <><SiTicktick className='mr-2' />Game Ready</>
              : <><FaSpinner className='animate-spin mr-2' /> Creating Game</>
            : 'Start Game'
          }
        </button>

        <ToastContainer />

      </div>
      <Footer />
    </div>

  );
}
