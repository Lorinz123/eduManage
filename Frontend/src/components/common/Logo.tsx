
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";

type LogoProps = {
  compact?: boolean;
  light?: boolean;
  className?: string;
};

export default function Logo({
  compact = false,
  light = false,
  className,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          light
            ? "bg-white/12 text-white"
            : "bg-blue-50 text-[#315FC5]",
        )}
      >
        <GraduationCap size={24} strokeWidth={2.1} />
      </div>

      {!compact && (
        <div className="min-w-0">
          <p
            className={cn(
              "text-[17px] font-bold tracking-tight",
              light ? "text-white" : "text-[#142746]",
            )}
          >
            eduManage
          </p>
          <p
            className={cn(
              "mt-0.5 text-[11px]",
              light ? "text-slate-300" : "text-slate-500",
            )}
          >
            Teacher workspace
          </p>
        </div>
      )}
    </div>
  );
}
