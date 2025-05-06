
import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Statistics = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Registration Statistics</h1>
        <p className="text-gray-600 mb-8">View the latest voter registration data statistics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <li>Export functionality for administrative purposes</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Statistics;
