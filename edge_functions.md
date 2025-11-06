# Sparky Edge Functions: Implementation Guide

This document provides implementation details and code examples for the Supabase Edge Functions that power the Sparky application's backend logic. These server-side functions are crucial for security (protecting API keys) and performance.

**Core Concepts:**
-   **Security:** Functions are invoked with the user's authentication context. We use this to enforce permissions. All sensitive operations are performed using a `SERVICE_ROLE_KEY` to bypass RLS policies where necessary.
-   **Environment Variables:** All secrets (like `GEMINI_API_KEY`) are stored as environment variables in the Supabase dashboard, never in the code.
-   **Error Handling:** Functions return structured JSON responses, including clear error messages that the client can display.

---
## Shared Utilities

It's best practice to create shared files for common logic like CORS headers. Create a `_shared` folder inside your `supabase/functions` directory.

### CORS Headers

**File:** `supabase/functions/_shared/cors.ts`
```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 1. `process-image` Function

This is the primary function for all generative image tools. It securely handles the entire workflow from credit checking to image generation and storage.

**File:** `supabase/functions/process-image/index.ts`

### Logic Flow:
1.  Handles CORS preflight requests.
2.  Initializes a Supabase Admin client using the secure `SERVICE_ROLE_KEY`.
3.  Authenticates the user via their JWT from the `Authorization` header.
4.  Validates the incoming request body (`tool`, `params`, `imageBase64`).
5.  Fetches the user's profile to check their current credit balance.
6.  Checks if a Pro-tier hairstyle is being used by a Free-tier user.
7.  Constructs the specific, detailed text prompt for the Gemini API based on the tool and parameters.
8.  Calls the Gemini API to transform the image.
9.  Decodes the base64 response and uploads the resulting image to Supabase Storage.
10. Inserts a record into the `credit_usage` table, which triggers the automatic credit deduction on the database.
11. Inserts a record into the `generations` table with the public URL of the new image.
12. Returns the newly generated image's base64 data and public URL to the client.

### Deployable Code (`index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0'
import { GoogleGenAI, Modality } from 'npm:@google/genai@^1.23.0'
import { corsHeaders } from '../_shared/cors.ts'

// Helper to generate the specific prompt for Gemini
function generatePrompt(tool, params) {
    let textPrompt = `Apply the ${tool.name} transformation.`;
    switch(tool.id) {
        case 'hairstyle':
            textPrompt = `Change the hairstyle to "${params.style}".`;
            if (params.color) textPrompt += ` The hair color should be ${params.color}.`;
            break;
        case 'hair-color': textPrompt = `Change the hair color to ${params.color}.`; break;
        case 'eye-color': textPrompt = `Change the eye color to ${params.eyeColor}.`; break;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    const { tool, params, imageBase64, imageMimeType } = await req.json();
    if (!tool || !params || !imageBase64 || !imageMimeType) {
        throw new Error('Missing required parameters.');
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users').select('credits, plan_id').eq('id', user.id).single();
    if (profileError) throw profileError;
    if (userProfile.credits < 1) throw new Error('Insufficient credits.');

    const { data: plan } = await supabaseAdmin.from('plans').select('name').eq('id', userProfile.plan_id).single();
    if (tool.id === 'hairstyle' && params.style) {
        const { data: hs } = await supabaseAdmin.from('hairstyles').select('is_pro').eq('name', params.style).single();
        if (hs?.is_pro && plan?.name === 'Free') {
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
      
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      if (response.promptFeedback?.blockReason) {
          throw new Error(`Blocked for safety: ${response.promptFeedback.blockReason}`);
      }
      throw new Error('API did not return a valid image candidate.');
    }

    const imgPart = candidate.content.parts.find(p => p.inlineData);
    if (!imgPart?.inlineData?.data) throw new Error('No image data in API response.');
    
    const newImageBase64 = imgPart.inlineData.data;
    const byteString = atob(newImageBase64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) intArray[i] = byteString.charCodeAt(i);
    const newImageBlob = new Blob([intArray], { type: 'image/png' });
    
    const filePath = `${user.id}/${tool.id}-${Date.now()}.png`;
    const { error: uploadError } = await supabaseAdmin.storage.from('generations').upload(filePath, newImageBlob);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage.from('generations').getPublicUrl(filePath);

    const { error: usageError } = await supabaseAdmin.from('credit_usage').insert({ user_id: user.id, tool_id: tool.id, credits_used: 1 });
    if (usageError) throw usageError;

    const { error: genError } = await supabaseAdmin.from('generations').insert({ user_id: user.id, tool_id: tool.id, image_url: publicUrl });
    if (genError) throw genError;

    return new Response(JSON.stringify({ newImageBase64 }), {
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

## 2. `analyze-face` Function

Handles requests for the facial analysis tool. It's similar to `process-image` but works with JSON data and a different Gemini model.

**File:** `supabase/functions/analyze-face/index.ts`

### Deployable Code (`index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0'
import { GoogleGenAI, Type } from 'npm:@google/genai@^1.23.0'
import { corsHeaders } from '../_shared/cors.ts'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    const { imageBase64, imageMimeType } = await req.json();
    if (!imageBase64 || !imageMimeType) throw new Error('Missing image data.');

    const { data: userProfile, error: profileError } = await supabaseAdmin.from('users').select('credits').eq('id', user.id).single();
    if (profileError) throw profileError;
    if (userProfile.credits < 1) throw new Error('Insufficient credits.');

    const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY')! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [
            { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
            { text: 'Analyze the facial features in this image and provide a detailed report according to the provided JSON schema.' },
        ]},
        config: { responseMimeType: "application/json", responseSchema: analysisSchema },
    });

    const analysisResult = JSON.parse(response.text.trim());

    await supabaseAdmin.from('credit_usage').insert({ user_id: user.id, tool_id: 'analysis', credits_used: 1 });
    await supabaseAdmin.from('generations').insert({ user_id: user.id, tool_id: 'analysis' });

    return new Response(JSON.stringify({ analysisResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
```
---

## 3. `payment-webhooks` Function

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