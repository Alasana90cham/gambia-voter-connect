import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Define table names type to ensure type safety
export type TableName = 'admins' | 'voters';

// Enhanced fetchPaginated function with proper typing and improved reliability
export async function fetchPaginated(
  tableName: TableName,
  options: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  } = {}
) {
  const { orderBy = 'created_at', ascending = true, limit = 1000 } = options;
  
  try {
    console.log(`Starting paginated fetch for ${tableName}`);
    
    // Initial query setup with proper limit
    let query = supabase.from(tableName).select('*');
    
    // Add ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    
    // First page
    const { data: initialData, error: initialError } = await query.limit(limit);
    
    if (initialError) {
      console.error(`Error fetching initial data: ${initialError.message}`);
      throw initialError;
    }
    
    if (!initialData || initialData.length === 0) {
      console.log(`No data found in ${tableName}`);
      return [];
    }
    
    // If we got less than the limit, we're done
    if (initialData.length < limit) {
      console.log(`Completed fetching ${initialData.length} records from ${tableName}`);
      return initialData;
    }
    
    // We need to paginate
    let allData = [...initialData];
    let lastRecord = initialData[initialData.length - 1];
    let hasMore = true;
    let page = 1;
    
    // Continue fetching until all data is retrieved
    while (hasMore) {
      console.log(`Fetching page ${page + 1} for ${tableName}`);
      
      // Fetch next page
      const { data: nextData, error: nextError } = await supabase
        .from(tableName)
        .select('*')
        .order(orderBy, { ascending })
        .gt(orderBy, lastRecord[orderBy])
        .limit(limit);
      
      if (nextError) {
        console.error(`Error fetching page ${page ${page + 1}: ${nextError.message}`);
        throw nextError;
      }
      
      if (!nextData || nextData.length === 0) {
        hasMore = false;
      } else {
        allData = [...allData, ...nextData];
        lastRecord = nextData[nextData.length - 1];
        
        // If we got less than the limit, we're done
        if (nextData.length < limit) {
          hasMore = false;
        }
        
        page++;
      }
    }
    
    console.log(`Completed fetching all ${allData.length} records from ${tableName}`);
    return allData;
  } catch (error) {
    console.error(`Error in fetchPaginated for ${tableName}:`, error);
    throw error;
  }
}
