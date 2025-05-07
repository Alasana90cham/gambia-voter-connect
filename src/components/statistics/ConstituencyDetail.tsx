
import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface ConstituencyDetailProps {
  selectedRegion: string;
  regionData: ChartData[];
  constituencyData: {[key: string]: ChartData[]};
  onRegionChange: (region: string) => void;
}

const ConstituencyDetail: React.FC<ConstituencyDetailProps> = ({
  selectedRegion,
  regionData,
  constituencyData,
  onRegionChange
}) => {
  return (
    <Card className="p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6">Constituency Details</h2>
      
      <div className="mb-4">
        <Label htmlFor="region-select" className="block mb-2">Select Region</Label>
        <select 
          id="region-select"
          className="w-full md:w-64 p-2 border rounded-md"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
        >
          {regionData.map((region) => (
            <option key={region.name} value={region.name}>
              {region.name}
            </option>
          ))}
        </select>
      </div>
      
      {constituencyData[selectedRegion] && constituencyData[selectedRegion].length > 0 ? (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={constituencyData[selectedRegion]}
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
      ) : (
        <div className="flex justify-center items-center h-[300px]">
          <p>No constituency data available for this region</p>
        </div>
      )}
    </Card>
  );
};

export default ConstituencyDetail;
