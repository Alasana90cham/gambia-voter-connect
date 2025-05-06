
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { adminUsers } from '@/data/constituencies';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { ChartContainer } from '@/components/ui/chart';
import { Label } from '@/components/ui/label';

// Mock data - this would come from your database in a real app
const genderData = [
  { name: 'Male', value: 235 },
  { name: 'Female', value: 267 }
];

const regionData = [
  { name: 'Banjul', value: 67 },
  { name: 'Kanifing', value: 143 },
  { name: 'West Coast', value: 129 },
  { name: 'North Bank', value: 58 },
  { name: 'Lower River', value: 39 },
  { name: 'Central River', value: 41 },
  { name: 'Upper River', value: 25 }
];

const constituencyData = {
  'Banjul': [
    { name: 'Banjul South', value: 22 },
    { name: 'Banjul Central', value: 24 },
    { name: 'Banjul North', value: 21 }
  ],
  'Kanifing': [
    { name: 'Kanifing', value: 18 },
    { name: 'Bakau', value: 15 },
    { name: 'Jeshwang', value: 25 },
    { name: 'Serekunda West', value: 22 },
    { name: 'Serrekunda', value: 14 },
    { name: 'Bundungka Kunda', value: 18 },
    { name: 'Latrikunda Sabijie', value: 16 },
    { name: 'Talinding Kunjang', value: 15 }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Statistics = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Banjul');

  // Check for admin login
  const handleLogin = () => {
    const admin = adminUsers.find(user => user.email === email);
    
    if (admin && password === 'admin123') { // In a real app, you'd verify against hashed passwords
      setIsAdmin(true);
      setLoginError('');
    } else {
      setLoginError('Invalid email or password');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
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
                  placeholder="admin@nypg.org"
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
                />
              </div>
              
              <Button className="w-full" onClick={handleLogin}>
                Login
              </Button>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">NATIONAL YOUTH PARLIAMENT GAMBIA - Registration Statistics</h1>
          <Button variant="outline" onClick={() => setIsAdmin(false)}>Logout</Button>
        </div>
        
        <div className="mb-8">
          <p className="text-lg text-gray-600">
            Welcome to the admin dashboard. Here you can view real-time statistics of voter registrations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Gender Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Gender Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Total Registrations: {genderData.reduce((acc, curr) => acc + curr.value, 0)}</p>
            </div>
          </Card>
          
          {/* Regional Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Regional Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={regionData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Registrations" fill="#0067A5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Total Regions: {regionData.length}</p>
            </div>
          </Card>
        </div>
        
        {/* Constituency Details */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Constituency Details</h2>
          
          <div className="mb-4">
            <Label htmlFor="region-select" className="block mb-2">Select Region</Label>
            <select 
              id="region-select"
              className="w-full md:w-64 p-2 border rounded-md"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {regionData.map((region) => (
                <option key={region.name} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={constituencyData[selectedRegion as keyof typeof constituencyData] || []}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Registrations" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Admin Management Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Admin Management</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 text-left">ID</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left">Email</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map(user => (
                  <tr key={user.id}>
                    <td className="py-2 px-4 border-b border-gray-200">{user.id}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{user.email}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{user.isAdmin ? 'Admin' : 'User'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* Database Connection Note */}
        <div className="mt-10 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">About Statistics Data</h3>
          <p className="text-gray-700">
            This page is currently displaying mock data for demonstration purposes. In a production environment,
            this would connect to a MySQL database to show real-time statistics of voter registrations.
          </p>
          <p className="mt-2 text-gray-700">
            The real implementation would include:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Real-time data from the MySQL database</li>
            <li>More detailed statistics and filtering options</li>
            <li>Excel export functionality for administrative purposes</li>
            <li>User management tools for adding/removing admins</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Statistics;
