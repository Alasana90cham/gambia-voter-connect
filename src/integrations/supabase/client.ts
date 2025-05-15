
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Define table names type to ensure type safety
export type TableName = 'admins' | 'voters';

/**
 * Enhanced insurance submission function that retries failed submissions
 * and provides better error handling and recovery
 */
export async function insuranceSubmit(
  tableName: TableName,
  data: any,
  maxRetries: number = 3,
  retryDelay: number = 1000
) {
  let attempt = 0;
  let lastError: any = null;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Insurance submit attempt ${attempt + 1}/${maxRetries} for table ${tableName}`);
      
      // Attempt to insert the data
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();
        
      // If there's an error, throw it to be caught and retried
      if (error) {
        console.error(`Error on attempt ${attempt + 1}:`, error);
        throw error;
      }
      
      // If successful, return the result
      console.log(`Successfully submitted data on attempt ${attempt + 1}`);
      return result;
    } catch (err) {
      lastError = err;
      attempt++;
      
      // If we've reached the maximum retries, break out of the loop
      if (attempt >= maxRetries) {
        console.error(`All ${maxRetries} attempts failed`);
        break;
      }
      
      // Wait before retrying with exponential backoff
      const backoffDelay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${backoffDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  // If we get here, all attempts failed
  throw lastError || new Error('Insurance submit failed for unknown reason');
}

// Enhanced fetchPaginated function with proper typing and improved reliability
export async function fetchPaginated(
  tableName: TableName,
  options: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  } = {}
) {
  const { orderBy = 'created_at', ascending = true, limit = 10000 } = options;
  
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
        console.error(`Error fetching page ${page + 1}: ${nextError.message}`);
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
