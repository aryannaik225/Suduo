'use client'

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FaSpinner } from "react-icons/fa"
import { ToastContainer, toast } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'

export default function Home() {

  const [theme, setTheme] = useState('dark')
  const [name, setName] = useState('')
  const { sessionId } = useParams()
  const [loading, setLoading] = useState(false)

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

  const handleStartGame = () => {
    if (!name) {
      toast.error('Please enter your username.', {
        position: 'top-center',
        autoClose: 3000,
        pauseOnHover: true,
        theme: theme === 'dark' ? 'dark' : 'light'
      })
      return;
    }

    if (!sessionId) {
      toast.error('Session ID is missing.', {
        position: 'top-center',
        autoClose: 3000,
        pauseOnHover: true,
        theme: theme === 'dark' ? 'dark' : 'light'
      })
      return;
    }

    localStorage.setItem('playerData', JSON.stringify({
      sessionId,
      palyerUsername: name,
      playerPfp: `/profile_avatars/pfp${Math.floor(Math.random() * 16) + 1}.svg`,
    }));
  }

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <ToastContainer />
      <div className="flex flex-col items-center min-h-10 w-80">
        <div className="text-3xl poppins-semibold text-white mb-5">
          Enter Your Username
        </div>

        <div className='bg-[#020817] px-3 py-3 rounded-lg border-2 focus-within:border-white border-[#324465] w-full mb-5'>
          <input
            type="text"
            placeholder='Enter your username'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full h-full bg-transparent placeholder:text-slate-400 text-white text-[15px] focus:outline-none inter-regular'
          />
        </div>

        <button
          onClick={handleStartGame}
          className="mt-5 w0full py-3 bg-gray-800 text-white rouned-lg text-[15px] inter-regular hover:bg-gray-700 duration-200 transition flex justify-center items-center"
          disabled={!name || loading}
        >
          {loading
            ? <><FaSpinner className="animate-spin mr-2" /> Creating Game</>
            : 'Start Game'
          }
        </button>
      </div>
    </div>
  )
}