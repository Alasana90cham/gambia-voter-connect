
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface CountdownTimerProps {
  targetDate: Date;
  title?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, title = "Registration Closes" }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Function to get next Wednesday at 11:59 PM
  const getNextWednesday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 3 = Wednesday
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    
    // If today is Wednesday, check if it's before 11:59 PM
    if (dayOfWeek === 3) {
      const todayAt1159 = new Date(today);
      todayAt1159.setHours(23, 59, 0, 0);
      
      if (today < todayAt1159) {
        return todayAt1159;
      } else {
        // If it's after 11:59 PM on Wednesday, get next Wednesday
        const nextWednesday = new Date(today);
        nextWednesday.setDate(today.getDate() + 7);
        nextWednesday.setHours(23, 59, 0, 0);
        return nextWednesday;
      }
    }
    
    // Get next Wednesday at 11:59 PM
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + (daysUntilWednesday || 7));
    nextWednesday.setHours(23, 59, 0, 0);
    return nextWednesday;
  };

  // Calculate target date on component mount
  const [targetWednesday] = useState(() => getNextWednesday());

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  if (isExpired) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-6 bg-red-50 border-red-200">
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-red-600 mb-2">{title}</h3>
          <p className="text-red-700">Registration has closed</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6 bg-blue-50 border-blue-200">
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold text-blue-800 mb-4">{title}</h3>
        <p className="text-sm text-blue-600 mb-4">
          Registration closes on {targetWednesday.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} at 11:59 PM
        </p>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-800">{formatTime(timeLeft.days)}</div>
            <div className="text-xs text-blue-600 uppercase tracking-wide">Days</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-800">{formatTime(timeLeft.hours)}</div>
            <div className="text-xs text-blue-600 uppercase tracking-wide">Hours</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-800">{formatTime(timeLeft.minutes)}</div>
            <div className="text-xs text-blue-600 uppercase tracking-wide">Minutes</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-800">{formatTime(timeLeft.seconds)}</div>
            <div className="text-xs text-blue-600 uppercase tracking-wide">Seconds</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CountdownTimer;
