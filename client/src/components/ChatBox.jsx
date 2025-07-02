'use client'

import Image from 'next/image'
import Pusher from 'pusher-js'
import React, { useRef, useState, useEffect } from 'react'
import { IoSend } from 'react-icons/io5'

const ChatBox = ({ roomId, playersList = [], handleShowShare }) => {

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const [username, setUsername] = useState('')
  const [pfp, setPfp] = useState('/profile_avatars/pfp1.svg')
  const avatarMap = new Map(playersList.map(player => [player.username, player.avatar]));

  const sanitizedRoomId = roomId.replace(/\s+/g, '-');

  useEffect(() => {
    const data = localStorage.getItem('hostData') || localStorage.getItem('playerData');
    if (data) {
      const { playerUsername, hostUsername, playerPfp, hostPfp } = JSON.parse(data);
      setUsername(playerUsername || hostUsername);
      setPfp(playerPfp || hostPfp);
    }
  }, []);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(`chat-${sanitizedRoomId}`);

    channel.bind('new-message', function (data) {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [sanitizedRoomId]);

  const handleSend = async () => {
    if (!input.trim()) return;

    await fetch('/api/chat/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        pfp,
        message: input,
        roomId: sanitizedRoomId,
      }),
    });

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className='min-h-96 h-full w-full rounded border-[2px] border-[#b2bfd2] dark:border-[#324465] flex flex-col pb-3 bg-[#f1f1f2] dark:bg-[#0a162f]'>

      <div className='hidden sm:flex items-center justify-end p-3 w-full flex-wrap gap-[14px] sm:gap-3'>
        {playersList.map((player, idx) => (
          <div key={idx} className='relative group'>
            <Image
              width={30}
              height={30}
              src={avatarMap.get(player.username) || '/profile_avatars/pfp1.svg'}
              alt='profile avatar'
              className='rounded-full outline-[3px] outline-blue-400 outline-offset-2'
            />
            <span className='absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 dark:bg-gray-800 dark:text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10'>
              {player.username}
            </span>
          </div>
        ))}
      </div>

      <div className='flex sm:hidden items-center justify-between px-3'>
        <button 
          className='flex items-center text-sm py-2 px-5 text-slate-700 dark:text-slate-300 bg-slate-300 dark:bg-[#020817] rounded active:bg-[#b2bfd2] dark:active:bg-[#324465] duration-200'
          onClick={handleShowShare}
          title='Share this room with others'
        >
          Invite
        </button>
        <div className='flex sm:hidden items-center justify-end p-3 w-full gap-[14px] sm:gap-3'>
          {playersList.map((player, idx) => (
            <div key={idx} className='relative group'>
              <Image
                width={30}
                height={30}
                src={avatarMap.get(player.username) || '/profile_avatars/pfp1.svg'}
                alt='profile avatar'
                className='rounded-full outline-[3px] outline-blue-400 outline-offset-2'
              />
              <span className='absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 dark:bg-gray-800 dark:text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10'>
                {player.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className='w-full h-[1px] bg-[#b2bfd2] dark:bg-[#324465]' />

      {/* Messages */}
      <div className='flex justify-start overflow-y-scroll p-3 no-scrollbar flex-col w-full flex-1'>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex mb-3 ${msg.username === username ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-center gap-2 ${msg.username === username ? 'flex-row-reverse' : ''}`}>
              <Image
                width={30}
                height={30}
                src={avatarMap.get(msg.username) || '/profile_avatars/pfp1.svg'}
                alt="pfp"
                className="rounded-full"
              />
              <div className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                <span className='text-xs text-slate-700 dark:text-slate-400'>{msg.username}</span>
                <span className='text-sm text-black dark:text-white bg-[#dcdde2] dark:bg-[#182642] px-3 py-1 rounded-lg max-w-[200px] break-words'>{msg.message}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className='flex gap-2 px-3 pt-3'>
        <input
          type="text"
          placeholder="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 bg-[#d7dae0] dark:bg-[#152237] text-[#1f1f1f] dark:text-white px-3 py-2 rounded-lg outline-none border border-[#b2bfd2] dark:border-[#324465] placeholder:text-slate-500 dark:placeholder:text-slate-400 text-[15px]"
        />
        <button
          onClick={handleSend}
          className='bg-[#d7dae0] dark:bg-[#324465] text-white px-4 rounded-lg active:bg-[#b2f2d2] sm:active:bg-[#d7dae0] hover:bg-[#b2bfd2] dark:active:bg-[#415a89] dark:hover:bg-[#415a89] sm:dark:active:bg-[#324465] duration-200 flex items-center justify-center'
        >
          <IoSend className="text-xl" />
        </button>
      </div>
    </div>
  )
}

export default ChatBox