
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

    const systemPrompts = {
      fr: `Tu es un expert en création de présentations professionnelles. Ta mission est de créer une présentation claire et impactante en respectant STRICTEMENT les contraintes suivantes :

Structure obligatoire :
1. Une diapositive de titre accrocheuse
2. Une diapositive de plan/agenda
3. Les diapositives de contenu
4. Une diapositive de conclusion

Règles de formatage :
- Commence chaque diapositive par un titre en gras
- Utilise des puces (-) pour lister les points
- Maximum 6 points par diapositive
- Phrases courtes et percutantes
- Sépare les diapositives par des sauts de ligne doubles

Instructions clés :
- Adapte le niveau de détail au format demandé
- Priorise les informations selon l'espace disponible
- Garde une progression logique dans le contenu
- Termine par des points clés à retenir`,
      en: `You are an expert in creating professional presentations. Your mission is to create a clear and impactful presentation by STRICTLY following these constraints:

Mandatory structure:
1. An engaging title slide
2. An agenda/outline slide
3. Content slides
4. A conclusion slide

Formatting rules:
- Start each slide with a bold title
- Use bullet points (-) to list items
- Maximum 6 points per slide
- Short and impactful sentences
- Separate slides with double line breaks

Key instructions:
- Adapt detail level to the requested format
- Prioritize information based on available space
- Maintain logical content progression
- End with key takeaways`
    };

    const detailPrompts = {
      fr: {
        "1": "Format synthétique (3-5 slides) : Crée une présentation ultra-concise qui va droit à l'essentiel. Ne garde que les messages absolument essentiels.",
        "2": "Format standard (6-10 slides) : Crée une présentation équilibrée avec les points principaux et quelques détails pertinents.",
        "3": "Format détaillé (11-15 slides) : Crée une présentation exhaustive qui couvre le sujet en profondeur avec explications et exemples."
      },
      en: {
        "1": "Concise format (3-5 slides): Create an ultra-concise presentation that gets straight to the point. Keep only absolutely essential messages.",
        "2": "Standard format (6-10 slides): Create a balanced presentation with main points and some relevant details.",
        "3": "Detailed format (11-15 slides): Create a comprehensive presentation that covers the topic in depth with explanations and examples."
      }
    };

    const systemPrompt = systemPrompts[language];
    const detailPrompt = detailPrompts[language][detailLevel];

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
          { role: "user", content: `${detailPrompt}\n\n${language === "fr" ? "Sujet de la présentation" : "Presentation topic"} : ${content}` }
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
