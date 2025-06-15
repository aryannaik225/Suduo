'use client'

import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSpinner } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

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
    if (!name || !difficulty ) {
      toast.error('Please enter your username and select difficulty!', {
        position: 'top-center',
        autoClose: 3000,
        theme: theme === 'dark' ? 'dark' : 'light',
      })
      return;
    }

    setLoading(true)

    try {
      const res = await axios.get(`/api/generate-sudoku?difficulty=${difficulty}`)
      const { puzzle, solution, difficultyRating } = res.data;

      const sessionId = uuidv4()
      const availablePfps = Array.from({ length: 16 }, (_, i) => `/profile_avatars/pfp${i + 1}.svg`)
      const pfp = availablePfps[Math.floor(Math.random() * availablePfps.length)]

      localStorage.setItem('sudokuGameData', JSON.stringify({
        sessionId, name, pfp, difficulty, puzzle, solution, difficultyRating
      }))

      setLoading(false)
      setReady(true)

      setTimeout(() => {
        router.push(`/game/${sessionId}`)
      }, 1000)
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate puzzle')
      setLoading(false)
    }
  }


  return (
    <div className='w-screen h-screen flex justify-center items-center'>
      <div className='flex flex-col items-center min-h-10 w-80'>
        <div className='text-3xl poppins-semibold text-white mb-5'>
          Select Difficulty
        </div>

        <div className='flex flex-col gap-2 w-full'>
          <div className='bg-[#020817] px-3 py-3 rounded-lg border-2 focus-within:border-white border-[#324465] w-full mb-5'>
            <input 
              type="text"
              placeholder='Enter your username'
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className='w-full h-full bg-transparent placeholder:text-slate-400 text-white text-[15px] focus:outline-none inter-regular'
            />
          </div>
        </div>

        <div className='flex flex-col gap-2 w-full mb-5'>
          <div className='flex flex-col items-center gap-2 w-full'>
            {difficulties.map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`w-full py-3 ${difficulty === level ? ' bg-gray-700' : 'bg-slate-300 dark:bg-[#020817] dark:text-gray-500 text-black'}  hover:bg-skate-400 dark:hover:bg-[#101929] rounded-lg text-[15px] inter-regular  duration-200 dark:hover:text-white transition`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <button
          className='mt-5 w-full py-3 bg-gray-800 text-white rounded-lg text-[15px] inter-regular hover:bg-gray-700 duration-200 transition flex justify-center items-center'
          onClick={handleStartGame}
          disabled={loading}
        >
          {loading
            ? ready
              ? 'Game Ready'
              : <><FaSpinner className='animate-spin mr-2'/> Creating Game</>
            : 'Start Game'
          }
        </button>

        <ToastContainer />
      </div>
    </div>
  );
}
