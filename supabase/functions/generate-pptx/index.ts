
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
    const { slides, theme, themeFileName } = await req.json();
    console.log('Thème reçu:', !!theme);
    console.log('Nom du fichier thème:', themeFileName);
    
    // Create a new PowerPoint presentation
    const pres = new PptxGenJS();

    // Apply theme if provided
    if (theme) {
      try {
        console.log('Application du thème...');
        const themeBuffer = Uint8Array.from(atob(theme), c => c.charCodeAt(0));
        
        // Load theme directly into the main presentation
        await pres.load({ 
          data: themeBuffer,
          fileName: themeFileName 
        });
        console.log('Thème chargé avec succès');
      } catch (themeError) {
        console.error('Erreur lors de l\'application du thème:', themeError);
      }
    }

    // Add slides
    slides.forEach((slideContent: string, index: number) => {
      const slide = pres.addSlide();
      
      // Split content into title and points
      const lines = slideContent.split('\n');
      const title = lines[0].replace(/^[#\s]+/, '');
      const content = lines.slice(1);

      if (index === 0) {
        // Title slide - using master if available
        if (pres.masters && pres.masters.length > 0) {
          slide.addText([{ 
            text: title,
            options: {
              x: '5%',
              y: '40%',
              w: '90%',
              h: 'auto',
              fontSize: 44,
              bold: true,
              align: 'center'
            }
          }]);
        } else {
          // Fallback if no master
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
        }
      } else {
        // Content slides
        slide.addText([{
          text: title,
          options: {
            x: '5%',
            y: '5%',
            w: '90%',
            h: 'auto',
            fontSize: 32,
            bold: true
          }
        }]);

        if (content.length > 0) {
          const bulletPoints = content
            .filter(line => line.trim())
            .map(line => line.trim().replace(/^[-•]\s*/, ''));

          if (bulletPoints.length > 0) {
            const textObjects = bulletPoints.map(point => ({
              text: point,
              options: { bullet: true }
            }));

            slide.addText(textObjects, {
              x: '5%',
              y: '25%',
              w: '90%',
              h: 'auto',
              fontSize: 24,
              color: theme ? undefined : '363636' // Use theme colors if theme is provided
            });
          }
        }
      }
    });

    console.log('Génération du fichier PowerPoint...');
    const buffer = await pres.write({ outputType: 'base64' });
    console.log('Fichier PowerPoint généré avec succès');

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
