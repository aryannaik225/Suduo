'use client'

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FaSpinner } from "react-icons/fa"
import { ToastContainer, toast } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import { nanoid } from "nanoid"
import { getSessionData, updateSession } from "@/firebase/firestoreUtils"

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

      const updatePlayers = [...(sessionData.players || []), newPlayer]

      await updateSession(sessionId, {
        players: updatePlayers,
      })


      localStorage.setItem('playerData', JSON.stringify({
        sessionId,
        playerId: playerId,
        playerUsername: name,
        playerPfp: playerPfp,
      }));

      setLoading(false)

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
          className="mt-5 w-full py-3 bg-gray-800 text-white rouned-lg text-[15px] inter-regular hover:bg-gray-700 duration-200 transition flex justify-center items-center"
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