import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from './indoorApi';

// ========== BUILDINGS ==========
const createBuilding = (data: any) => api.post('/buildings', data);
const getAllBuildings = () => api.get('/buildings').then((res) => res.data);
const getBuildingById = (id: number) => api.get(`/buildings/${id}`).then(res => res.data);
const getBuildingsByUser = (userId: number) => api.get(`/buildings/by-user/${userId}`).then(res => res.data);

export const useCreateBuilding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => await createBuilding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildingsByUser'] });
      toast.success('Building created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating building:', error);
      toast.error('Failed to create building');
    },
  });
};

export const useAllBuildings = () => {
  return useQuery({
    queryKey: ['allBuildings'],
    queryFn: getAllBuildings,
  });
};

export const useBuildingById = (id: number) => {
  return useQuery({
    queryKey: ['building', id],
    queryFn: () => getBuildingById(id),
    enabled: !!id,
  });
};

export const useBuildingsByUser = (
  userId: number,
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<any[], Error>({
    queryKey: ['buildingsByUser', userId],
    queryFn: () => getBuildingsByUser(userId),
    enabled: !!userId,
    ...options,
  });
};

// ========== FLOORS ==========
const createFloor = (data: any) => api.post('/floors', data);
const getAllFloors = () => api.get('/floors').then((res) => res.data);
const getFloorById = (id: number) => api.get(`/floors/${id}`).then(res => res.data);
const getFloorsByBuildingId = (buildingId: number) => api.get(`/floors/by-building/${buildingId}`).then(res => res.data);
const updateFloor = (id: number, data: any) => api.put(`/floors/${id}`, data);
const deleteFloor = (id: number) => api.delete(`/floors/${id}`);

export const useCreateFloor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => await createFloor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorsByBuilding'] });
      toast.success('Floor created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating floor:', error);
      toast.error('Failed to create floor');
    },
  });
};

export const useAllFloors = () => {
  return useQuery({
    queryKey: ['allFloors'],
    queryFn: getAllFloors,
  });
};


export const useFloorById = (id: number) => {
  return useQuery({
    queryKey: ['floor', id],
    queryFn: () => getFloorById(id),
    enabled: !!id,
  });
};

export const useFloorsByBuildingId = (buildingId: number) => {
  return useQuery({
    queryKey: ['floorsByBuilding', buildingId],
    queryFn: () => getFloorsByBuildingId(buildingId),
    enabled: !!buildingId,
  });
};

export const useUpdateFloor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await updateFloor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorsByBuilding'] });
      toast.success('Floor updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating floor:', error);
      toast.error('Failed to update floor');
    },
  });
};

export const useDeleteFloor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => await deleteFloor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorsByBuilding'] });
      toast.success('Floor deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting floor:', error);
      toast.error('Failed to delete floor');
    },
  });
};

// ========== ROUTES ==========
const createRoute = (data: any) => api.post('/routes', data);
const getRoutes = () => api.get('/routes').then(res => res.data);
const getRoutesByFloorId = (floorId: number) => api.get(`/routes/by-floor/${floorId}`).then(res => res.data);
const getRouteById = (id: number) => api.get(`/routes/${id}`).then(res => res.data);
const updateRoute = (id: number, data: any) => api.put(`/routes/${id}`, data);
const deleteRoute = (id: number) => api.delete(`/routes/${id}`);

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => await createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Route created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating route:', error);
      toast.error('Failed to create route');
    },
  });
};

export const useRoutes = () => {
  return useQuery({
    queryKey: ['routes'],
    queryFn: getRoutes,
  });
};

export const useRoutesByFloorId = (floorId: number) => {
  return useQuery({
    queryKey: ['routesByFloor', floorId],
    queryFn: () => getRoutesByFloorId(floorId),
    enabled: !!floorId,
  });
};

export const useRouteById = (id: number) => {
  return useQuery({
    queryKey: ['route', id],
    queryFn: () => getRouteById(id),
    enabled: !!id,
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Route updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => await deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Route deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    },
  });
};
