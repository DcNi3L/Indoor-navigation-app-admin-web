import { createClient } from "@supabase/supabase-js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced bucket size calculation with caching
const fetchFullBucketSize = async (bucketName: string, path = ""): Promise<number> => {
  try {
    let totalSize = 0
    const processedPaths = new Set<string>() // Prevent infinite recursion

    const calculateSize = async (currentPath: string): Promise<number> => {
      if (processedPaths.has(currentPath)) return 0
      processedPaths.add(currentPath)

      const { data: items, error } = await supabase.storage
        .from(bucketName)
        .list(currentPath, { limit: 1000, sortBy: { column: "name", order: "asc" } })

      if (error) {
        console.error(`Error listing ${currentPath || "root"}:`, error)
        return 0
      }

      if (!items || items.length === 0) {
        return 0
      }

      let pathSize = 0

      // Process in batches to avoid overwhelming the API
      const batchSize = 10
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)

        const batchPromises = batch.map(async (item) => {
          const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name

          if (item.metadata !== null) {
            // It's a file
            return item.metadata?.size || 0
          } else {
            // It's a folder, recurse
            return await calculateSize(fullPath)
          }
        })

        const batchSizes = await Promise.all(batchPromises)
        pathSize += batchSizes.reduce((sum, size) => sum + size, 0)
      }

      return pathSize
    }

    totalSize = await calculateSize(path)
    return totalSize
  } catch (err) {
    console.error("Error calculating full bucket size:", err)
    return 0
  }
}

export const useFullBucketSize = (bucketName: string) => {
  return useQuery({
    queryKey: ["full-bucket-size", bucketName],
    queryFn: () => fetchFullBucketSize(bucketName),
    enabled: !!bucketName,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// Enhanced file deletion with better error handling
const deleteAllFilesInFolder = async ({
  bucketName,
  path = "",
}: {
  bucketName: string
  path?: string
}): Promise<{ deletedCount: number; errors: string[] }> => {
  const deletedFiles: string[] = []
  const errors: string[] = []
  const processedPaths = new Set<string>()

  const deleteRecursively = async (currentPath: string): Promise<void> => {
    if (processedPaths.has(currentPath)) return
    processedPaths.add(currentPath)

    try {
      const { data: items, error } = await supabase.storage.from(bucketName).list(currentPath, { limit: 1000 })

      if (error) {
        errors.push(`Error listing ${currentPath || "root"}: ${error.message}`)
        return
      }

      if (!items || items.length === 0) return

      // Separate files and folders
      const files: string[] = []
      const folders: string[] = []

      items.forEach((item) => {
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name

        if (item.metadata !== null) {
          files.push(fullPath)
        } else {
          folders.push(fullPath)
        }
      })

      // Delete files in batches
      if (files.length > 0) {
        const batchSize = 50 // Supabase batch limit
        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize)

          const { error: deleteError } = await supabase.storage.from(bucketName).remove(batch)

          if (deleteError) {
            errors.push(`Error deleting batch: ${deleteError.message}`)
          } else {
            deletedFiles.push(...batch)
          }
        }
      }

      // Recursively delete folders
      for (const folderPath of folders) {
        await deleteRecursively(folderPath)
      }
    } catch (err: any) {
      errors.push(`Error processing ${currentPath}: ${err.message}`)
    }
  }

  await deleteRecursively(path)

  return {
    deletedCount: deletedFiles.length,
    errors,
  }
}

export const useDeleteAllFilesInFolder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAllFilesInFolder,
    onSuccess: (result, variables) => {
      const { deletedCount, errors } = result

      if (errors.length > 0) {
        console.warn("Some files could not be deleted:", errors)
        toast.error(`Deleted ${deletedCount} files, but ${errors.length} errors occurred`)
      } else {
        toast.success(`Successfully deleted ${deletedCount} files`)
      }

      // Invalidate bucket size cache
      queryClient.invalidateQueries({
        queryKey: ["full-bucket-size", variables.bucketName],
      })
    },
    onError: (error: any) => {
      console.error("Error deleting files:", error)
      toast.error("Failed to delete files")
    },
  })
}

// Enhanced file deletion by URL
const deleteFileByUrl = async (publicUrl: string): Promise<string> => {
  if (!publicUrl) throw new Error("Public URL is required")

  try {
    const urlParts = publicUrl.split("/")
    if (urlParts.length < 3) {
      throw new Error("Invalid public URL format")
    }

    const bucketName = urlParts[urlParts.length - 3]
    const filePath = urlParts.slice(urlParts.length - 2).join("/")

    const { error } = await supabase.storage.from(bucketName).remove([filePath])

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`)
    }

    return filePath
  } catch (err: any) {
    console.error("Error deleting file by URL:", err)
    throw err
  }
}

export const useDeleteFileByUrl = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFileByUrl,
    onSuccess: (filePath, publicUrl) => {
      toast.success("File deleted successfully")

      // Extract bucket name and invalidate related queries
      const urlParts = publicUrl.split("/")
      const bucketName = urlParts[urlParts.length - 3]

      queryClient.invalidateQueries({
        queryKey: ["full-bucket-size", bucketName],
      })
    },
    onError: (error: any) => {
      console.error("Error deleting file:", error)
      toast.error(error.message || "Failed to delete file")
    },
  })
}

// Utility function to clear all Supabase-related cache
export const useClearSupabaseCache = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ["full-bucket-size"] })
    queryClient.removeQueries({ queryKey: ["full-bucket-size"] })
  }
}
