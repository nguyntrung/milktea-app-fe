import React from 'react';

const Fallback: React.FC = () => {
  return (
    <div className="flex justify-center items-center w-full h-64">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
        <img
          src="https://res.cloudinary.com/db4xiceow/image/upload/v1747460240/logo-no-background.png"
          alt="Logo"
          className="absolute top-1/2 left-1/2 w-15 h-15 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  );
};

export default Fallback;
