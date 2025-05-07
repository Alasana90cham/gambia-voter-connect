
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface RegionChartProps {
  regionData: ChartData[];
}

const RegionChart: React.FC<RegionChartProps> = ({ regionData }) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Regional Distribution</h2>
      {regionData.length > 0 ? (
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
      ) : (
        <div className="flex justify-center items-center h-[300px]">
          <p>No data available</p>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <p>Total Regions: {regionData.length}</p>
      </div>
    </Card>
  );
};

export default RegionChart;
