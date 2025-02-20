
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
    console.log('Début de la génération de la présentation');
    console.log('Thème présent:', !!theme);
    console.log('Nom du fichier thème:', themeFileName);
    
    let pres = new PptxGenJS();
    let masterPres;

    // Si un thème est fourni, on l'applique d'abord
    if (theme) {
      try {
        console.log('Décodage et application du thème...');
        const themeBuffer = Uint8Array.from(atob(theme), c => c.charCodeAt(0));
        
        // Création d'une présentation temporaire pour extraire le thème
        masterPres = new PptxGenJS();
        await masterPres.load({ 
          data: themeBuffer
        });
        console.log('Thème chargé dans la présentation temporaire');

        // Copie des propriétés du thème
        if (masterPres.masters && masterPres.masters.length > 0) {
          console.log('Masters trouvés dans le thème:', masterPres.masters.length);
          masterPres.masters.forEach((master, idx) => {
            console.log(`Copie du master ${idx + 1}`);
            pres.defineSlideMaster({
              title: master.title || `Master_${idx}`,
              background: master.background,
              objects: master.objects,
              slideNumber: master.slideNumber
            });
          });
        }

        // Copie des layouts
        if (masterPres.layout) {
          console.log('Copie du layout du thème');
          pres.layout = masterPres.layout;
        }

        // Copie des couleurs et autres propriétés du thème
        if (masterPres.theme) {
          console.log('Copie des propriétés du thème');
          pres.theme = masterPres.theme;
        }

        console.log('Thème appliqué avec succès');
      } catch (themeError) {
        console.error('Erreur lors de l\'application du thème:', themeError);
      }
    }

    // Ajout des slides
    slides.forEach((slideContent: string, index: number) => {
      console.log(`Création de la slide ${index + 1}`);
      // Si on a des masters, on utilise le premier pour la slide de titre
      const slide = index === 0 && pres.masters && pres.masters.length > 0
        ? pres.addSlide({ masterName: pres.masters[0].title })
        : pres.addSlide();
      
      const lines = slideContent.split('\n');
      const title = lines[0].replace(/^[#\s]+/, '');
      const content = lines.slice(1);

      if (index === 0) {
        // Slide de titre
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
        // Slides de contenu
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
              fontSize: 24
            });
          }
        }
      }
    });

    console.log('Génération du buffer PowerPoint...');
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
