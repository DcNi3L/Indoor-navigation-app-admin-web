import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import api from "./indoorApi"

// ========== TYPE DEFINITIONS ==========
interface Building {
  id: number
  name: string
  address: string
  type: string
  userId: number,
  description: string
  globalPosition: { x: number; y: number }
  createdAt: string
  updatedAt: string
}

interface Floor {
  id: number
  name: string
  buildingId: number
  levelNumber: number
  dimensionWidth: number
  dimensionHeight: number
  floorPictureUrl?: string
  createdAt: string
  updatedAt: string
}

interface Route {
  id: number
  name: string
  floorId: number
  startNodeId: number
  endNodeId: number
  createdAt: string
  updatedAt: string
}

// ========== BUILDINGS ==========
const createBuilding = (data: Partial<Building>) => api.post("/buildings", data)
const getAllBuildings = (): Promise<Building[]> => api.get("/buildings").then((res) => res.data)
const getBuildingById = (id: number): Promise<Building> => api.get(`/buildings/${id}`).then((res) => res.data)
const getBuildingsByUser = (userId: number): Promise<Building[]> =>
  api.get(`/buildings/by-user/${userId}`).then((res) => res.data)
const patchBuilding = (id: number, data: Partial<Building>) => api.patch(`/buildings/${id}`, data)
const deleteBuilding = (id: number) => api.delete(`/buildings/${id}`)

export const useCreateBuilding = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBuilding,
    onMutate: async (newBuilding) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["allBuildings"] })
      await queryClient.cancelQueries({ queryKey: ["buildingsByUser"] })

      // Snapshot previous values
      const previousBuildings = queryClient.getQueryData<Building[]>(["allBuildings"])

      // Optimistically update
      if (previousBuildings) {
        const optimisticBuilding = {
          id: Date.now(), // Temporary ID
          ...newBuilding,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Building

        queryClient.setQueryData<Building[]>(["allBuildings"], [...previousBuildings, optimisticBuilding])
      }

      return { previousBuildings }
    },
    onSuccess: (data, variables) => {
      toast.success("Building created successfully")

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["allBuildings"] })
      queryClient.invalidateQueries({ queryKey: ["buildingsByUser"] })

      // Set individual building cache
      if (data?.data) {
        queryClient.setQueryData(["building", data.data.id], data.data)
      }
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousBuildings) {
        queryClient.setQueryData(["allBuildings"], context.previousBuildings)
      }

      console.error("Error creating building:", error)
      toast.error(error?.response?.data?.message || "Failed to create building")
    },
  })
}

