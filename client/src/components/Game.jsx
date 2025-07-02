'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FaRegCirclePlay, FaRegCirclePause, FaCheck } from 'react-icons/fa6'
import { IoSettingsOutline } from 'react-icons/io5'
import { IoIosLink } from 'react-icons/io'
import { FaBackspace } from 'react-icons/fa'
import { RiArrowGoBackLine, RiArrowGoForwardLine } from 'react-icons/ri'
import { LuPencilLine } from 'react-icons/lu'
import copy from 'copy-to-clipboard'
import { motion, AnimatePresence } from 'motion/react'
import { QRCodeCanvas } from 'qrcode.react'
import ChatBox from './ChatBox'
import { createSession, deleteSession, subscribeToSession, updateSession, getSessionData } from '@/firebase/firestoreUtils'
import { useParams, useRouter } from 'next/navigation'
import isEqual from 'lodash/isEqual';
import { toast } from 'react-toastify'
import DecryptedText from './ui/DecryptedText'
import ReactConfetti from 'react-confetti'
import GradientText from './ui/GradientText'
import { set } from 'lodash'
import axios from 'axios'


const Game = ({ puzzle, sol }) => {

  const { sessionId } = useParams()
  const [pause, setPause] = useState(false)
  const [timeInSeconds, setTimeInSeconds] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [failed, setFailed] = useState(false)
  const [initialGrid, setInitialGrid] = useState(Array(81).fill(null));
  const [solution, setSolution] = useState(Array(81).fill(null));
  const [userGrid, setUserGrid] = useState(Array(81).fill(null))
  const [selectedCell, setSelectedCell] = useState(null)
  const [notesGrid, setNotesGrid] = useState(Array(81).fill(new Set()))
  const [isNoteMode, setIsNoteMode] = useState(false)
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [penMode, setPenMode] = useState(false)
  const router = useRouter()
  const [showTimer, setShowTimer] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [won, setWon] = useState(false)
  const confettiRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [showOptions, setShowOptions] = useState(false)
  const [showOptionsFailed, setShowOptionsFailed] = useState(false)
  const buttonRef = useRef(null)
  const buttonRefFailed = useRef(null)
  const [buttonWidth, setButtonWidth] = useState(0)
  const [buttonWidthFailed, setButtonWidthFailed] = useState(0)
  const difficulties = ["Easy", "Medium", "Hard", "Insane", "Inhuman"];
  const [loading, setLoading] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState('Easy')
  const [showShare, setShowShare] = useState(false)

  // ---------------- Random Logic ---------------

  const toggle = () => {
    setShowTimer(!showTimer);
  };

  useEffect(() => {
    if (!sessionId) return

    if (mistakes === 3) {
      setFailed(true)
      setPause(true)
    }
  }, [mistakes])

  const handleSecondChange = () => {
    setMistakes(0)
    setFailed(false)
    setPause(false)
  }

  useEffect(() => {
    if (confettiRef.current) {
      const { offsetWidth, offsetHeight } = confettiRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
    }
  }, [won])

  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [won, showOptions]);

  useEffect(() => {
    if (buttonRefFailed.current) {
      setButtonWidthFailed(buttonRefFailed.current.offsetWidth);
    }
  }, [failed, showOptionsFailed]);

  const handleShowShare = () => {
    setShowShare(true)
  }


  // ---------------- Player Logic ---------------

  const [playersList, setPlayersList] = useState([])
  const [playerId, setPlayerId] = useState('') // This will be the player id of the current user

  useEffect(() => {
    const hostDataa = localStorage.getItem('hostData')
    if (hostDataa) {
      const { hostId } = JSON.parse(hostDataa)
      if (hostId) {
        setPlayerId(hostId)
        return
      }
    }

    const playerDataa = localStorage.getItem('playerData')
    if (playerDataa) {
      const { playerId } = JSON.parse(playerDataa)
      if (playerId) {
        setPlayerId(playerId)
      }
    }

  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const hostData = localStorage.getItem('hostData')
      const playerData = localStorage.getItem('playerData')

      if (!hostData && !playerData && sessionId) {
        const redirectUrl = `${window.location.origin}/game/${sessionId}/inputTaker`;
        router.replace(redirectUrl)
      }
    }, 300);

    return () => clearTimeout(timeout)
  }, [sessionId])


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

  // ---------------- Sudoku Logic ---------------

  const saveState = () => {
    setUndoStack(prev => [...prev, { userGrid: [...userGrid], notesGrid: notesGrid.map(set => new Set(set)) }]);
    setRedoStack([]);
  };

  const isCellWrong = (idx) => {
    if (userGrid[idx] === null) return false;
    return userGrid[idx] !== solution[idx];
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (pause || selectedCell === null) return;

      const row = Math.floor(selectedCell / 9);
      const col = selectedCell % 9;

      const moveTo = (newRow, newCol) => {
        let newIdx = newRow * 9 + newCol;
        if (initialGrid[newIdx] === null) {
          setSelectedCell(newIdx);
        } else {
          // Try to find next editable cell
          setSelectedCell(findNextEditable(newRow, newCol));
        }
      };

      const findNextEditable = (startRow, startCol, dirRow = 0, dirCol = 1) => {
        let r = startRow;
        let c = startCol;
        while (true) {
          c += dirCol;
          r += dirRow;

          if (c >= 9) { c = 0; r++; }
          if (c < 0) { c = 8; r--; }
          if (r >= 9) r = 0;
          if (r < 0) r = 8;

          const idx = r * 9 + c;
          if (initialGrid[idx] === null) return idx;
          if (r === startRow && c === startCol) return selectedCell;
        }
      };

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'Tab':
          e.preventDefault();
          break
      }

      switch (e.key) {
        case 'ArrowUp':
          moveTo((row - 1 + 9) % 9, col);
          break;
        case 'ArrowDown':
          moveTo((row + 1) % 9, col);
          break;
        case 'ArrowLeft':
          moveTo(row, (col - 1 + 9) % 9);
          break;
        case 'ArrowRight':
          moveTo(row, (col + 1) % 9);
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            moveTo(row, (col - 1 + 9) % 9);
          } else {
            moveTo(row, (col + 1) % 9);
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (initialGrid[selectedCell] === null) {
            const updatedGrid = [...userGrid];
            updatedGrid[selectedCell] = null;
            setUserGrid(updatedGrid);
          }
          break;
        case 'Escape':
          setSelectedCell(null);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, userGrid, initialGrid]);


  // ---------------- Firebase Logic ---------------

  const multiplayerLink = typeof window !== 'undefined' ? `${window.location.origin}/game/${sessionId}/inputTaker` : ''
  const debounceRef = useRef(null)
  const lastSessionSnapshot = useRef(null)
  const prevPlayersRef = useRef([])


  useEffect(() => {

    if (!sessionId) return

    const unsubscribe = subscribeToSession(sessionId, (data) => {
      if (!data || data.lastUpdatedBy === playerId) return;

      const prev = lastSessionSnapshot.current;

      const hasGridChanged =
        !isEqual(prev?.userGrid, data.userGrid) ||
        !isEqual(prev?.notesGrid, data.notesGrid) ||
        prev?.mistakes !== data.mistakes ||
        prev?.pause !== data.pause;

      const currentPlayers = data.players || []
      const previousPlayers = prevPlayersRef.current || []

      const previousIds = new Set(previousPlayers.map(p => p.id));
      const currentIds = new Set(currentPlayers.map(p => p.id));

      const newPlayers = currentPlayers.filter(p => !previousIds.has(p.id));

      newPlayers.forEach(p => {
        if (p.id !== playerId) {
          toast(`${p.username} joined the game! 🎉`, {
            position: 'bottom-right',
            autoClose: 3000,
            pauseOnHover: true,
            theme: 'dark',
            style: {
              backgroundColor: '#1b2131',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '10px 15px',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif'
            },
            progressStyle: {
              backgroundColor: '#4ade80'
            }
          });
        }
      });

      prevPlayersRef.current = currentPlayers
      setPlayersList(currentPlayers)

      if (!hasGridChanged) {
        lastSessionSnapshot.current = data;
        return;
      }

      lastSessionSnapshot.current = data;

      setInitialGrid(data.initialGrid);
      setSolution(data.solution);
      setUserGrid(data.userGrid);
      setNotesGrid(
        Array(81).fill().map((_, idx) => new Set(data.notesGrid?.[idx] || []))
      );
      setMistakes(data.mistakes);
      setPause(data.pause);
      setFailed(data.failed)
      setUndoStack(
        (data.undoStack || []).map(entry => ({
          userGrid: entry.userGrid,
          notesGrid: Array(81).fill().map((_, idx) => new Set(entry.notesGrid?.[idx] || []))
        }))
      );
      setRedoStack(
        (data.redoStack || []).map(entry => ({
          userGrid: entry.userGrid,
          notesGrid: Array(81).fill().map((_, idx) => new Set(entry.notesGrid?.[idx] || []))
        }))
      );
      setPlayersList(data.players || []);
    });


    return () => {
      unsubscribe()
    }

  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateSession(sessionId, {
        userGrid: userGrid,
        notesGrid: Object.fromEntries(
          notesGrid.map((set, idx) => [idx, Array.from(set)])
        ),
        mistakes: mistakes,
        pause: pause,
        failed: failed,
        undoStack: undoStack.map(entry => ({
          userGrid: entry.userGrid,
          notesGrid: Object.fromEntries(
            entry.notesGrid.map((set, idx) => [idx, Array.from(set)])
          )
        })),
        redoStack: redoStack.map(entry => ({
          userGrid: entry.userGrid,
          notesGrid: Object.fromEntries(
            entry.notesGrid.map((set, idx) => [idx, Array.from(set)])
          )
        })),
        lastUpdatedBy: playerId,
      })
    }, 500)

  }, [userGrid, notesGrid, mistakes, pause, undoStack, redoStack, sessionId])

  // ---------------- Players Leave Logic ---------------

  const cleanupBeforeUnload = () => {
    const playerData = localStorage.getItem('playerData');
    const hostData = localStorage.getItem('hostData');
    const leavingPlayerId = playerData ? JSON.parse(playerData).playerId : hostData ? JSON.parse(hostData).hostId : null;

    if (!leavingPlayerId || !sessionId) return;

    const blob = new Blob(
      [JSON.stringify({ sessionId, playerId: leavingPlayerId })],
      { type: 'application/json' }
    )

    navigator.sendBeacon('/api/leave-session', blob);
  }

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      cleanupBeforeUnload();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId]);

  // ---------------- Game Win Logic ---------------

  useEffect(() => {
    const hasUserWon = initialGrid.every((cell, idx) => {
      if (cell !== null) return true

      return userGrid[idx] !== null && userGrid[idx] === solution[idx]
    })

    if (hasUserWon) {
      setWon(true)
      setPause(true)
    }
  })


  // ---------------- New Game Logic ---------------

  const handleNewGame = async () => {

    setLoading(true)

    try {

      const res = await axios.get(`/api/generate-sudoku?difficulty=${selectedDifficulty}`);
      const { puzzle, solution, difficultyRating } = res.data;
      if (!puzzle || !solution) {
        throw new Error('Failed to generate puzzle');
      }

      const flattenedPuzzle = puzzle.flat();
      const flattenedSolution = solution.flat();

      setInitialGrid(flattenedPuzzle);
      setSolution(flattenedSolution);
      setUserGrid(Array(81).fill(null));
      setNotesGrid(Array(81).fill(new Set()));
      setMistakes(0);
      setFailed(false);
      setWon(false);
      setPause(false);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedCell(null);
      setTimeInSeconds(0);
      setShowOptions(false);
      setShowOptionsFailed(false);

      await updateSession(sessionId, {
        initialGrid: flattenedPuzzle,
        solution: flattenedSolution,
        userGrid: Array(81).fill(null),
        notesGrid: Object.fromEntries(Array(81).fill().map((_, idx) => [idx, []])),
        mistakes: 0,
        pause: false,
        failed: false,
        undoStack: [],
        redoStack: [],
        lastUpdatedBy: playerId
      });

    } catch (error) {
      console.error("Error creating new game:", error);
      toast.error('Failed to create new game. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
        pauseOnHover: true,
        theme: 'dark'
      });
      setLoading(false);
    }
  }



  return (
    <div className='flex justify-center sm:mb-1 h-auto px-0 sm:px-4'>

      {showShare && (
        <div
          className='fixed inset-0 bg-black/50 flex justify-center items-center z-50'
          onClick={(e) => e.target === e.currentTarget && setShowShare(false)}
        >
          <div className='w-full mx-5 max-w-[500px] flex flex-col items-center border-2 border-[#b2bfd2] dark:border-[#324465] rounded px-3 py-5 bg-white dark:bg-[#101929] shadow-lg'>
            <span className='text-2xl inter-bold text-slate-500 dark:text-white'>Share with friends</span>

            <motion.button
              onClick={handleCopy}
              className='relative flex items-center justify-center gap-2 duration-200 text-slate-500 dark:text-slate-400 rounded w-full py-2 mt-4 border-[#b2bfd2] dark:border-[#324465] border-[1px] cursor-pointer active:bg-slate-300 dark:active:bg-[#324465] active:text-black dark:active:text-white transition'
            >
              <motion.span
                variants={copyLinkVariants}
                initial="initial"
                animate={copied ? "hidden" : "visible"}
                exit="visible"
                className='flex items-center gap-2'
              >
                <IoIosLink />
                <span className='inter-regular text-base'>Copy Link</span>
              </motion.span>

              <motion.span
                variants={checkIconVariants}
                initial="initial"
                animate={copied ? "visible" : "hidden"}
                exit="hidden"
                className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              >
                <FaCheck />
              </motion.span>
            </motion.button>

            <span className='w-full text-sm text-slate-500 dark:text-slate-400 inter-regular text-center mt-4 text-wrap'>Share link to play together</span>
            <div className='mt-4 bg-white p-2 rounded'>
              <QRCodeCanvas value={multiplayerLink} size={128} bgColor={'#ffffff'} fgColor={'#000000'} />
            </div>
            <span className='w-full text-sm text-slate-500 dark:text-slate-400 inter-regular text-center mt-4 text-wrap'>Scan code to join game</span>
          </div>
        </div>
      )}

      {/* {won && <ReactConfetti width={window.innerWidth} height={window.innerHeight}/>} */}
      <div className='w-full max-w-[1228px] rounded-2xl border-0 lg:border-[3px] border-[#e0e5ee] dark:border-[#324465] flex flex-col items-center p-5 lg:shadow-[0_0_30px_rgba(127,205,255,0.6)] lg:dark:shadow-[0_0_30px_rgba(0,255,255,0.2)] bg-[#FFFADC] sm:bg-white dark:bg-transparent'>
        <div className='flex items-center justify-between w-full mb-3'>
          <div className='flex gap-2 items-center text-lg w-[110px] justify-start'>
            <FaRegCirclePlay
              className={`text-slate-500 dark:text-slate-400 text-lg sm:text-2xl ${failed ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-110 sm:active:scale-100 hover:scale-110'} duration-200 ${pause ? 'block' : 'hidden'}`}
              onClick={() => {
                if (failed) return
                setPause(!pause)
              }}
            />
            <FaRegCirclePause
              className={`text-slate-500 dark:text-slate-400 text-lg sm:text-2xl cursor-pointer active-scale-110 sm:active:scale-100 hover:scale-110 duration-200 ${pause ? 'hidden' : 'block'}`}
              onClick={() => {
                if (failed) return
                setPause(!pause)
              }}
            />
            <span className={`${showTimer ? 'opacity-100' : 'opacity-0'} text-slate-500 dark:text-slate-400 inter-semibold text-sm sm:text-base`}>{formatTime(timeInSeconds)}</span>
          </div>

          <div className='text-slate-500 dark:text-slate-400 inter-medium text-sm sm:text-base w-[110px] flex justify-center items-center'>
            Mistakes: <span className={`font-bold ${mistakes >= 3 ? 'text-red-500' : 'dark:text-white text-black'}`}>{mistakes}/3</span>
          </div>

          <div className='relative text-slate-500 dark:text-slate-400 w-[110px] flex justify-end items-center z-40'>
            <IoSettingsOutline className='z-10 text-2xl cursor-pointer active:rotate-[300deg] hover:rotate-[110deg] duration-300'
              onClick={() => setShowSettings(!showSettings)}
            />
            <div className={`${showSettings ? 'block' : 'hidden'} flex flex-col items-center justify-end z-0 absolute top-[-10px] right-[-10px] bg-slate-100 dark:bg-slate-800 border-[0.5px] border-[#e9edf3] dark:border-gray-700 text-base text-slate-500 dark:text-slate-400 rounded px-2 py-1 inter-semibold min-h-21 min-w-[200px]`}>
              <div className='flex gap-4 items-center justify-between mb-2'>
                <button
                  onClick={toggle}
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out
          ${showTimer ? "bg-green-400 dark:bg-green-800" : "bg-gray-400"}`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out
            ${showTimer ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
                <span>Show Timer</span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-[#e9edf3] dark:bg-[#324465] w-full h-0.5 dark:h-[1px]' />

        <div className='flex flex-col lg:flex-row items-stretch justify-between gap-4 mt-5 w-full flex-grow'>
          <div className='hidden w-full max-w-[20%] xl:flex flex-col items-center border-2 border-[#b2bfd2] dark:border-[#324465] rounded-lg p-2'>
            <span className='text-base inter-regular text-slate-500 dark:text-slate-400'>Share with friends</span>

            <motion.button
              onClick={handleCopy}
              className='relative flex items-center justify-center gap-2 duration-200 text-slate-500 dark:text-slate-400 rounded w-full py-2 mt-4 border-[#b2bfd2] dark:border-[#324465] border-[1px] cursor-pointer hover:bg-slate-300 dark:hover:bg-[#324465] hover:text-black dark:hover:text-white transition'
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

            <span className='w-full text-sm text-slate-500 dark:text-slate-400 inter-regular text-center mt-4 text-wrap'>Share link to play together</span>
            <div className='mt-4 bg-white p-2 rounded'>
              <QRCodeCanvas value={multiplayerLink} size={128} bgColor={'#ffffff'} fgColor={'#000000'} />
            </div>
            <span className='w-full text-sm text-slate-500 dark:text-slate-400 inter-regular text-center mt-4 text-wrap'>Scan code to join game</span>
          </div>

          <div className='w-full lg:max-w-[65%] max-h-full' ref={confettiRef}>
            <div className='relative h-full w-full'>

              {won && (
                <div className='absolute inset-0 z-20 bg-[#596a84] dark:bg-[#31425d] flex flex-col gap-5 items-center justify-center'>
                  <ReactConfetti width={dimensions.width} height={dimensions.height} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className=''
                  >
                    <GradientText
                      colors={["#ff4d4f", "#ffc53d", "#40a9ff", "#73d13d", "#ffc53d"]}
                      animationSpeed={5}
                      showBorder={false}
                      className='text-6xl sm:text-7xl inter-bold'
                    >
                      gg
                    </GradientText>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: 'easeInOut' }}
                    className='text-xl sm:text-3xl text-white inter-semibold'
                  >
                    You solved the puzzle!!🎉
                  </motion.div>
                  <div className='relative inline-block'>
                    <motion.button
                      ref={buttonRef}
                      onClick={() => setShowOptions((prev) => !prev)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6, ease: 'easeInOut' }}
                      className='py-2 px-4 bg-white text-[#31425d] rounded-md inter-medium text-base active:bg-gray-300 dark:active:bg-[#465267] hover:bg-gray-300 dark:hover:bg-[#465267] dark:hover:text-white transition duration-200'
                    >
                      New Game
                    </motion.button>
                    {showOptions && (
                      <ul
                        className="absolute mt-2 bg-white dark:bg-[#101929] text-[#31425d] dark:text-white rounded-md shadow-md overflow-hidden z-10"
                        style={{ width: `${buttonWidth}px` }}
                      >
                        {difficulties.map((level) => (
                          <li
                            key={level}
                            className="px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-[#465267] cursor-pointer transition duration-150"
                            onClick={() => {
                              setSelectedDifficulty(level);
                              setShowOptions(false);
                              handleNewGame();
                              console.log("Selected difficulty:", level);
                            }}
                          >
                            {level}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                </div>
              )}

              {pause && !failed && !won && (
                <div className='absolute inset-0 z-20 dark:bg-black/70 bg-gray-300 flex items-center justify-center rounded-xl'>
                  <FaRegCirclePlay onClick={() => { setPause(!pause) }} className='text-8xl text-slate-500 dark:text-slate-400 cursor-pointer' />
                </div>
              )}

              {failed && (
                <div className='absolute inset-0 z-20 dark:bg-[#31425d] bg-slate-300 flex flex-col items-center justify-center'>
                  <DecryptedText
                    text="Game Over!"
                    speed={100}
                    maxIterations={100}
                    animateOn='view'
                    revealDirection='start'
                    sequential={true}
                    className='text-4xl dark:text-white text-[#101010] inter-semibold mb-2'
                  />

                  <div className='relative flex mt-5 mb-5' onClick={handleSecondChange}>
                    <div className='absolute inset-0 flex items-center justify-center z-0'>
                      <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className='h-full w-[80%] rounded-lg bg-slate-700 dark:bg-white opacity-10 duration-200'
                      ></motion.div>
                    </div>

                    <div className='relative flex items-center justify-center py-[10px] px-3 bg-slate-500 dark:bg-white rounded-md text-white dark:text-[#31425d] inter-medium cursor-pointer active:bg-gray-300 hover:bg-gray-300 z-10'>
                      Second Chance
                    </div>
                  </div>

                  <div className='relative inline-block'>
                    <button
                      ref={buttonRefFailed}
                      onClick={() => setShowOptionsFailed((prev) => !prev)}
                      className='py-2 px-4 bg-white text-[#31425d] rounded-md inter-medium text-base active:bg-gray-300 dark:active:bg-[#465267] hover:bg-gray-300 dark:hover:bg-[#465267] dark:hover:text-white transition duration-200'
                    >
                      New Game
                    </button>
                    {showOptionsFailed && (
                      <ul
                        className="absolute mt-2 bg-white dark:bg-[#101929] text-[#31425d] dark:text-white rounded-md shadow-md overflow-hidden z-10"
                        style={{ width: `${buttonWidthFailed}px` }}
                      >
                        {difficulties.map((level) => (
                          <li
                            key={level}
                            className="px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-[#465267] cursor-pointer transition duration-150"
                            onClick={() => {
                              setSelectedDifficulty(level);
                              setShowOptionsFailed(false);
                              handleNewGame();
                              console.log("Selected difficulty:", level);
                            }}
                          >
                            {level}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                </div>
              )}


              <div className={`grid grid-cols-9 w-full h-full aspect-square gap-0 transition-opacity duration-300 ${pause ? 'opacity-0' : 'opacity-100'}`}>
                {initialGrid.map((cell, idx) => {
                  const rowIndex = Math.floor(idx / 9)
                  const colIndex = idx % 9
                  const isThickTop = rowIndex % 3 === 0
                  const isThickLeft = colIndex % 3 === 0
                  const isThickBottom = rowIndex === 8
                  const isThickRight = colIndex === 8

                  const cellValue = cell ?? userGrid[idx]
                  const isEditable = cell === null

                  const isSelected = selectedCell === idx

                  let bgColor = ''
                  if (!isEditable) {
                    bgColor = 'bg-[#f1f1f2] dark:bg-[#060e22] font-bold';
                  } else if (isCellWrong(idx)) {
                    bgColor = 'bg-red-400 caret-white';
                  } else if (isSelected) {
                    bgColor = 'bg-[#c8d8fa] dark:bg-[#1b2131]';
                  } else {
                    bgColor = 'bg-white dark:bg-black sm:dark:bg-[#020817] caret-transparent';
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-center aspect-square w-full h-full text-center text-lg border border-[#a0b1c8] dark:border-[#25334d] dark:text-white focus:outline-none cursor-default
                        ${isThickTop ? 'border-t-[3px] dark:border-t-[#3e434c] border-t-[#a0b1c8] ' : ''}
                        ${isThickLeft ? 'border-l-[3px] dark:border-l-[#3e434c] border-l-[#a0b1c8]' : ''}
                        ${isThickBottom ? 'border-b-[3px] dark:border-b-[#3e434c] border-b-[#a0b1c8] ' : ''}
                        ${isThickRight ? 'border-r-[3px] dark:border-r-[#3e434c] border-r-[#a0b1c8] ' : ''}
                        ${bgColor}`}
                      onClick={() => {
                        if (!isEditable) return
                        setSelectedCell(selectedCell === idx ? null : idx)
                      }}
                    >
                      {cellValue ? (
                        <span className="text-xl">{cellValue}</span>
                      ) : (
                        <div className="flex flex-wrap justify-center text-[10px] leading-3 text-gray-400 min-h-[36px] w-full">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <span key={n} className={`w-1/3 text-center ${notesGrid[idx]?.has(n) ? '' : 'opacity-0'}`}>
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className='w-full h-full flex flex-col items-center flex-grow gap-3'>

            <div className='w-full h-full order-2 lg:order-none flex flex-col'>
              <ChatBox roomId={sessionId} playersList={playersList} handleShowShare={handleShowShare} />
            </div>

            <div className='flex lg:hidden order-1 items-center justify-center w-full gap-7 mt-1 mb-5'>
              <button
                onClick={() => {
                  if (undoStack.length === 0) return

                  const prevState = undoStack[undoStack.length - 1];
                  setUndoStack(prev => prev.slice(0, -1));
                  setRedoStack(prev => [...prev, { userGrid: [...userGrid], notesGrid: notesGrid.map(set => new Set(set)) }]);

                  setUserGrid(prevState.userGrid);
                  setNotesGrid(prevState.notesGrid);
                }}
                className={`flex w-12 md:w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-[#f1f5f9] dark:bg-transparent border-2 border-[#324465] dark:text-gray-500 text-black ${pause ? '' : 'active:border-[#152237] active:bg-slate-300 dark:active:bg-[#152237] duration-200 dark:active:text-white transition'}`}
              >
                <RiArrowGoBackLine />
              </button>

              <button
                onClick={() => {
                  if (redoStack.length === 0) return

                  const nextState = redoStack[redoStack.length - 1];
                  setRedoStack(prev => prev.slice(0, -1));
                  setUndoStack(prev => [...prev, { userGrid: [...userGrid], notesGrid: notesGrid.map(set => new Set(set)) }]);

                  setUserGrid(nextState.userGrid);
                  setNotesGrid(nextState.notesGrid);
                }}
                className={`flex w-12 md:w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-[#f1f5f9] dark:bg-transparent border-2 border-[#324465] dark:text-gray-500 text-black ${pause ? '' : 'active:border-[#152237] active:bg-slate-300 dark:active:bg-[#152237] duration-200 dark:active:text-white transition'}`}
              >
                <RiArrowGoForwardLine />
              </button>

              <button
                onClick={() => setPenMode(prev => !prev)}
                className='relative flex w-12 md:w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-[#f1f5f9] dark:bg-transparent border-2 border-[#324465] active:border-[#152237] dark:text-gray-500 text-black active:bg-slate-300 dark:active:bg-[#152237] duration-200 dark:active:text-white transition'
              >
                <div className={`absolute top-[-10px] right-[-10px] bg-gray-600 ${penMode ? 'text-green-300' : 'text-slate-300'} text-xs rounded-full px-2 py-1 inter-semibold`}>
                  {penMode ? 'On' : 'Off'}
                </div>
                <LuPencilLine />
              </button>

              <button
                onClick={() => {
                  if (pause || selectedCell === null) return

                  saveState();

                  const updatedGrid = [...userGrid];
                  updatedGrid[selectedCell] = null;

                  const updatedNotes = [...notesGrid];
                  updatedNotes[selectedCell] = new Set();

                  setUserGrid(updatedGrid);
                  setNotesGrid(updatedNotes);
                }}
                className={`flex w-12 md:w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-[#f1f5f9] dark:bg-transparent border-2 border-[#324465] dark:text-gray-500 text-black ${pause ? '' : 'active:border-[#152237] active:bg-slate-300 dark:active:bg-[#152237] duration-200 dark:active:text-white transition'}`}
              >
                <FaBackspace className='text-lg sm:text-2xl mr-[1px]' />
              </button>
            </div>

            <div className='grid grid-cols-9 lg:grid-cols-5 w-full gap-1 sm:gap-2'>
              {[...Array(9)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`w-full aspect-square p-1 lg:py-3 bg-slate-300 dark:bg-[#020817] lg:dark:bg-[#152237] dark:text-gray-200 lg:dark:text-gray-500 border-[1px] lg:border-0 border-slate-700 text-black rounded text-base lg:text-xl font-semibold ${pause ? '' : 'active:bg-slate-400 hover:bg-slate-400 dark:active:bg-[#101929] dark:hover:bg-[#101929] duration-200 dark:active:text-white dark:hover:text-white transition'}`}
                  onClick={() => {
                    if (pause || selectedCell === null) return

                    saveState();

                    if (penMode) {
                      const updatedNotes = [...notesGrid];
                      const currentNotes = new Set(updatedNotes[selectedCell]);

                      const newNotes = new Set(currentNotes);
                      if (newNotes.has(i + 1)) {
                        newNotes.delete(i + 1);
                      } else {
                        newNotes.add(i + 1);
                      }

                      updatedNotes[selectedCell] = newNotes;
                      setNotesGrid(updatedNotes);
                    } else {
                      const updatedGrid = [...userGrid];
                      updatedGrid[selectedCell] = i + 1;

                      if (i + 1 !== solution[selectedCell]) {
                        setMistakes(prev => prev + 1);
                      }

                      setUserGrid(updatedGrid);

                    }
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className={`w-full p-1 lg:py-3 bg-slate-300 dark:bg-[#020817] lg:dark:bg-[#152237] dark:text-gray-200 lg:dark:text-gray-500 border-[1px] lg:border-0 border-slate-700 text-black rounded text-sm lg:text-xl font-semibold ${pause ? '' : 'hover:bg-slate-400 dark:hover:bg-[#101929] duration-200 dark:hover:text-white transition'} hidden lg:flex items-center justify-center`}
                onClick={() => {
                  if (pause || selectedCell === null) return

                  saveState();

                  const updatedGrid = [...userGrid];
                  updatedGrid[selectedCell] = null;

                  const updatedNotes = [...notesGrid];
                  updatedNotes[selectedCell] = new Set();

                  setUserGrid(updatedGrid);
                  setNotesGrid(updatedNotes);

                }}
              >
                <FaBackspace className='text-lg sm:text-2xl mr-[1px]' />
              </button>
            </div>
          </div>
        </div>

        <div className='hidden lg:flex items-center justify-center w-full gap-32 mt-5'>
          <button
            onClick={() => {
              if (undoStack.length === 0) return

              const prevState = undoStack[undoStack.length - 1];
              setUndoStack(prev => prev.slice(0, -1));
              setRedoStack(prev => [...prev, { userGrid: [...userGrid], notesGrid: notesGrid.map(set => new Set(set)) }]);

              setUserGrid(prevState.userGrid);
              setNotesGrid(prevState.notesGrid);
            }}
            className={`flex w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-[#f1f5f9] dark:bg-transparent border-2 border-[#324465] dark:text-gray-500 text-black ${pause ? '' : 'hover:border-[#152237] hover:bg-slate-300 dark:hover:bg-[#152237] duration-200 dark:hover:text-white transition'}`}
          >
            <RiArrowGoBackLine />
          </button>

          <button
            onClick={() => {
              if (redoStack.length === 0) return

              const nextState = redoStack[redoStack.length - 1];
              setRedoStack(prev => prev.slice(0, -1));
              setUndoStack(prev => [...prev, { userGrid: [...userGrid], notesGrid: notesGrid.map(set => new Set(set)) }]);

              setUserGrid(nextState.userGrid);
              setNotesGrid(nextState.notesGrid);
            }}
            className={`flex w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-[#f1f5f9] dark:bg-transparent border-2 border-[#324465] dark:text-gray-500 text-black ${pause ? '' : 'hover:border-[#152237] hover:bg-slate-300 dark:hover:bg-[#152237] duration-200 dark:hover:text-white transition'}`}
          >
            <RiArrowGoForwardLine />
          </button>

          <button
            onClick={() => setPenMode(prev => !prev)}
            className='relative flex w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-[#f1f5f9] dark:bg-transparent border-2 border-[#324465] hover:border-[#152237] dark:text-gray-500 text-black hover:bg-slate-300 dark:hover:bg-[#152237] duration-200 dark:hover:text-white transition'
          >
            <div className={`absolute top-[-10px] right-[-10px] bg-gray-600 ${penMode ? 'text-green-300' : 'text-slate-300'} text-xs rounded-full px-2 py-1 inter-semibold`}>
              {penMode ? 'On' : 'Off'}
            </div>
            <LuPencilLine />
          </button>
        </div>

      </div>
    </div>
  )
}

export default Game