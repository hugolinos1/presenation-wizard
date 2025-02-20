
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

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('key')
      .eq('service', 'mistral')
      .single();

    if (apiKeyError || !apiKeyData?.key) {
      throw new Error('Clé API Mistral non trouvée');
    }

    const { content, detailLevel, language = "fr" } = await req.json();
    console.log('Langue reçue:', language);
    console.log('Niveau de détail reçu:', detailLevel);

    const systemPrompts = {
      fr: `Tu es un expert en création de présentations PowerPoint professionnelles.
ATTENTION : Tu dois ABSOLUMENT respecter le nombre de slides demandé, c'est une contrainte OBLIGATOIRE.

Structure OBLIGATOIRE de la présentation :
1. Une slide de titre (compte comme 1 slide)
2. Une slide de plan/agenda (compte comme 1 slide)
3. Les slides de contenu
4. Une slide de conclusion (compte comme 1 slide)

Format du contenu :
- Chaque slide doit commencer par un titre clair
- Les points doivent être listés avec des tirets (-)
- Maximum 6 points par slide
- Phrases courtes et impactantes
- TOUJOURS séparer les slides par des doubles sauts de ligne

La présentation doit être en FRANÇAIS.`,
      en: `You are an expert in creating professional PowerPoint presentations.
WARNING: You MUST STRICTLY follow the requested number of slides, this is a MANDATORY constraint.

MANDATORY presentation structure:
1. Title slide (counts as 1 slide)
2. Agenda/outline slide (counts as 1 slide)
3. Content slides
4. Conclusion slide (counts as 1 slide)

Content format:
- Each slide must start with a clear title
- Points must be listed with dashes (-)
- Maximum 6 points per slide
- Short and impactful sentences
- ALWAYS separate slides with double line breaks

The presentation must be in ENGLISH.`
    };

    const detailPrompts = {
      fr: {
        "1": "CONTRAINTE STRICTE : La présentation doit faire exactement entre 3 et 5 slides AU TOTAL (en comptant le titre, le plan et la conclusion). Crée une présentation ultra-concise qui va droit à l'essentiel.",
        "2": "CONTRAINTE STRICTE : La présentation doit faire exactement entre 6 et 10 slides AU TOTAL (en comptant le titre, le plan et la conclusion). Crée une présentation équilibrée avec les points principaux.",
        "3": "CONTRAINTE STRICTE : La présentation doit faire exactement entre 11 et 15 slides AU TOTAL (en comptant le titre, le plan et la conclusion). Crée une présentation détaillée avec explications et exemples."
      },
      en: {
        "1": "STRICT CONSTRAINT: The presentation must be exactly between 3 and 5 slides IN TOTAL (including title, agenda and conclusion). Create an ultra-concise presentation that gets straight to the point.",
        "2": "STRICT CONSTRAINT: The presentation must be exactly between 6 and 10 slides IN TOTAL (including title, agenda and conclusion). Create a balanced presentation with main points.",
        "3": "STRICT CONSTRAINT: The presentation must be exactly between 11 and 15 slides IN TOTAL (including title, agenda and conclusion). Create a detailed presentation with explanations and examples."
      }
    };

    const systemPrompt = systemPrompts[language];
    const detailPrompt = detailPrompts[language][detailLevel];

    console.log('Prompt système utilisé:', systemPrompt);
    console.log('Prompt de détail utilisé:', detailPrompt);

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyData.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `${detailPrompt}\n\nSujet à traiter : ${content}\n\nRAPPEL : La présentation DOIT être en ${language === 'fr' ? 'FRANÇAIS' : 'ANGLAIS'} et respecter STRICTEMENT le nombre de slides demandé.`
          }
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
