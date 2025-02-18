
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SlidePreviewProps {
  slides: string[];
}

const SlidePreview = ({ slides }: SlidePreviewProps) => {
  return (
    <ScrollArea className="h-[400px] rounded-md border">
      <div className="space-y-4 p-4">
        {slides.map((slide, index) => (
          <Card key={index} className="p-4">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-600">Slide {index + 1}</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">{slide}</p>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SlidePreview;
