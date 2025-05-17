import { createClient } from '@supabase/supabase-js';
import { useMutation, useQuery } from '@tanstack/react-query';

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

// delete all files from storage
const deleteAllFilesInFolder = async ({ bucketName, path = '' }: { bucketName: string, path?: string }) => {
  try {
    const { data: items, error } = await supabase
      .storage
      .from(bucketName)
      .list(path, { limit: 1000 });

    if (error) {
      console.error(`Error listing files in ${path || 'root'}:`, error);
      return;
    }

    if (!items) {
      console.log(`No files found in ${path || 'root'}`);
      return;
    }

    for (const item of items) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      // If the item is a file, delete it
      if (item.metadata !== null) {
        const { error: deleteError } = await supabase
          .storage
          .from(bucketName)
          .remove([fullPath]);

        if (deleteError) {
          console.error(`Error deleting file ${fullPath}:`, deleteError);
        } else {
          console.log(`Deleted file: ${fullPath}`);
        }
      } else {
        // If the item is a folder, recursively delete files inside
        await deleteAllFilesInFolder({ bucketName, path: fullPath });
      }
    }

    console.log(`All files in folder ${path || 'root'} deleted successfully.`);
  } catch (err) {
    console.error('Error deleting all files:', err);
  }
};

export const useDeleteAllFilesInFolder = () => {
  return useMutation({
    mutationFn: deleteAllFilesInFolder,
    onSuccess: () => {
      console.log("Successfully deleted all files in the folder.");
    },
    onError: (error) => {
      console.error("Error deleting all files in the folder:", error);
    }
  });
};

// Delete a file by its public URL
const deleteFileByUrl = async (publicUrl: string) => {
  try {
    const urlParts = publicUrl.split('/');
    const bucketName = urlParts[urlParts.length - 3];
    const filePath = urlParts.slice(urlParts.length - 2).join('/');

    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Error deleting file from URL ${publicUrl}:`, error);
      throw error;
    }

    console.log(`Deleted file from URL: ${publicUrl}`);
  } catch (err) {
    console.error('Error deleting file by URL:', err);
    throw err;
  }
};

export const useDeleteFileByUrl = () => {
  return useMutation({
    mutationFn: deleteFileByUrl,
    onSuccess: () => {
      console.log("File deleted successfully.");
    },
    onError: (error) => {
      console.error("Error deleting file by URL:", error);
    }
  });
};