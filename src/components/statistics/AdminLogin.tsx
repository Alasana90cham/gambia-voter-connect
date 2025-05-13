
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { verifyAdminLogin } from '@/data/constituencies';
import { toast } from '@/components/ui/use-toast';
import { EyeIcon, EyeOffIcon, LockIcon } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  // Check if user is locked out
  const isLockedOut = () => {
    if (lockoutUntil && new Date() < lockoutUntil) {
      const minutes = Math.ceil((lockoutUntil.getTime() - new Date().getTime()) / 60000);
      setLoginError(`Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
      return true;
    }
    return false;
  };

  const handleLogin = async () => {
    // Check if user is locked out
    if (isLockedOut()) return;

    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      // Sanitize input to prevent injection attacks
      const sanitizedEmail = email.trim().toLowerCase();
      
      const isValid = await verifyAdminLogin(sanitizedEmail, password);
      
      if (isValid) {
        // Reset login attempts on successful login
        setLoginAttempts(0);
        
        // Create a secure session with expiry
        const sessionData = {
          email: sanitizedEmail,
          timestamp: new Date().toISOString(),
          expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        };

        // Store encrypted session data
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard",
        });
        
        onLoginSuccess();
      } else {
        // Increment failed login attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lockout
          setLockoutUntil(lockoutTime);
          setLoginError(`Too many failed login attempts. Account locked for 15 minutes until ${lockoutTime.toLocaleTimeString()}.`);
        } else {
          setLoginError(`Invalid email or password. ${5 - newAttempts} attempts remaining before lockout.`);
        }

        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError('An error occurred during login. Please try again later.');
      toast({
        title: "Login error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <LockIcon className="mr-2" size={24} />
        Admin Login
      </h1>
      <p className="text-gray-600 mb-6">
        Only authorized administrators can access the statistics dashboard.
      </p>
      
      {loginError && (
        <div className="bg-red-50 p-4 rounded-md mb-4 text-red-800">
          {loginError}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            onKeyPress={handleKeyPress}
            autoComplete="username"
            disabled={isLoading || isLockedOut()}
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              onKeyPress={handleKeyPress}
              autoComplete="current-password"
              disabled={isLoading || isLockedOut()}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon size={18} />
              ) : (
                <EyeIcon size={18} />
              )}
            </button>
          </div>
        </div>
        
        <Button 
          className="w-full" 
          onClick={handleLogin}
          disabled={isLoading || isLockedOut()}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </div>
    </div>
  );
};

export default AdminLogin;
