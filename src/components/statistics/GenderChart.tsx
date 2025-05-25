
import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface GenderChartProps {
  genderData: ChartData[];
  totalCount: number;
}

const GenderChart: React.FC<GenderChartProps> = ({ genderData, totalCount }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  // Calculate the actual sum from chart data
  const calculatedTotal = genderData.reduce((sum, item) => sum + item.value, 0);
  const displayTotal = calculatedTotal > 0 ? calculatedTotal : totalCount;

  console.log("GenderChart data:", { genderData, totalCount, calculatedTotal, displayTotal });

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Gender Distribution</h2>
      {genderData.length > 0 ? (
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
              <Tooltip formatter={(value) => [`${value} (${((value as number / displayTotal) * 100).toFixed(1)}%)`, 'Registrations']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[300px]">
          <p>No gender data available</p>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <p>Total Registrations: {displayTotal.toLocaleString()}</p>
        <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
      </div>
    </Card>
  );
};

export default GenderChart;
