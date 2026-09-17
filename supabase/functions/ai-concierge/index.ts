// Supabase Edge Function: ai-concierge
// Deploys to https://<project-ref>.functions.supabase.co/ai-concierge

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenAI } from 'npm:@google/genai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          message: null,
          isDemoFallback: true,
          model: 'gemini-3.8-flash (Demo Fallback)',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the Kings of Wings Pitmaster AI Concierge for Table ${payload.tableNumber || '18'}.
Customer query: "${payload.message}"
Session: ${payload.sessionId || ''}
Cart: ${JSON.stringify(payload.cartSummary || {})}
Active Order: ${JSON.stringify(payload.activeOrderStatus || null)}

Output valid JSON matching:
{
  "message": "Assistant response",
  "recommendations": [{ "menuItemId": "...", "reason": "...", "confidence": 0.9 }],
  "actions": [{ "type": "ADD_TO_CART", "menuItemId": "...", "quantity": 1 }]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return new Response(
      JSON.stringify({
        message: parsed.message,
        recommendations: parsed.recommendations || [],
        actions: parsed.actions || [],
        model: 'gemini-3.8-flash',
        isDemoFallback: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, isDemoFallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
