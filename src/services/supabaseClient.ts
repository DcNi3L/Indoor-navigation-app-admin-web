import { createClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fetchFullBucketSize  = async (bucketName: string, path: string = '') => {
  try {
    let totalSize = 0;

    const { data: items, error } = await supabase
      .storage
      .from(bucketName)
      .list(path, { limit: 1000 });

    if (error) {
      console.error(`Error listing ${path || 'root'}:`, error);
      return 0;
    }

    if (!items) {
      console.log("No files found");
      return 0;
    }

    for (const item of items) {
    
      const fullPath = path ? `${path}/${item.name}` : item.name;
    
      if (item.metadata !== null) {
        totalSize += item.metadata?.size || 0;
      } else {
        const folderSize = await fetchFullBucketSize(bucketName, fullPath) || 0;
        totalSize += folderSize;
      }
    }

    return totalSize;

  } catch (err) {
    console.error('Error calculating full bucket size:', err);
  }
};

export const useFullBucketSize = (bucketName: string) => {
  return useQuery({
    queryKey: ['full-bucket-size', bucketName],
    queryFn: () => fetchFullBucketSize(bucketName),
    enabled: !!bucketName,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  } as any);
};
