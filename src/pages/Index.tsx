
import React from 'react';
import MultiStepForm from '@/components/form/MultiStepForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Index = () => {
  // Prevent sensitive data from leaking to console
  React.useEffect(() => {
    // Override console methods to avoid logging sensitive data
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    
    // Create safer versions that filter potential sensitive data
    console.log = function(...args) {
      const safeArgs = args.map(arg => sanitizeConsoleOutput(arg));
      originalConsoleLog.apply(console, safeArgs);
    };
    
    console.error = function(...args) {
      const safeArgs = args.map(arg => sanitizeConsoleOutput(arg));
      originalConsoleError.apply(console, safeArgs);
    };
    
    console.warn = function(...args) {
      const safeArgs = args.map(arg => sanitizeConsoleOutput(arg));
      originalConsoleWarn.apply(console, safeArgs);
    };
    
    console.info = function(...args) {
      const safeArgs = args.map(arg => sanitizeConsoleOutput(arg));
      originalConsoleInfo.apply(console, safeArgs);
    };
    
    // Helper function to sanitize output and remove sensitive data
    function sanitizeConsoleOutput(data) {
      // For objects containing sensitive data
      if (data && typeof data === 'object') {
        // Check if it's an array of voter records
        if (Array.isArray(data) && data.length > 0 && data[0] && (data[0].email || data[0].identification_number)) {
          return `[Array of ${data.length} records]`;
        }
        
        // If it's a single voter record or contains voter data
        if (data.email || data.identification_number || data.full_name) {
          return "[Redacted voter data]";
        }
        
        // For admin data
        if (data.password || (data.email && data.is_admin)) {
          return "[Redacted admin data]";
        }
        
        // For other objects, clone and recursively sanitize
        try {
          const clone = Array.isArray(data) ? [...data] : {...data};
          
          // Recursively sanitize nested objects
          Object.keys(clone).forEach(key => {
            if (typeof clone[key] === 'object' && clone[key] !== null) {
              clone[key] = sanitizeConsoleOutput(clone[key]);
            }
          });
          
          return clone;
        } catch (e) {
          return data; // If cloning fails, return as-is
        }
      }
      
      return data;
    }
    
    // Clean up on unmount
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">NATIONAL YOUTH PARLIAMENT GAMBIA</h1>
            <h2 className="text-2xl font-semibold mb-2 text-gray-700">Voter Registration</h2>
            <p className="text-gray-600">Complete the form below to register as a voter</p>
          </div>
          
          <MultiStepForm />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
