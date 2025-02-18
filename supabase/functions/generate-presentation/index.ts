
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer la clé API de la base de données
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .single();

    if (apiKeyError || !apiKeyData?.api_key) {
      throw new Error('Clé API non trouvée');
    }

    const { content, detailLevel } = await req.json();

    // Construction du prompt en fonction du niveau de détail
    let systemPrompt = "Tu es un expert en création de présentations professionnelles. ";
    if (detailLevel === "concis") {
      systemPrompt += "Crée une présentation concise avec les points essentiels uniquement.";
    } else if (detailLevel === "detaille") {
      systemPrompt += "Crée une présentation détaillée avec des explications approfondies.";
    } else {
      systemPrompt += "Crée une présentation équilibrée avec un niveau de détail modéré.";
    }

    // Appel à l'API Mistral
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyData.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Génère une présentation PowerPoint sur le sujet suivant: ${content}. 
            Format attendu: Une liste de textes séparés par des sauts de ligne doubles, chaque texte représentant une diapositive.
            Commence par une diapositive de titre, puis une introduction, le contenu principal, et une conclusion.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API Mistral: ${response.statusText}`);
    }

    const data = await response.json();
    const slides = data.choices[0].message.content.split('\n\n');

    return new Response(JSON.stringify({ slides }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur dans generate-presentation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
