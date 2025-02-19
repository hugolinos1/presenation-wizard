
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
        // Decode the base64 theme data
        const themeBuffer = Uint8Array.from(atob(theme), c => c.charCodeAt(0));
        
        // Create a temporary presentation with the theme
        const themePres = new PptxGenJS();
        await themePres.load({ data: themeBuffer });
        
        // Apply the master slide from the theme
        if (themePres.masters && themePres.masters.length > 0) {
          const masterSlide = themePres.masters[0];
          pres.defineSlideMaster({
            title: masterSlide.title,
            background: masterSlide.background,
            objects: masterSlide.objects,
            slideNumber: masterSlide.slideNumber,
          });
        }

        // Copy theme properties
        if (themePres.layout) pres.layout = themePres.layout;
        if (themePres.theme) pres.theme = themePres.theme;
      } catch (themeError) {
        console.error('Erreur lors de l\'application du thème:', themeError);
      }
    }

    // Add slides
    slides.forEach((slideContent: string, index: number) => {
      const slide = pres.addSlide();
      
      // Split content into title and points
      const lines = slideContent.split('\n');
      const title = lines[0].replace(/^[#\s]+/, ''); // Remove any # or spaces from start
      const content = lines.slice(1);

      if (index === 0) {
        // Title slide
        slide.addText([{ 
          text: title,
          options: {
            x: '5%',
            y: '40%',
            w: '90%',
            h: 'auto',
            fontSize: 44,
            bold: true,
            align: 'center',
            color: '363636'
          }
        }]);
      } else {
        // Content slides
        // Add title
        slide.addText([{
          text: title,
          options: {
            x: '5%',
            y: '5%',
            w: '90%',
            h: 'auto',
            fontSize: 32,
            bold: true,
            color: '363636'
          }
        }]);

        // Add bullet points
        if (content.length > 0) {
          const bulletPoints = content
            .filter(line => line.trim())
            .map(line => line.trim().replace(/^[-•]\s*/, ''));

          if (bulletPoints.length > 0) {
            // Convert bullet points to text objects array
            const textObjects = bulletPoints.map(point => ({
              text: point,
              options: {
                bullet: true
              }
            }));

            slide.addText(textObjects, {
              x: '5%',
              y: '25%',
              w: '90%',
              h: 'auto',
              fontSize: 24,
              color: '363636'
            });
          }
        }
      }
    });

    // Generate PowerPoint file
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
