
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import PptxGenJS from 'https://esm.sh/pptxgenjs@3.12.0';

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
    const pres = new PptxGenJS();

    // Apply theme if provided
    if (theme) {
      try {
        const themeBuffer = Uint8Array.from(atob(theme), c => c.charCodeAt(0));
        // Load and apply the theme template
        await pres.load(themeBuffer);
      } catch (themeError) {
        console.error('Erreur lors de l\'application du thème:', themeError);
      }
    }

    // Add slides
    slides.forEach((slideContent: string, index: number) => {
      const slide = pres.addSlide();
      
      // Add text to slide with appropriate styling
      if (index === 0) {
        // Title slide
        slide.addText(slideContent, {
          x: 0.5,
          y: 0.3,
          w: '90%',
          h: 'auto',
          fontSize: 44,
          bold: true,
          align: 'center',
          color: '363636'
        });
      } else {
        // Content slides
        const lines = slideContent.split('\n');
        if (lines.length > 0) {
          // Add title
          slide.addText(lines[0], {
            x: 0.5,
            y: 0.3,
            w: '90%',
            h: 'auto',
            fontSize: 32,
            bold: true,
            align: 'left',
            color: '363636'
          });

          // Add content
          if (lines.length > 1) {
            const content = lines.slice(1).join('\n');
            slide.addText(content, {
              x: 0.5,
              y: 1.5,
              w: '90%',
              h: 'auto',
              fontSize: 24,
              align: 'left',
              color: '363636',
              bullet: { type: 'bullet' }
            });
          }
        }
      }
    });

    // Generate PowerPoint file with compression
    const buffer = await pres.write({ outputType: 'base64' });

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
