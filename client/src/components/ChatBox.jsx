'use client'

import Image from 'next/image'
import Pusher from 'pusher-js'
import React, { useRef, useState, useEffect } from 'react'
import { IoSend } from 'react-icons/io5'

const ChatBox = ({ roomId }) => {

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const username = 'Aryan'
  const pfp = '/profile_avatars/pfp1.svg'

  const sanitizedRoomId = roomId.replace(/\s+/g, '-');

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
    <div className='h-full w-full rounded border-[2px] border-[#324465] flex flex-col pb-3 bg-[#0a162f]'>

      <div className='flex items-center justify-end p-3 w-full flex-wrap gap-3'>
        <div className='relative group'>
          <Image
            width={30}
            height={30}
            src='/profile_avatars/pfp1.svg'
            alt='profile avatar'
            className='rounded-full outline-[3px] outline-blue-400 outline-offset-2'
          />
          <span className='absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10'>
            Aryan
          </span>
        </div>
      </div>

      <div className='w-full h-[1px] bg-[#324465]' />

      {/* Messages */}
      <div className='flex justify-start overflow-y-scroll h-full max-h-[280px] p-3 no-scrollbar flex-col w-full'>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex mb-3 ${msg.username === username ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-center gap-2 ${msg.username === username ? 'flex-row-reverse' : ''}`}>
              <Image
                width={30}
                height={30}
                src={msg.pfp}
                alt="pfp"
                className="rounded-full"
              />
              <div className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                <span className='text-xs text-slate-400'>{msg.username}</span>
                <span className='text-sm text-white bg-[#182642] px-3 py-1 rounded-lg max-w-[200px] break-words'>{msg.message}</span>
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
          className="flex-1 bg-[#152237] text-white px-3 py-2 rounded-lg outline-none border border-[#324465] placeholder:text-slate-400 text-[15px]"
        />
        <button
          onClick={handleSend}
          className='bg-[#324465] text-white px-4 rounded-lg hover:bg-[#415a89] duration-200 flex items-center justify-center'
        >
          <IoSend className="text-xl" />
        </button>
      </div>
    </div>
  )
}

export default ChatBox