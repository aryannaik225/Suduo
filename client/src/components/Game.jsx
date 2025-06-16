'use client'

import React, { useState, useEffect } from 'react'
import { FaRegCirclePlay, FaRegCirclePause, FaCheck } from 'react-icons/fa6'
import { IoSettingsOutline } from 'react-icons/io5'
import { IoIosLink } from 'react-icons/io'
import { FaBackspace } from 'react-icons/fa'
import { RiArrowGoBackLine, RiArrowGoForwardLine } from 'react-icons/ri'
import { LuPencilLine } from 'react-icons/lu'
import copy from 'copy-to-clipboard'
import { motion, AnimatePresence } from 'motion/react'

const Game = () => {

  const [pause, setPause] = useState(false)
  const [timeInSeconds, setTimeInSeconds] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const sessionId = '12345'
  const multiplayerLink = typeof window !== 'undefined' ? `${window.location.origin}/game/${sessionId}` : ''

  // ---------------- copy button animation ---------------

  const [copied, setCopied] = useState(false);

  const copyLinkVariants = {
    initial: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 20, transition: { duration: 0.3 } },
    visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3 } }
  };

  const checkIconVariants = {
    initial: { opacity: 0, y: 20 },
    hidden: { opacity: 0, y: -20, transition: { duration: 0.3 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const handleCopy = () => {
    if (copied) return

    copy(multiplayerLink)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 5000)
  }


  // ---------------- Timer Logic ---------------
  useEffect(() => {
    let interval = null

    if (!pause) {
      interval = setInterval(() => {
        setTimeInSeconds(prevTime => prevTime + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [pause])

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (num) => String(num).padStart(2, '0')

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }

  // ----------------  Logic ---------------

  return (
    <div className='flex justify-center mb-10'>
      <div className='max-h-[800px] w-[80%] max-w-[1228px] rounded-2xl border-[3px] border-[#324465] flex flex-col items-center p-5'>
        <div className='flex items-center justify-between w-full mb-3'>
          <div className='flex gap-2 items-center text-lg w-[110px] justify-start'>
            <FaRegCirclePlay
              className={`text-slate-400 text-2xl cursor-pointer hover:scale-110 duration-200 ${pause ? 'block' : 'hidden'}`}
              onClick={() => setPause(!pause)}
            />
            <FaRegCirclePause
              className={`text-slate-400 text-2xl cursor-pointer hover:scale-110 duration-200 ${pause ? 'hidden' : 'pause'}`}
              onClick={() => setPause(!pause)}
            />
            <span className='text-slate-400 inter-semibold text-base'>{formatTime(timeInSeconds)}</span>
          </div>

          <div className='text-slate-400 inter-medium text-base w-[110px] flex justify-center items-center'>
            Mistakes: <span className={`font-bold ${mistakes >= 3 ? 'text-red-500' : 'dark:text-white text-black'}`}>{mistakes}/3</span>
          </div>

          <div className='text-slate-400 w-[110px] flex justify-end items-center'>
            <IoSettingsOutline className='text-2xl cursor-pointer hover:rotate-[110deg] duration-300' />
          </div>
        </div>

        <div className='bg-[#324465] w-full h-[1px]' />

        <div className='flex items-stretch justify-between gap-4 mt-5 w-full h-[550px]'>
          <div className='w-full max-w-[20%] flex flex-col items-center border-2 border-[#324465] rounded-lg p-2'>
            <span className='text-base inter-regular text-slate-400'>Share with friends</span>

            <motion.button
              onClick={handleCopy}
              className='relative flex items-center justify-center gap-2 duration-200 text-slate-400 rounded w-full py-2 mt-4 border-[#324465] border-[1px] cursor-pointer hover:bg-[#324465] hover:text-white'
            >
              <motion.span
                variants={copyLinkVariants}
                initial="initial"
                animate={copied ? "hidden" : "visible"}
                exit="visible"
                className='flex items-center gap-2'
              >
                <IoIosLink className='text-xl' />
                <span className='inter-regular text-base'>Copy Link</span>
              </motion.span>

              <motion.span
                variants={checkIconVariants}
                initial="initial"
                animate={copied ? "visible" : "hidden"}
                exit="hidden"
                className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              >
                <FaCheck className='text-xl' />
              </motion.span>

            </motion.button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Game