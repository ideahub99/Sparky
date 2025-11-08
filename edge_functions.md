# Sparky Edge Functions: Implementation Guide (Updated)

This document provides implementation details and code examples for the Supabase Edge Functions that power the Sparky application's backend logic. These server-side functions are crucial for security (protecting API keys) and performance.

**Core Concepts:**
-   **Security:** Functions are invoked with the user's authentication context. We use this to enforce permissions. All sensitive operations are performed using a `SERVICE_ROLE_KEY` to bypass RLS policies where necessary.
-   **Environment Variables:** All secrets (like `GEMINI_API_KEY`) are stored as environment variables in the Supabase dashboard, never in the code.
-   **Error Handling:** Functions return structured JSON responses, including clear error messages that the client can display.

---
## CORS Headers

To handle Cross-Origin Resource Sharing (CORS), especially for preflight `OPTIONS` requests, we will define a `corsHeaders` constant at the top of each Edge Function file. While sharing this code in a common file is a good practice, it can sometimes lead to bundling issues during deployment. For simplicity and reliability, we will include it directly in each function that needs it.

---

## 1. `process-image` Function

This is the primary function for all generative image tools. It securely handles the entire workflow from credit checking, image generation, optimization, and storage.

**File:** `supabase/functions/process-image/index.ts`

### Logic Flow:
1.  Handles CORS preflight requests.
2.  Initializes a Supabase Admin client using the secure `SERVICE_ROLE_KEY`.
3.  Authenticates the user and validates the request, which now contains a `storagePath` instead of raw image data.
4.  **Downloads the user's image** from the temporary `image-processing-uploads` bucket.
5.  Fetches the user's profile to check their credit balance and plan.
6.  Calls the Gemini API to transform the image, receiving a high-quality PNG.
7.  **Optimizes the image:** Creates an optimized JPEG for display and keeps the original PNG for HQ downloads.
8.  **Uploads to Storage:**
    -   The original PNG is uploaded to the private `generations-hq` bucket.
    -   The optimized JPEG is uploaded to the public `generations` bucket.
9.  Inserts records into the `credit_usage` and `generations` tables.
10. **Cleans up** by deleting the temporary image from `image-processing-uploads`.
11. Returns the `generationId` and the base64 data of the *optimized JPEG* to the client.

### Deployable Code (`index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0'
import { GoogleGenAI, Modality } from 'npm:@google/genai@^1.23.0'
import jimp from 'https://esm.sh/jimp@0.22.10';
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generatePrompt(tool, params) {
    let textPrompt = `Apply the ${tool.name} transformation.`;
    switch(tool.id) {
        case 'hairstyle':
            textPrompt = `Change the hairstyle to "${params.style}".`;
            if (params.color) textPrompt += ` The hair color should be ${params.color}.`;
            break;
        case 'hair-color': textPrompt = `Change the hair color to ${params.color}.`; break;
        case 'eye-color': textPrompt = `Change the eye color to ${params.color}.`; break;
        case 'skin-color': textPrompt = `Change the skin tone to ${params.skinTone}.`; break;
        case 'age': textPrompt = `Make the person in the image look ${params.age} years old.`; break;
        case 'smile': textPrompt = `Add a natural smile to the person's face with an intensity of ${params.intensity}%.`; break;
        case 'fat': textPrompt = `Make the person in the image look heavier by an intensity of ${params.intensity}%.`; break;
        case 'bald': textPrompt = `Make the person in the image look bald with an intensity of ${params.intensity}%.`; break;
        case 'beard': textPrompt = `Apply a "${params.beardStyle}" beard style.`; break;
        case 'halloween': textPrompt = `Apply a halloween filter. The style should focus on "${params.halloweenStyle}".`; break;
    }
    return textPrompt;
}

const bufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let storagePathToDelete: string | null = null;

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    const { tool, params, storagePath } = await req.json();
    if (!tool || !params || !storagePath) {
        throw new Error('Missing required parameters.');
    }
    storagePathToDelete = storagePath;

    // Download image from temporary storage
    const { data: imageBlob, error: downloadError } = await supabaseAdmin.storage
      .from('image-processing-uploads')
      .download(storagePath);
    
    if (downloadError) throw downloadError;
    if (!imageBlob) throw new Error('Failed to download image from storage.');

    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBase64 = bufferToBase64(imageBuffer);
    const imageMimeType = imageBlob.type;

    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('*, plans(name)').eq('id', user.id).single();
    if (profileError) throw profileError;
    if (userProfile.credits < 1) throw new Error('Insufficient credits.');

    if (tool.id === 'hairstyle' && params.style) {
        const { data: hs } = await supabaseAdmin.from('hairstyles').select('is_pro').eq('name', params.style).single();
        if (hs?.is_pro && userProfile.plans?.name === 'Free') {
             return new Response(JSON.stringify({ error: 'This is a Pro feature. Please upgrade.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402,
            });
        }
    }

    const textPrompt = generatePrompt(tool, params);
    const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY')! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: imageBase64, mimeType: imageMimeType } }, { text: textPrompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
      
    const imgPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imgPart?.inlineData?.data) {
        throw new Error(`API call failed: ${response.promptFeedback?.blockReason || 'No image data returned'}`);
    }

    // --- Image Processing and Optimization ---
    const originalPngBase64 = imgPart.inlineData.data;
    const originalPngBytes = Uint8Array.from(atob(originalPngBase64), c => c.charCodeAt(0));
    
    // FIX: Robustly handle CJS/ESM interop for the Jimp library.
    const Jimp = (jimp as any).default || jimp;
    
    const jimpImageBuffer = Buffer.from(originalPngBytes);
    const image = await Jimp.read(jimpImageBuffer);
    await image.quality(75);
    const optimizedJpegBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    const optimizedJpegBytes = new Uint8Array(optimizedJpegBuffer);
    const optimizedJpegBase64 = bufferToBase64(optimizedJpegBytes.buffer);

    // --- Storage Operations ---
    const filenameBase = `${tool.id}-${Date.now()}`;
    const hqPngPath = `${user.id}/${filenameBase}.png`;
    const optimizedJpegPath = `${user.id}/${filenameBase}.jpeg`;

    const { error: hqUploadError } = await supabaseAdmin.storage.from('generations-hq').upload(hqPngPath, originalPngBytes, { contentType: 'image/png' });
    if (hqUploadError) throw hqUploadError;

    const { error: optimizedUploadError } = await supabaseAdmin.storage.from('generations').upload(optimizedJpegPath, optimizedJpegBytes, { contentType: 'image/jpeg' });
    if (optimizedUploadError) throw optimizedUploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage.from('generations').getPublicUrl(optimizedJpegPath);

    // --- Database Inserts ---
    const { error: usageError } = await supabaseAdmin.from('credit_usage').insert({ user_id: user.id, tool_id: tool.id, credits_used: 1 });
    if (usageError) throw usageError;

    const { data: generationData, error: genError } = await supabaseAdmin.from('generations')
      .insert({ user_id: user.id, tool_id: tool.id, image_url: publicUrl, image_url_hq: hqPngPath })
      .select('id').single();
    if (genError) throw genError;
    if (!generationData) throw new Error('Failed to create generation record.');

    // --- Cleanup and Response ---
    await supabaseAdmin.storage.from('image-processing-uploads').remove([storagePath]);
    storagePathToDelete = null;

    return new Response(JSON.stringify({ newImageBase64: optimizedJpegBase64, generationId: generationData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // If an error occurred, try to clean up the temp file
    if (storagePathToDelete) {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        await supabaseAdmin.storage.from('image-processing-uploads').remove([storagePathToDelete]);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

---

## 2. `analyze-face` Function

Handles requests for the facial analysis tool. It now also uses the direct-to-storage upload method to avoid payload size limits.

**File:** `supabase/functions/analyze-face/index.ts`

### Deployable Code (`index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0'
import { GoogleGenAI, Type } from 'npm:@google/genai@^1.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        faceShape: { type: Type.STRING }, symmetryScore: { type: Type.NUMBER },
        youthfulnessScore: { type: Type.NUMBER }, skinClarity: { type: Type.NUMBER },
        overallAnalysis: { type: Type.STRING }, eyeShape: { type: Type.STRING },
        jawlineDefinitionScore: { type: Type.NUMBER }, cheekboneProminenceScore: { type: Type.NUMBER },
        lipFullnessScore: { type: Type.NUMBER }, skinEvennessScore: { type: Type.NUMBER },
        goldenRatioScore: { type: Type.NUMBER }, emotionalExpression: { type: Type.STRING },
        perceivedAge: { type: Type.INTEGER },
    },
    required: [ 'faceShape', 'symmetryScore', 'youthfulnessScore', 'skinClarity', 'overallAnalysis', 'eyeShape', 'jawlineDefinitionScore', 'cheekboneProminenceScore', 'lipFullnessScore', 'skinEvennessScore', 'goldenRatioScore', 'emotionalExpression', 'perceivedAge' ]
};

const bufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let storagePathToDelete: string | null = null;

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    const { storagePath } = await req.json();
    if (!storagePath) throw new Error('Missing storage path.');
    storagePathToDelete = storagePath;

    // Download image from temporary storage
    const { data: imageBlob, error: downloadError } = await supabaseAdmin.storage
      .from('image-processing-uploads')
      .download(storagePath);

    if (downloadError) throw downloadError;
    if (!imageBlob) throw new Error('Failed to download image from storage.');

    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBase64 = bufferToBase64(imageBuffer);
    const imageMimeType = imageBlob.type;

    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('credits').eq('id', user.id).single();
    if (profileError) throw profileError;
    if (userProfile.credits < 1) throw new Error('Insufficient credits.');

    const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY')! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [
            { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
            { text: 'Analyze the facial features in this image and provide a detailed report according to the provided JSON schema.' },
        ]},
        config: { responseMimeType: "application/json", responseSchema: analysisSchema },
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7, -3);
    }
    const analysisResult = JSON.parse(jsonText);

    await supabaseAdmin.from('credit_usage').insert({ user_id: user.id, tool_id: 'analysis', credits_used: 1 });
    await supabaseAdmin.from('generations').insert({ user_id: user.id, tool_id: 'analysis' });

    await supabaseAdmin.storage.from('image-processing-uploads').remove([storagePath]);
    storagePathToDelete = null;

    return new Response(JSON.stringify({ analysisResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (error) {
     if (storagePathToDelete) {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        await supabaseAdmin.storage.from('image-processing-uploads').remove([storagePathToDelete]);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
```
---
## 3. `download-hq-image` Function

This function allows Pro users to securely download the original, high-quality PNG version of their generated images. It generates a short-lived, secure download URL.

**File:** `supabase/functions/download-hq-image/index.ts`

### Deployable Code (`index.ts`):
```typescript
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
```

---

## 4. `inactive-user-notifier` Function

This is a scheduled function (cron job) that runs periodically to find users who haven't used the app recently and sends them a "welcome back" notification.

**File:** `supabase/functions/inactive-user-notifier/index.ts`

### Logic Flow:
1. Initialize a Supabase Admin client.
2. Calculate a timestamp for the inactivity threshold (e.g., 5 hours ago).
3. Query the `users` table for users whose `last_active_at` is older than the threshold.
4. Construct a batch of notification objects for these inactive users.
5. Insert the new notifications into the `notifications` table.
6. Supabase Realtime will automatically push these new notifications to any active clients.

### Scheduling:
This function is not meant to be called by a user. It must be scheduled to run automatically.
1. Deploy the function: `supabase functions deploy inactive-user-notifier`
2. Schedule it to run (e.g., every hour) using a cron expression. You can do this in the Supabase Dashboard under **Database -> Cron Jobs** or by adding the schedule to your `config.toml` file.
   - **Example Cron Schedule (every hour):** `0 * * * *`

### Deployable Code (`index.ts`):
```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Find users whose last activity was more than 5 hours ago.
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

    const { data: inactiveUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .lt('last_active_at', fiveHoursAgo);
      
    if (fetchError) throw fetchError;
    if (!inactiveUsers || inactiveUsers.length === 0) {
      return new Response(JSON.stringify({ message: "No inactive users found." }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Prepare notifications to insert
    const notifications = inactiveUsers.map((user) => ({
      user_id: user.id,
      type: 'general',
      title_key: 'notifications.general_welcome.title',
      message_key: 'notifications.general_welcome.message',
    }));

    if (notifications.length > 0) {
      // 3. Insert notifications into the database
      const { error: insertError } = await supabaseAdmin.from('notifications').insert(notifications);
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ message: `Sent ${notifications.length} notifications.` }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 5. `payment-webhooks` Function

*This is a conceptual, deployable example. A real implementation would need to be adapted to your chosen payment provider's specific payload and signature verification method.*

**File:** `supabase/functions/payment-webhooks/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

// Example HMAC verification for Paymob
async function verifyPaymobHmac(request: Request, body: string): Promise<boolean> {
  const hmacFromQuery = new URL(request.url).searchParams.get("hmac");
  if (!hmacFromQuery) return false;

  const secret = Deno.env.get("PAYMOB_HMAC_SECRET")!;
  const data = JSON.parse(body);
  const hmacString = `${data.amount_cents}${data.created_at}${data.currency}${data.error_occured}${data.has_parent_transaction}${data.id}${data.integration_id}${data.is_3d_secure}${data.is_auth}${data.is_capture}${data.is_refunded}${data.is_standalone_payment}${data.is_voided}${data.order.id}${data.owner}${data.pending}${data.source_data.pan}${data.source_data.sub_type}${data.source_data.type}${data.success}`;
  const calculatedHmac = createHmac("sha512", secret).update(hmacString).digest("hex");
  
  return hmacFromQuery === calculatedHmac;
}

serve(async (req) => {
    try {
        const body = await req.text();
        const isValid = await verifyPaymobHmac(req, body);

        if (!isValid) {
            return new Response(JSON.stringify({ error: 'Invalid HMAC signature' }), { status: 401 });
        }
        
        const payload = JSON.parse(body);
        const transaction = payload.obj;
        
        // Process only successful, completed transactions
        if (payload.type === 'TRANSACTION' && transaction.success === true && transaction.pending === false) {
            // We store the user ID and target plan ID in the merchant_order_id
            const orderId = transaction.order.merchant_order_id; 
            const [userId, planIdToUpgrade] = orderId.split('::');

            if (!userId || !planIdToUpgrade) throw new Error(`Invalid order ID format: ${orderId}`);
            
            const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

            // Update the user's plan
            const { error } = await supabaseAdmin
                .from('users')
                .update({ plan_id: parseInt(planIdToUpgrade, 10) })
                .eq('id', userId);
            
            if (error) throw new Error(`Failed to upgrade plan for user ${userId}: ${error.message}`);
        }
        
        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error) {
        console.error('Webhook Error:', error.message);
        return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 500 });
    }
});
```