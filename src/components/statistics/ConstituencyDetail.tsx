
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

// Custom chart tooltip to optimize rendering
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-md">
        <p className="font-semibold">{`${payload[0].payload.name}`}</p>
        <p className="text-sm">{`Registrations: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const ConstituencyDetail: React.FC<ConstituencyDetailProps> = ({
  selectedRegion,
  regionData,
  constituencyData,
  onRegionChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConstituencies, setFilteredConstituencies] = useState<ChartData[]>([]);
  
  // Convert constituencies data for memoization
  const availableConstituencies = useMemo(() => 
    constituencyData[selectedRegion] || [],
  [constituencyData, selectedRegion]);
  
  // Filter constituencies with debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      const filtered = searchTerm 
        ? availableConstituencies.filter(constituency => 
            constituency.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : availableConstituencies;
        
      setFilteredConstituencies(filtered);
    }, 150);
    
    return () => clearTimeout(handler);
  }, [searchTerm, availableConstituencies]);
  
  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <Card className="p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6">Constituency Details</h2>
      
      <div className="mb-4 space-y-4">
        <div>
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
        
        <div>
          <Label htmlFor="constituency-search" className="block mb-2">Search Constituencies</Label>
          <Input
            id="constituency-search"
            placeholder="Search constituencies..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full md:w-64"
          />
        </div>
      </div>
      
      {filteredConstituencies.length > 0 ? (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredConstituencies}
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="Registrations" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[300px]">
          <p className="text-gray-500">
            {searchTerm 
              ? "No constituencies found matching your search" 
              : "No constituency data available for this region"}
          </p>
        </div>
      )}
    </Card>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(ConstituencyDetail);