export const useAllBuildings = () => {
  return useQuery({
    queryKey: ["allBuildings"],
    queryFn: getAllBuildings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

export const useBuildingById = (id: number) => {
  return useQuery({
    queryKey: ["building", id],
    queryFn: () => getBuildingById(id),
    enabled: !!id && id > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

export const useBuildingsByUser = (
  userId: number,
  options?: Omit<UseQueryOptions<Building[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery<Building[], Error>({
    queryKey: ["buildingsByUser", userId],
    queryFn: () => getBuildingsByUser(userId),
    enabled: !!userId && userId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    ...options,
  })
}

export const usePatchBuilding = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await patchBuilding(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBuildings"] })
      toast.success("Building partially updated")
    },
    onError: (error: any) => {
      console.error("Error patching building:", error)
      toast.error("Failed to patch building")
    },
  })
}

export const useDeleteBuilding = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBuilding,
    onMutate: async (buildingId) => {
      await queryClient.cancelQueries({ queryKey: ["allBuildings"] })

      const previousBuildings = queryClient.getQueryData<Building[]>(["allBuildings"])

      // Optimistically remove building
      if (previousBuildings) {
        queryClient.setQueryData<Building[]>(
          ["allBuildings"],
          previousBuildings.filter((building) => building.id !== buildingId),
        )
      }

      return { previousBuildings }
    },
    onSuccess: (data, buildingId) => {
      toast.success("Building deleted successfully")

      // Remove from cache
      queryClient.removeQueries({ queryKey: ["building", buildingId] })
      queryClient.invalidateQueries({ queryKey: ["allBuildings"] })
      queryClient.invalidateQueries({ queryKey: ["buildingsByUser"] })

      // Also invalidate related floors and routes
      queryClient.invalidateQueries({ queryKey: ["floorsByBuilding", buildingId] })
      queryClient.invalidateQueries({ queryKey: ["allFloors"] })
    },
    onError: (error: any, buildingId, context) => {
      if (context?.previousBuildings) {
        queryClient.setQueryData(["allBuildings"], context.previousBuildings)
      }

      console.error("Error deleting building:", error)
      toast.error(error?.response?.data?.message || "Failed to delete building")
    },
  })
}

// ========== FLOORS ==========
const createFloor = (data: Partial<Floor>) => api.post("/floors", data)
const getAllFloors = (): Promise<Floor[]> => api.get("/floors").then((res) => res.data)
const getFloorById = (id: number): Promise<Floor> => api.get(`/floors/${id}`).then((res) => res.data)
const getFloorsByBuildingId = (buildingId: number): Promise<Floor[]> =>
  api.get(`/floors/by-building/${buildingId}`).then((res) => res.data)
const updateFloor = (id: number, data: Partial<Floor>) => api.put(`/floors/${id}`, data)
const deleteFloor = (id: number) => api.delete(`/floors/${id}`)

export const useCreateFloor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFloor,
    onSuccess: (data, variables) => {
      toast.success("Floor created successfully")

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["allFloors"] })
      queryClient.invalidateQueries({ queryKey: ["floorsByBuilding", variables.buildingId] })

      // Set individual floor cache
      if (data?.data) {
        queryClient.setQueryData(["floor", data.data.id], data.data)
      }
    },
    onError: (error: any) => {
      console.error("Error creating floor:", error)
      toast.error(error?.response?.data?.message || "Failed to create floor")
    },
  })
}

export const useAllFloors = () => {
  return useQuery({
    queryKey: ["allFloors"],
    queryFn: getAllFloors,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

export const useFloorById = (id: number) => {
  return useQuery({
    queryKey: ["floor", id],
    queryFn: () => getFloorById(id),
    enabled: !!id,
  })
}

export const useFloorsByBuildingId = (buildingId: number) => {
  return useQuery({
    queryKey: ["floorsByBuilding", buildingId],
    queryFn: () => getFloorsByBuildingId(buildingId),
    enabled: !!buildingId && buildingId > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  })
}

export const useUpdateFloor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await updateFloor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floorsByBuilding"] })
      toast.success("Floor updated successfully")
    },
    onError: (error: any) => {
      console.error("Error updating floor:", error)
      toast.error("Failed to update floor")
    },
  })
}

export const useDeleteFloor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFloor,
    onSuccess: (data, floorId) => {
      toast.success("Floor deleted successfully")

      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: ["floor", floorId] })
      queryClient.invalidateQueries({ queryKey: ["allFloors"] })
      queryClient.invalidateQueries({ queryKey: ["floorsByBuilding"] })

      // Also invalidate routes for this floor
      queryClient.invalidateQueries({ queryKey: ["routesByFloor", floorId] })
    },
    onError: (error: any) => {
      console.error("Error deleting floor:", error)
      toast.error(error?.response?.data?.message || "Failed to delete floor")
    },
  })
}

// ========== ROUTES ==========
const createRoute = (data: Partial<Route>) => api.post("/routes", data)
const getRoutes = (): Promise<Route[]> => api.get("/routes").then((res) => res.data)
const getRoutesByFloorId = (floorId: number): Promise<Route[]> =>
  api.get(`/routes/by-floor/${floorId}`).then((res) => res.data)
const getRouteById = (id: number): Promise<Route> => api.get(`/routes/${id}`).then((res) => res.data)
const updateRoute = (id: number, data: Partial<Route>) => api.put(`/routes/${id}`, data)
const deleteRoute = (id: number) => api.delete(`/routes/${id}`)

