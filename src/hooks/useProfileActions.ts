import { supabase } from '@/integrations/supabase/client';

export const refetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Failed to refetch profile:', error);
    return null;
  }

  return data;
}; 