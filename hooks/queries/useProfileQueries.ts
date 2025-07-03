import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { profileService } from '../../services/profile/ProfileService'; // Placeholder
import { queryKeys } from '../../utils/queryClient';
import { ProfileUpdateSchema, validateData, getValidationErrors } from '../../validation/schemas';

// Placeholder profileService
const profileService = {
  getProfile: async (userId: string) => ({ id: userId, name: 'Test User', email: 'test@example.com' }),
  updateProfile: async (userId: string, data: any) => ({ ...data, id: userId }),
};

export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.profile.detail(userId),
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId && userId !== 'guest',
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const validationResult = validateData(ProfileUpdateSchema, data);
      if (!validationResult.success) {
        const errors = getValidationErrors(validationResult.errors);
        throw new Error('Validation failed: ' + JSON.stringify(errors));
      }
      return profileService.updateProfile(userId, data);
    },
    onSuccess: (updatedProfile, { userId }) => {
      queryClient.setQueryData(queryKeys.profile.detail(userId), updatedProfile);
    },
    onError: (error) => {
      console.error('Update profile mutation error:', error);
    },
  });
};

export const useProfileData = (userId: string) => {
  const profileQuery = useProfile(userId);
  const updateProfileMutation = useUpdateProfile();
  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: (data: any) => updateProfileMutation.mutateAsync({ userId, data }),
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
    refetchProfile: profileQuery.refetch,
  };
}; 