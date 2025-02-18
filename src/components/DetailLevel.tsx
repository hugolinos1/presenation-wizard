
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DetailLevelProps {
  onSelect: (level: string) => void;
  selected: string;
}

const DetailLevel = ({ onSelect, selected }: DetailLevelProps) => {
  const levels = [
    {
      id: "1",
      title: "Très synthétique",
      description: "Points clés et messages essentiels uniquement",
    },
    {
      id: "2",
      title: "Un peu détaillée",
      description: "Équilibre entre synthèse et détails",
    },
    {
      id: "3",
      title: "Très détaillée",
      description: "Présentation exhaustive avec tous les détails",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Niveau de détail souhaité
      </h2>
      <RadioGroup
        onValueChange={onSelect}
        value={selected}
        className="grid gap-4"
      >
        {levels.map((level) => (
          <div key={level.id} className="flex items-center space-x-2">
            <RadioGroupItem value={level.id} id={level.id} />
            <Label
              htmlFor={level.id}
              className="flex flex-col cursor-pointer"
            >
              <span className="font-medium">{level.title}</span>
              <span className="text-sm text-gray-500">
                {level.description}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default DetailLevel;
