
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { verifyAdminLogin } from '@/data/constituencies';
import { toast } from '@/components/ui/use-toast';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const isValid = await verifyAdminLogin(email, password);
      
      if (isValid) {
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard",
        });
        onLoginSuccess();
        setLoginError('');
      } else {
        setLoginError('Invalid email or password');
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError('An error occurred during login. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
      <p className="text-gray-600 mb-6">
        Only administrators can access the statistics dashboard.
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
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            onKeyPress={handleKeyPress}
          />
        </div>
        
        <Button 
          className="w-full" 
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </div>
    </div>
  );
};

export default AdminLogin;