export const useCreateRoute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Route created successfully")
    },
    onError: (error: any) => {
      console.error("Error creating route:", error)
      toast.error("Failed to create route")
    },
  })
}

export const useRoutes = () => {
  return useQuery({
    queryKey: ["routes"],
    queryFn: getRoutes,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

export const useRoutesByFloorId = (floorId: number) => {
  return useQuery({
    queryKey: ["routesByFloor", floorId],
    queryFn: () => getRoutesByFloorId(floorId),
    enabled: !!floorId && floorId > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  })
}

export const useRouteById = (id: number) => {
  return useQuery({
    queryKey: ["route", id],
    queryFn: () => getRouteById(id),
    enabled: !!id,
  })
}

export const useUpdateRoute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Route updated successfully")
    },
    onError: (error: any) => {
      console.error("Error updating route:", error)
      toast.error("Failed to update route")
    },
  })
}

export const useDeleteRoute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => await deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Route deleted successfully")
    },
    onError: (error: any) => {
      console.error("Error deleting route:", error)
      toast.error("Failed to delete route")
    },
  })
}

// ========== NODES (POIs) ==========
interface Node {
  id: string
  pos: { x: number; y: number }
  name: string
  type: string
  nodes: string[]
  floorId?: number
}

interface CreateNodeRequest {
  pos: { x: number; y: number }
  type: string
  nodes: string[]
}

const createNode = (floorId: number, data: CreateNodeRequest) => api.post(`/locations/floors/${floorId}/node`, data)

const getNodesByFloor = (floorId: number): Promise<Node[]> =>
  api.get(`/floors/${floorId}/nodes`).then((res) => res.data)

const getNodeById = (floorId: number, nodeId: string): Promise<Node> =>
  api.get(`/floors/${floorId}/node/${nodeId}`).then((res) => res.data)

const updateNode = (floorId: number, nodeId: string, data: Partial<Node>) =>
  api.patch(`/floors/${floorId}/node/${nodeId}`, data)

const deleteNode = (floorId: number, nodeId: string) => api.delete(`/floors/${floorId}/node/${nodeId}`)

const linkNodes = (floorId: number, node1: string, node2: string) =>
  api.post(`/floors/${floorId}/nodes/bi-connection?node1=${node1}&node2=${node2}`)

const unlinkNodes = (floorId: number, node1: string, node2: string) =>
  api.delete(`/floors/${floorId}/nodes/bi-connection?node1=${node1}&node2=${node2}`)

export const useCreateNode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ floorId, data }: { floorId: number; data: CreateNodeRequest }) =>
      await createNode(floorId, data),
    onSuccess: (data, variables) => {
      toast.success("Node created successfully")
      queryClient.invalidateQueries({ queryKey: ["nodesByFloor", variables.floorId] })
    },
    onError: (error: any) => {
      console.error("Error creating node:", error)
      toast.error(error?.response?.data?.message || "Failed to create node")
    },
  })
}

export const useNodesByFloor = (floorId: number) => {
  return useQuery({
    queryKey: ["nodesByFloor", floorId],
    queryFn: () => getNodesByFloor(floorId),
    enabled: !!floorId && floorId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })
}

export const useNodeById = (floorId: number, nodeId: string) => {
  return useQuery({
    queryKey: ["node", floorId, nodeId],
    queryFn: () => getNodeById(floorId, nodeId),
    enabled: !!floorId && !!nodeId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  })
}

export const useUpdateNode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ floorId, nodeId, data }: { floorId: number; nodeId: string; data: Partial<Node> }) =>
      await updateNode(floorId, nodeId, data),
    onSuccess: (data, variables) => {
      toast.success("Node updated successfully")
      queryClient.invalidateQueries({ queryKey: ["nodesByFloor", variables.floorId] })
      queryClient.invalidateQueries({ queryKey: ["node", variables.floorId, variables.nodeId] })
    },
    onError: (error: any) => {
      console.error("Error updating node:", error)
      toast.error(error?.response?.data?.message || "Failed to update node")
    },
  })
}

