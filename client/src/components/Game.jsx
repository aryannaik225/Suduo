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


const Game = ({ puzzle, sol }) => {

  const { sessionId } = useParams()
  const [pause, setPause] = useState(false)
  const [timeInSeconds, setTimeInSeconds] = useState(0)
  const [mistakes, setMistakes] = useState(0)
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

  const toggle = () => {
    setShowTimer(!showTimer);
  };


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
      if (selectedCell === null) return;

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
              className={`text-slate-400 text-2xl cursor-pointer hover:scale-110 duration-200 ${pause ? 'hidden' : 'block'}`}
              onClick={() => setPause(!pause)}
            />
            <span className={`${showTimer ? 'opacity-100' : 'opacity-0'} text-slate-400 inter-semibold text-base`}>{formatTime(timeInSeconds)}</span>
          </div>

          <div className='text-slate-400 inter-medium text-base w-[110px] flex justify-center items-center'>
            Mistakes: <span className={`font-bold ${mistakes >= 3 ? 'text-red-500' : 'dark:text-white text-black'}`}>{mistakes}/3</span>
          </div>

          <div className='relative text-slate-400 w-[110px] flex justify-end items-center'>
            <IoSettingsOutline className='z-10 text-2xl cursor-pointer hover:rotate-[110deg] duration-300'
              onClick={() => setShowSettings(!showSettings)}
            />
            <div className={`${showSettings ? 'block' : 'hidden'} flex flex-col items-center justify-end z-0 absolute top-[-10px] right-[-10px] bg-slate-800 border-gray-700 text-base text-white rounded px-2 py-1 inter-semibold min-h-21 min-w-[200px]`}>
              <div className='flex gap-4 items-center justify-between mb-2'>
                <span>Show Timer</span>
                <button
                  onClick={toggle}
                  className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out
          ${showTimer ? "bg-green-800" : "bg-gray-400"}`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out
            ${showTimer ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>
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

            <span className='w-full text-sm text-slate-400 inter-regular text-center mt-4 text-wrap'>Share link to play together</span>
            <div className='mt-4 bg-white p-2 rounded'>
              <QRCodeCanvas value={multiplayerLink} size={128} bgColor={'#ffffff'} fgColor={'#000000'} />
            </div>
            <span className='w-full text-sm text-slate-400 inter-regular text-center mt-4 text-wrap'>Scan code to join game</span>
          </div>

          <div className='max-w-[65%] max-h-full'>
            <div className='grid grid-cols-9 w-full h-full aspect-square gap-0'>
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
                  bgColor = 'bg-[#060e22] font-bold';
                } else if (isCellWrong(idx)) {
                  bgColor = 'bg-red-400 caret-white';
                } else if (isSelected) {
                  bgColor = 'bg-[#1b2131]';
                } else {
                  bgColor = 'bg-[#020817] caret-transparent';
                }

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center aspect-square w-full h-full text-center text-lg border border-[#2e3e5a] dark:border-[#25334d] dark:text-white focus:outline-none cursor-default
                      ${isThickTop ? 'border-t-[3px] dark:border-t-[#3e434c]' : ''}
                      ${isThickLeft ? 'border-l-[3px] dark:border-l-[#3e434c]' : ''}
                      ${isThickBottom ? 'border-b-[3px] dark:border-b-[#3e434c]' : ''}
                      ${isThickRight ? 'border-r-[3px] dark:border-r-[#3e434c]' : ''}
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

          <div className='w-full h-full flex flex-col items-center justify-between gap-3'>

            <ChatBox roomId={sessionId} playersList={playersList} />

            <div className='grid grid-cols-5 w-full gap-2'>
              {[...Array(9)].map((_, i) => (
                <button
                  key={i + 1}
                  className='w-full aspect-square py-3 bg-slate-300 dark:bg-[#152237] dark:text-gray-500 text-black rounded text-xl font-semibold hover:bg-slate-400 dark:hover:bg-[#101929] duration-200 dark:hover:text-white transition'
                  onClick={() => {
                    if (selectedCell === null) return

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
                className='w-full py-3 bg-slate-300 dark:bg-[#152237] dark:text-gray-500 text-black rounded text-xl font-semibold hover:bg-slate-400 dark:hover:bg-[#101929] duration-200 dark:hover:text-white transition flex items-center justify-center'
                onClick={() => {
                  if (selectedCell === null) return

                  saveState();

                  const updatedGrid = [...userGrid];
                  updatedGrid[selectedCell] = null;

                  const updatedNotes = [...notesGrid];
                  updatedNotes[selectedCell] = new Set();

                  setUserGrid(updatedGrid);
                  setNotesGrid(updatedNotes);

                }}
              >
                <FaBackspace className='text-2xl mr-[1px]' />
              </button>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-center w-full gap-32 mt-5'>
          <button
            onClick={() => {
              if (undoStack.length === 0) return

              const prevState = undoStack[undoStack.length - 1];
              setUndoStack(prev => prev.slice(0, -1));
              setRedoStack(prev => [...prev, { userGrid: [...userGrid], notesGrid: notesGrid.map(set => new Set(set)) }]);

              setUserGrid(prevState.userGrid);
              setNotesGrid(prevState.notesGrid);
            }}
            className='flex w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-slate-300 dark:bg-transparent border-2 border-[#324465] hover:border-[#152237] dark:text-gray-500 text-black hover:bg-slate-300 dark:hover:bg-[#152237] duration-200 dark:hover:text-white transition'
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
            className='flex w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-slate-300 dark:bg-transparent border-2 border-[#324465] hover:border-[#152237] dark:text-gray-500 text-black hover:bg-slate-300 dark:hover:bg-[#152237] duration-200 dark:hover:text-white transition'
          >
            <RiArrowGoForwardLine />
          </button>

          <button
            onClick={() => setPenMode(prev => !prev)}
            className='relative flex w-16 aspect-square items-center justify-center rounded-xl text-2xl bg-slate-300 dark:bg-transparent border-2 border-[#324465] hover:border-[#152237] dark:text-gray-500 text-black hover:bg-slate-300 dark:hover:bg-[#152237] duration-200 dark:hover:text-white transition'
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