
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
    console.log('Début de la génération avec thème');
    console.log('Thème présent:', !!theme);
    console.log('Nom du fichier thème:', themeFileName);

    // Si un thème est fourni, on commence par charger le thème
    let pres;
    if (theme) {
      try {
        console.log('Chargement direct du thème comme base...');
        const themeBuffer = Uint8Array.from(atob(theme), c => c.charCodeAt(0));
        pres = new PptxGenJS();
        await pres.load({ 
          data: themeBuffer,
          reuseSlidesFrom: themeFileName // Réutilise les slides du thème
        });
        // Supprime toutes les slides existantes du thème
        while (pres.slides && pres.slides.length > 0) {
          pres.removeSlide(0);
        }
        console.log('Thème chargé comme base de la présentation');
      } catch (themeError) {
        console.error('Erreur lors du chargement du thème:', themeError);
        // En cas d'erreur, on crée une nouvelle présentation sans thème
        pres = new PptxGenJS();
      }
    } else {
      pres = new PptxGenJS();
    }

    // Ajout des slides
    slides.forEach((slideContent: string, index: number) => {
      console.log(`Création de la slide ${index + 1}`);
      
      // Détermination du layout à utiliser
      let slide;
      if (index === 0) {
        // Pour la première slide, on cherche un master de type "TITLE"
        const titleMaster = pres.masters?.find(m => 
          m.title?.toLowerCase().includes('title') || 
          m.name?.toLowerCase().includes('title')
        );
        if (titleMaster) {
          console.log('Utilisation du master titre:', titleMaster.title);
          slide = pres.addSlide({ masterName: titleMaster.title });
        } else {
          console.log('Pas de master titre trouvé, utilisation du premier master disponible');
          slide = pres.masters && pres.masters.length > 0
            ? pres.addSlide({ masterName: pres.masters[0].title })
            : pres.addSlide();
        }
      } else {
        // Pour les autres slides, on cherche un master de type "CONTENT"
        const contentMaster = pres.masters?.find(m => 
          m.title?.toLowerCase().includes('content') || 
          m.name?.toLowerCase().includes('content')
        );
        if (contentMaster) {
          console.log('Utilisation du master contenu:', contentMaster.title);
          slide = pres.addSlide({ masterName: contentMaster.title });
        } else {
          console.log('Pas de master contenu trouvé, utilisation du premier master disponible');
          slide = pres.masters && pres.masters.length > 0
            ? pres.addSlide({ masterName: pres.masters[0].title })
            : pres.addSlide();
        }
      }

      // Ajout du contenu
      const lines = slideContent.split('\n');
      const title = lines[0].replace(/^[#\s]+/, '');
      const content = lines.slice(1);

      if (index === 0) {
        // Slide de titre
        slide.addText(title, {
          placeholder: 'title',
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
          placeholder: 'title',
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
              placeholder: 'body',
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
