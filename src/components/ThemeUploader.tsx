
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp } from "lucide-react";

interface ThemeUploaderProps {
  onUpload: (file: File | null) => void;
}

const ThemeUploader = ({ onUpload }: ThemeUploaderProps) => {
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Thème PowerPoint (optionnel)
      </h2>
      <div className="relative">
        <Input
          type="file"
          accept=".thmx"
          onChange={handleFileChange}
          className="hidden"
          id="theme-upload"
        />
        <Label
          htmlFor="theme-upload"
          className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
        >
          <FileUp className="h-5 w-5 text-gray-400" />
          <span className="text-gray-600">
            {fileName || "Glissez votre thème .thmx ou cliquez pour parcourir"}
          </span>
        </Label>
      </div>
      <p className="text-sm text-gray-500">
        Format accepté : .thmx - Un thème par défaut sera utilisé si aucun fichier n'est fourni
      </p>
    </div>
  );
};

export default ThemeUploader;
