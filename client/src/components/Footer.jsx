import React from 'react';

const Footer = () => {
  const handleAuthorClick = () => {
    window.open('https://www.github.com/aryannaik225', '_blank');
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 text-center p-4 bg-transparent">
      <p className="text-white text-sm inter-medium opacity-75 hover:opacity-100 transition">
        Built for puzzle lovers ❤️ By{' '}
        <span
          onClick={handleAuthorClick}
          className="cursor-pointer"
        >
          Aryan Naik
        </span>
      </p>
    </div>
  );
};

export default Footer;