import React from 'react'
import '@theme-toggles/react/css/Around.css'
import { Around } from '@theme-toggles/react'
import Image from 'next/image'

const NavBar = ({theme, setTheme}) => {
  // things i need on the navbar-> logo, theme toggle... yeah ig thats it. 
  // using chatgpt to generate the logo. need to look into cool theme toggle button animations

  const isDark = theme === 'light';

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }

  return (
    <div className='flex justify-center mt-5 mb-5'>
      <div className='flex items-center justify-between w-11/12 sm:w-8/12'>
        <div>
          <Image 
            src={theme === 'dark' ? '/suduo_logo.svg' : '/suduo_logo-light.svg'}
            alt="Suduo Logo"
            width={90}
            height={90}
            className='cursor-pointer'
            onClick={() => window.location.href = '/'}
          />
        </div>
        <div className='text-2xl'>
          <Around toggled={isDark} toggle={toggleTheme} />
        </div>
      </div>
    </div>
  )
}

export default NavBar