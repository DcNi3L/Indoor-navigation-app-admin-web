import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getFullBucketSize = async (bucketName: string) => {
  try {
    let totalSize = 0;

    const { data: topLevel, error: topError } = await supabase
      .storage
      .from(bucketName)
      .list('', { limit: 1000 });

    if (topError) {
      console.error('Error listing top level:', topError);
      return;
    }

    if (!topLevel) {
      console.log('No files found');
      return;
    }

    for (const item of topLevel) {
      if (item.name && item.id) {
        totalSize += item.metadata?.size || 0;
      } else if (item.name) {
        const { data: folderFiles, error: folderError } = await supabase
          .storage
          .from(bucketName)
          .list(item.name, { limit: 1000 });

        if (folderError) {
          console.error(`Error listing folder ${item.name}:`, folderError);
          continue;
        }

        if (folderFiles) {
          for (const file of folderFiles) {
            totalSize += file.metadata?.size || 0;
          }
        }
      }
    }

    return (totalSize / 1024 / 1024).toFixed(2);

  } catch (err) {
    console.error('Error calculating full bucket size:', err);
  }
};
