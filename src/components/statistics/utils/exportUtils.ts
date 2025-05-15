
import { toast } from "@/components/ui/use-toast";
import { formatForExport, generateCsvContent, downloadCsv } from "../RegistrationTableHelpers";

/**
 * Handle excel/csv export of data
 */
export const handleExcelExport = (filteredData: any[]) => {
  toast({
    title: "Export Started",
    description: `Processing ${filteredData.length} records for export...`,
  });
  
  // Use setTimeout to avoid blocking UI during export
  setTimeout(() => {
    try {
      console.log(`Starting CSV export of ${filteredData.length} records`);
      
      // Generate the CSV content in memory-efficient chunks
      const csvContent = generateCsvContent(filteredData);
      
      // Download the file with current timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `NYPG_Voter_Statistics_${timestamp}.csv`;
      downloadCsv(csvContent, filename);
      
      toast({
        title: "Export Successful",
        description: `${filteredData.length} records have been exported to CSV format`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred during export. Please try again.",
        variant: "destructive",
      });
    }
  }, 100); // Small delay to allow toast to render first
};
