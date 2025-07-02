'use client'

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FaSpinner } from "react-icons/fa"
import { LuCircleDashed } from "react-icons/lu";
import { ToastContainer, toast } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import { nanoid } from "nanoid"
import { addPlayerToSession, getSessionData, updateSession } from "@/firebase/firestoreUtils"

export default function Home() {

  const [theme, setTheme] = useState('dark')
  const [name, setName] = useState('')
  const { sessionId } = useParams()
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

    setLoading(true)

    let playerId = nanoid(10)
    const playerPfp = `/profile_avatars/pfp${Math.floor(Math.random() * 16) + 1}.svg`

    try {

      const sessionData = await getSessionData(sessionId)
      if (!sessionData) {
        toast.error('Session not found.', {
          position: 'top-center',
          autoClose: 3000,
          pauseOnHover: true,
          theme: theme === 'dark' ? 'dark' : 'light'
        });
        setLoading(false)
        return
      }

      let loopLimit = 10;
      while (loopLimit--) {
        const matchingPlayer = sessionData.players?.find(player => player.id === playerId);

        if (!matchingPlayer) {
          break;
        }

        if (matchingPlayer.username === name) {
          toast.error('A player with this ID and name already exists.', {
            position: 'top-center',
            autoClose: 3000,
            pauseOnHover: true,
            theme: theme === 'dark' ? 'dark' : 'light',
          });
          setLoading(false);
          return;
        }

        playerId = nanoid(10);
      }


      const newPlayer = {
        id: playerId,
        username: name,
        avatar: playerPfp,
        joinedAt: Date.now(),
      }

      // const updatePlayers = [...(sessionData.players || []), newPlayer]

      // await updateSession(sessionId, {
      //   players: updatePlayers,
      // })

      await addPlayerToSession(sessionId, newPlayer)


      localStorage.setItem('playerData', JSON.stringify({
        sessionId,
        playerId: playerId,
        playerUsername: name,
        playerPfp: playerPfp,
      }));

      setLoading(false)
      setReady(true)

      setTimeout(() => {
        router.push(`/game/${sessionId}`)
      }, 1000)

    } catch (error) {
      console.error(error)
      toast.error('Failed to join session.', {
        position: 'top-center',
        autoClose: 3000,
        pauseOnHover: true,
        theme: theme === 'dark' ? 'dark' : 'light'
      });
    } finally {
      setLoading(false)
    }
  }





  return (
    <div className="relative w-screen h-screen flex justify-center items-center bg-gradient-to-br from-white via-gray-100 to-white dark:from-[#0f172a] dark:via-[#0a0f1f] dark:to-[#0f172a] overflow-hidden px-4 sm:px-6 lg:px-8">
      <ToastContainer />

      {/* Glowing blobs in the background */}
      <div className="absolute w-full h-full pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-40 sm:h-40 bg-cyan-400 opacity-20 blur-3xl rounded-full animate-pulse dark:opacity-10"></div>
        <div className="absolute top-[60%] right-[20%] w-40 h-40 sm:w-52 sm:h-52 bg-purple-500 opacity-20 blur-2xl rounded-full animate-ping dark:opacity-10"></div>
      </div>

      {/* Centered container with glassmorphism and glowing box shadow */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm sm:max-w-md md:max-w-lg backdrop-blur-md bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 sm:p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-white mb-6 sm:mb-8 text-center" onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
          Enter Your Username
        </div>

        <div className="w-full px-4 py-3 mb-5 rounded-md border border-cyan-500/30 bg-white dark:bg-transparent focus-within:ring-2 focus-within:ring-cyan-400/30">
          <input
            type="text"
            placeholder="Enter your username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent placeholder:text-gray-400 text-gray-800 dark:text-white text-[15px] focus:outline-none"
          />
        </div>

        <button
          onClick={handleStartGame}
          className="mt-2 w-full py-3 bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-400 text-cyan-700 dark:text-cyan-200 rounded-md hover:bg-cyan-500/20 transition-all duration-200 shadow-[0_0_20px_rgba(0,200,255,0.1)] dark:shadow-[0_0_20px_rgba(0,255,255,0.15)] flex justify-center items-center"
          disabled={!name || loading}
        >
          {loading
            ? ready
              ? <><SiTicktick className='mr-2' />Game Ready</>
              : <><LuCircleDashed className='animate-spin mr-2' /> Creating Game</>
            : 'Start Game'
          }
        </button>
      </div>
    </div>
  )
}