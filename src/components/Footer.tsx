
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 mt-10 py-6 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} Gambia Voter Connect</p>
          </div>
          <div className="text-sm text-gray-600">
            <p>Official Voter Registration Platform</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