export const useDeleteNode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ floorId, nodeId }: { floorId: number; nodeId: string }) => await deleteNode(floorId, nodeId),
    onSuccess: (data, variables) => {
      toast.success("Node deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["nodesByFloor", variables.floorId] })
      queryClient.removeQueries({ queryKey: ["node", variables.floorId, variables.nodeId] })
    },
    onError: (error: any) => {
      console.error("Error deleting node:", error)
      toast.error(error?.response?.data?.message || "Failed to delete node")
    },
  })
}

export const useLinkNodes = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ floorId, node1, node2 }: { floorId: number; node1: string; node2: string }) =>
      await linkNodes(floorId, node1, node2),
    onSuccess: (data, variables) => {
      toast.success("Nodes linked successfully")
      queryClient.invalidateQueries({ queryKey: ["nodesByFloor", variables.floorId] })
    },
    onError: (error: any) => {
      console.error("Error linking nodes:", error)
      toast.error(error?.response?.data?.message || "Failed to link nodes")
    },
  })
}

export const useUnlinkNodes = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ floorId, node1, node2 }: { floorId: number; node1: string; node2: string }) =>
      await unlinkNodes(floorId, node1, node2),
    onSuccess: (data, variables) => {
      toast.success("Nodes unlinked successfully")
      queryClient.invalidateQueries({ queryKey: ["nodesByFloor", variables.floorId] })
    },
    onError: (error: any) => {
      console.error("Error unlinking nodes:", error)
      toast.error(error?.response?.data?.message || "Failed to unlink nodes")
    },
  })
}

// ========== ROUTING SERVICE ==========
interface RouteRequest {
  src: string
  dest: string
}

interface RouteResponse {
  path: Node[]
  distance: number
  duration?: number
}

const findRouteBetweenPoints = (data: RouteRequest): Promise<RouteResponse> =>
  api.post("/routes/between-two-points", data).then((res) => res.data)

export const useFindRoute = () => {
  return useMutation({
    mutationFn: findRouteBetweenPoints,
    onError: (error: any) => {
      console.error("Error finding route:", error)
      toast.error(error?.response?.data?.message || "Failed to find route")
    },
  })
}

// Export Node interface for use in other components
export type { Node, CreateNodeRequest, RouteRequest, RouteResponse }

// ========== UTILITY HOOKS ==========
export const useInvalidateBuildingQueries = () => {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["allBuildings"] })
      queryClient.invalidateQueries({ queryKey: ["buildingsByUser"] })
      queryClient.invalidateQueries({ queryKey: ["building"] })
    },
    invalidateBuilding: (id: number) => {
      queryClient.invalidateQueries({ queryKey: ["building", id] })
    },
    invalidateUserBuildings: (userId: number) => {
      queryClient.invalidateQueries({ queryKey: ["buildingsByUser", userId] })
    },
  }
}

export const useInvalidateFloorQueries = () => {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["allFloors"] })
      queryClient.invalidateQueries({ queryKey: ["floorsByBuilding"] })
      queryClient.invalidateQueries({ queryKey: ["floor"] })
    },
    invalidateFloor: (id: number) => {
      queryClient.invalidateQueries({ queryKey: ["floor", id] })
    },
    invalidateBuildingFloors: (buildingId: number) => {
      queryClient.invalidateQueries({ queryKey: ["floorsByBuilding", buildingId] })
    },
  }
}

// Prefetch utilities
export const usePrefetchBuilding = () => {
  const queryClient = useQueryClient()

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ["building", id],
      queryFn: () => getBuildingById(id),
      staleTime: 10 * 60 * 1000,
    })
  }
}

export const usePrefetchFloorsByBuilding = () => {
  const queryClient = useQueryClient()

  return (buildingId: number) => {
    queryClient.prefetchQuery({
      queryKey: ["floorsByBuilding", buildingId],
      queryFn: () => getFloorsByBuildingId(buildingId),
      staleTime: 10 * 60 * 1000,
    })
  }
}
