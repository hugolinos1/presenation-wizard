
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import * as pptxgen from 'https://esm.sh/pptxgenjs@3.12.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slides, theme } = await req.json();
    
    // Create a new PowerPoint presentation
    const pres = new pptxgen();

    // Apply theme if provided
    if (theme) {
      // TODO: Apply theme settings
      pres.theme = {
        // Apply theme properties
      };
    }

    // Add slides
    slides.forEach((slideContent: string, index: number) => {
      const slide = pres.addSlide();
      
      // Add text to slide
      slide.addText(slideContent, {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 'auto',
        fontSize: index === 0 ? 44 : 24, // Larger font for title slide
        align: index === 0 ? 'center' : 'left',
      });
    });

    // Generate PowerPoint file
    const buffer = await pres.write('base64');

    return new Response(
      JSON.stringify({ 
        file: buffer,
        message: 'Présentation générée avec succès'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Erreur lors de la génération du PPTX:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
