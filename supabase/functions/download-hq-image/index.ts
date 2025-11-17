import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    const { generationId } = await req.json();
    if (!generationId) throw new Error('Missing generationId.');

    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('*, plans(name)').eq('id', user.id).single();
    if (profileError) throw profileError;
    if (userProfile.plans?.name === 'Free') {
        throw new Error('High-quality download is a Pro feature.');
    }

    const { data: generation, error: genError } = await supabaseAdmin.from('generations').select('user_id, image_url_hq').eq('id', generationId).single();
    if (genError) throw genError;
    if (!generation) throw new Error('Generation not found.');
    if (generation.user_id !== user.id) throw new Error('Forbidden: You do not own this generation.');
    if (!generation.image_url_hq) throw new Error('High-quality version not available for this generation.');

    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage.from('generations-hq').createSignedUrl(generation.image_url_hq, 60); // Expires in 60 seconds
    if (urlError) throw urlError;

    return new Response(JSON.stringify({ signedUrl: signedUrlData.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
