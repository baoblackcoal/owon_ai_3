
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionTooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  enabled?: boolean;
}

export const ActionTooltip = ({
  label,
  children,
  side,
  align,
  sideOffset,
  alignOffset,
  enabled = true,
}: ActionTooltipProps) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <p className="font-semibold text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};
