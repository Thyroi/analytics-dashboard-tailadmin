import DeltaCard from "@/components/common/DeltaCard";
import type { TownCardData } from "../hooks/useChatbotTownTotals";

type Props = {
  data: TownCardData;
  onClick?: () => void;
  isSelected?: boolean;
};

export default function TownCard({ data, onClick, isSelected }: Props) {
  const { label, iconSrc, deltaPercent } = data;

  return (
    <div
      className={`transition-all duration-200 cursor-pointer ${
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900"
          : "hover:shadow-lg hover:scale-[1.02]"
      }`}
      onClick={onClick}
    >
      <DeltaCard
        title={label}
        imgSrc={iconSrc}
        deltaPct={deltaPercent ?? null}
        loading={false}
        isTown={true}
        className="h-full"
        onClick={onClick}
      />
    </div>
  );
}
