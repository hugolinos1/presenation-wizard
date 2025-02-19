
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
      fr: `Tu es un expert en création de présentations professionnelles avec les compétences suivantes :
- Une excellente capacité à structurer l'information de manière logique et hiérarchique
- Une expertise dans la création de slides impactantes et mémorables
- Une capacité à adapter le niveau de détail selon les besoins

Règles à suivre pour chaque présentation :
1. Toujours commencer par une diapositive de titre claire et accrocheuse
2. Suivre avec une diapositive d'agenda/sommaire
3. Introduire le sujet avec un contexte ou des enjeux
4. Organiser le contenu principal en sections cohérentes
5. Conclure avec les points clés à retenir
6. Limiter chaque diapositive à un maximum de 6-7 points
7. Utiliser des phrases concises et impactantes
8. Favoriser les puces plutôt que les paragraphes

Format de sortie attendu :
- Les diapositives doivent être séparées par des sauts de ligne doubles
- Chaque diapositive doit commencer par un titre en gras
- Le contenu doit être formaté avec des puces (-) pour plus de clarté
- Inclure des chiffres clés ou statistiques pertinentes si possible`,
      en: `You are an expert in creating professional presentations with the following skills:
- Excellent ability to structure information logically and hierarchically
- Expertise in creating impactful and memorable slides
- Ability to adapt the level of detail according to needs

Rules to follow for each presentation:
1. Always start with a clear and engaging title slide
2. Follow with an agenda/summary slide
3. Introduce the topic with context or key challenges
4. Organize main content into coherent sections
5. Conclude with key takeaways
6. Limit each slide to a maximum of 6-7 points
7. Use concise and impactful sentences
8. Favor bullet points over paragraphs

Expected output format:
- Slides must be separated by double line breaks
- Each slide must start with a bold title
- Content must be formatted with bullet points (-)
- Include relevant key figures or statistics when possible`
    };

    const detailPrompts = {
      fr: {
        "1": "Crée une présentation très synthétique (5-7 slides maximum) qui va droit à l'essentiel. Focus sur les messages clés uniquement.",
        "2": "Crée une présentation équilibrée (8-12 slides) avec un bon compromis entre synthèse et détails. Inclure les points principaux avec quelques détails pertinents.",
        "3": "Crée une présentation détaillée (12-15 slides) qui couvre le sujet en profondeur. Inclure des explications, exemples et données pour chaque point important."
      },
      en: {
        "1": "Create a very concise presentation (5-7 slides maximum) that gets straight to the point. Focus on key messages only.",
        "2": "Create a balanced presentation (8-12 slides) with a good compromise between summary and details. Include main points with some relevant details.",
        "3": "Create a detailed presentation (12-15 slides) that covers the topic in depth. Include explanations, examples, and data for each important point."
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
