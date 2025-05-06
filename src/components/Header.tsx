
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary bg-white flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-secondary"></div>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">Gambia Voter Connect</h1>
            <p className="text-xs">Electoral Registration Platform</p>
          </div>
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="hover:underline font-medium">Register</Link>
            </li>
            <li>
              <Link to="/statistics" className="hover:underline font-medium">Statistics</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
