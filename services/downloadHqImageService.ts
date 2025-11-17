import { supabase } from '../lib/supabaseClient';

export const downloadHqImageService = async (generationId: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Check user plan
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*, plans(name)')
    .eq('id', user.id)
    .single();
  
  if (profileError) throw profileError;
  if (userProfile.plans?.name === 'Free') {
    throw new Error('High-quality download is a Pro feature.');
  }

  // Get generation
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .select('user_id, image_url_hq')
    .eq('id', generationId)
    .single();
  
  if (genError) throw genError;
  if (!generation) throw new Error('Generation not found.');
  if (generation.user_id !== user.id) throw new Error('Forbidden: You do not own this generation.');
  if (!generation.image_url_hq) throw new Error('High-quality version not available for this generation.');

  // Create signed URL
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('generations-hq')
    .createSignedUrl(generation.image_url_hq, 60); // Expires in 60 seconds
  
  if (urlError) throw urlError;

  return signedUrlData.signedUrl;
};
