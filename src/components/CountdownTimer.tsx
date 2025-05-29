
import React from 'react';
import { Card } from '@/components/ui/card';

interface CountdownTimerProps {
  title?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ title = "Registration Closed" }) => {
  return (
    <Card className="w-full max-w-4xl mx-auto mt-8 bg-red-50 border-red-200 border-2">
      <div className="p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h3 className="text-3xl font-bold text-red-600">{title}</h3>
        </div>
        <p className="text-red-700 font-bold text-xl mb-6">Registration has been closed since 28th May 2025</p>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-red-100 mt-6">
          <h4 className="text-2xl font-semibold text-gray-800 mb-4">For any information, visit:</h4>
          <div className="space-y-3 text-gray-700 text-lg">
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
