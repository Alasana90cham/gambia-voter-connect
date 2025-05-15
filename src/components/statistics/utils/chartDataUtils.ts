
import { ChartData } from '../StatisticsContext';

/**
 * Process voter data into chart-friendly format
 */
export const processChartData = (voters: any[]) => {
  if (!voters || voters.length === 0) return {
    genderData: [],
    regionData: [],
    constituencyData: {}
  };
  
  console.log(`Processing chart data for ${voters.length} records`);
  
  // Use direct approach for better performance with large datasets
  const genderMap = new Map<string, number>();
  const regionMap = new Map<string, number>();
  const constituencyMap = new Map<string, Map<string, number>>();
  
  // Process all data directly for accurate chart representation
  voters.forEach(voter => {
    // Process gender data
    const gender = voter.gender || 'Unknown';
    genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
    
    // Process region data
    const region = voter.region || 'Unknown';
    regionMap.set(region, (regionMap.get(region) || 0) + 1);
    
    // Process constituency data
    const constituency = voter.constituency || 'Unknown';
    
    if (!constituencyMap.has(region)) {
      constituencyMap.set(region, new Map<string, number>());
    }
    
    const regionConstituencies = constituencyMap.get(region)!;
    regionConstituencies.set(constituency, (regionConstituencies.get(constituency) || 0) + 1);
  });
  
  // Convert maps to required format
  const genderChartData: ChartData[] = Array.from(genderMap.entries()).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));
  
  const regionChartData: ChartData[] = Array.from(regionMap.entries()).map(([name, value]) => ({
    name,
    value
  }));
  
  const constituencyChartData: {[key: string]: ChartData[]} = {};
  constituencyMap.forEach((constituencies, region) => {
    constituencyChartData[region] = Array.from(constituencies.entries()).map(([name, value]) => ({
      name,
      value
    }));
  });
  
  console.log("Chart data processing completed successfully");
  
  return {
    genderData: genderChartData,
    regionData: regionChartData,
    constituencyData: constituencyChartData
  };
};
