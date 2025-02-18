
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, FileDown } from "lucide-react";
import DetailLevel from "@/components/DetailLevel";
import ThemeUploader from "@/components/ThemeUploader";
import SlidePreview from "@/components/SlidePreview";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [detailLevel, setDetailLevel] = useState<string>("");
  const [theme, setTheme] = useState<File | null>(null);
  const [content, setContent] = useState<string>("");
  const [generatedSlides, setGeneratedSlides] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generatePresentation = async () => {
    if (!detailLevel) {
      toast({
        title: "Niveau de détail requis",
        description: "Veuillez sélectionner un niveau de détail pour votre présentation",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Contenu requis",
        description: "Veuillez saisir le sujet ou le contenu de votre présentation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-presentation', {
        body: { content, detailLevel }
      });

      if (error) throw error;

      if (data.slides) {
        setGeneratedSlides(data.slides);
        toast({
          title: "Présentation générée",
          description: "Votre présentation a été générée avec succès",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération de la présentation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Générez des présentations PowerPoint professionnelles
            </h1>
            <p className="text-lg text-gray-600">
              Créez une présentation attrayante en quelques clics
            </p>
          </div>

          <Card className="p-6 backdrop-blur-sm bg-white/80 shadow-lg">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Contenu de la présentation
                </h2>
                <Textarea 
                  placeholder="Saisissez le sujet ou le contenu de votre présentation ici..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-y"
                />
                <p className="text-sm text-gray-500">
                  Conseil : séparez vos idées principales par des lignes vides pour une meilleure structure
                </p>
              </div>

              <DetailLevel onSelect={setDetailLevel} selected={detailLevel} />
              <ThemeUploader onUpload={setTheme} />
              
              <Button 
                onClick={generatePresentation}
                className="w-full bg-blue-600 hover:bg-blue-700 transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Génération en cours..." : "Générer la présentation"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>

          {generatedSlides.length > 0 && (
            <Card className="p-6 backdrop-blur-sm bg-white/80 shadow-lg">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Prévisualisation des slides
                </h2>
                <SlidePreview slides={generatedSlides} />
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 transition-all"
                  onClick={() => {
                    toast({
                      title: "Téléchargement démarré",
                      description: "Votre présentation PowerPoint est en cours de téléchargement",
                    });
                  }}
                >
                  Télécharger la présentation
                  <FileDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
