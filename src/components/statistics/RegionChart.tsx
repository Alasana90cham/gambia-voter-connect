
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
  // Calculate total registrations from actual data
  const totalRegistrations = regionData.reduce((sum, region) => sum + region.value, 0);

  console.log("RegionChart data:", { regionData, totalRegistrations });

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
              <Tooltip formatter={(value) => [`${value} (${((value as number / totalRegistrations) * 100).toFixed(1)}%)`, 'Registrations']} />
              <Legend />
              <Bar dataKey="value" name="Registrations" fill="#0067A5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[300px]">
          <p>No regional data available</p>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <p>Total Regions: {regionData.length}</p>
        <p>Total Registrations: {totalRegistrations.toLocaleString()}</p>
        <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
      </div>
    </Card>
  );
};

export default RegionChart;
