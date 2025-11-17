# How to Deploy Edge Functions to Fix "Edge Function returned a non-2xx status code"

## Problem
The error "Edge Function returned a non-2xx status code" occurs because the edge functions are not deployed to your Supabase project yet. The code tries to invoke:
- `process-image`
- `analyze-face`
- `download-hq-image`

But these functions don't exist in your Supabase project.

## Solution

### Step 1: Install Supabase CLI
```bash
# macOS/Linux
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
cd /workspaces/Sparky
supabase link --project-ref iymyjcmaepnxztsuiebt
```

You can find your project ref in your Supabase dashboard URL:
`https://app.supabase.com/project/iymyjcmaepnxztsuiebt`

### Step 4: Set Environment Variables
Before deploying, set these environment variables in your Supabase Dashboard:
1. Go to: Project Settings > Edge Functions > Manage secrets
2. Add these secrets:
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `SUPABASE_SERVICE_ROLE_KEY` - Found in Project Settings > API > service_role key

### Step 5: Deploy All Functions
```bash
# Deploy all functions at once
supabase functions deploy process-image
supabase functions deploy analyze-face
supabase functions deploy download-hq-image
```

### Step 6: Verify Deployment
```bash
# List deployed functions
supabase functions list
```

## Storage Buckets Required

These functions also require these storage buckets to exist in your Supabase project:
1. `image-processing-uploads` (private) - For temporary uploads
2. `generations` (public) - For optimized JPEG outputs
3. `generations-hq` (private) - For original PNG files

Create them in: Storage > New bucket

## Alternative: Disable Features Temporarily

If you want to test other parts of the app without deploying edge functions, you can comment out the edge function calls in:
- `/workspaces/Sparky/services/geminiService.ts`

And return mock data instead.

## Troubleshooting

### "Function not found" (404)
- Function not deployed. Run deploy command again.

### "Internal Server Error" (500)
- Check function logs: `supabase functions logs process-image`
- Verify environment variables are set correctly
- Ensure storage buckets exist

### "Unauthorized" (401)
- Check that you're passing the Authorization header
- Verify user is logged in

