// Supabase Edge Function: ai-copilot
// Deploys to https://<project-ref>.functions.supabase.co/ai-copilot

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
          answer: null,
          isDemoFallback: true,
          model: 'gemini-3.8-flash (Demo Fallback)',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the Restaurant Intelligence Copilot for Kings of Wings.
Manager query: "${payload.query}"
Time Range: ${payload.timeRange || 'TODAY'}
Metrics Snapshot: ${JSON.stringify(payload.metricsSnapshot || {})}

Output valid JSON matching:
{
  "answer": "...",
  "fact": "...",
  "interpretation": "...",
  "recommendation": "...",
  "evidence": {
    "metrics": {},
    "timePeriod": "${payload.timeRange || 'Today'}",
    "calculationInputs": ["Operational Records"]
  },
  "suggestedActions": []
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
        answer: parsed.answer,
        fact: parsed.fact,
        interpretation: parsed.interpretation,
        recommendation: parsed.recommendation,
        evidence: parsed.evidence,
        suggestedActions: parsed.suggestedActions || [],
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
