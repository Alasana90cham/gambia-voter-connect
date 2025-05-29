
import React from 'react';
import { Card } from '@/components/ui/card';

interface CountdownTimerProps {
  title?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ title = "Registration Closes" }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto mt-6 bg-red-50 border-red-200">
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold text-red-600 mb-2">{title}</h3>
        <p className="text-red-700 font-semibold mb-4">Registration has been closed since 28th May 2025 at 11:58 PM</p>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100 mt-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">For any information, visit:</h4>
          <div className="space-y-2 text-gray-700">
            <p className="font-medium">📍 NYP Office at Westfield (behind Family Planning)</p>
            <p className="font-medium">📧 Email: nypgambia.org</p>
            <p className="font-medium">📞 Call: 3204119</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CountdownTimer;
