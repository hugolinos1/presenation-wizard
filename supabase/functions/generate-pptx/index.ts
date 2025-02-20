
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
    console.log('Début de la génération de présentation');
    
    const pres = new PptxGenJS();

    // Ajout des slides
    slides.forEach((slideContent: string, index: number) => {
      console.log(`Création de la slide ${index + 1}`);
      const slide = pres.addSlide();
      
      // Traitement du contenu
      const lines = slideContent.split('\n');
      const title = lines[0].replace(/^[#\s]+/, '');
      const content = lines.slice(1);

      if (index === 0) {
        // Slide de titre
        slide.addText(title, {
          x: '5%',
          y: '40%',
          w: '90%',
          h: 'auto',
          fontSize: 44,
          bold: true,
          align: 'center'
        });
      } else {
        // Slides de contenu
        slide.addText(title, {
          x: '5%',
          y: '5%',
          w: '90%',
          h: 'auto',
          fontSize: 32,
          bold: true
        });

        if (content.length > 0) {
          const bulletPoints = content
            .filter(line => line.trim())
            .map(line => line.trim().replace(/^[-•]\s*/, ''));

          if (bulletPoints.length > 0) {
            slide.addText(bulletPoints, {
              x: '5%',
              y: '25%',
              w: '90%',
              h: 'auto',
              fontSize: 24,
              bullet: true
            });
          }
        }
      }
    });

    // Application du thème si fourni
    if (theme) {
      try {
        console.log('Application du thème...');
        const themeBuffer = Uint8Array.from(atob(theme), c => c.charCodeAt(0));
        await pres.load({ data: themeBuffer });
        console.log('Thème appliqué avec succès');
      } catch (themeError) {
        console.error('Erreur lors de l\'application du thème:', themeError);
      }
    }

    console.log('Génération du fichier PowerPoint...');
    const buffer = await pres.write({ outputType: 'base64' });
    console.log('Présentation générée avec succès');

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
