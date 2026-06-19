import type { SVGProps } from "react";
import { SeasonalFlourish } from "./SeasonalFlourish";
import { SpringBlossom } from "./SpringBlossom";
import { WheatSprig } from "./WheatSprig";
import { WinterBranch } from "./WinterBranch";

interface SeasonalOrnamentProps extends SVGProps<SVGSVGElement> {
  date: Date;
}

function isNearTransition(m: number, d: number): boolean {
  return (
    (m === 3 && d >= 16 && d <= 24) ||
    (m === 6 && d >= 17 && d <= 25) ||
    (m === 9 && d >= 18 && d <= 26) ||
    (m === 12 && d >= 17 && d <= 25)
  );
}

export function SeasonalOrnament({ date, className, ...props }: SeasonalOrnamentProps) {
  const m = date.getMonth() + 1;
  const d = date.getDate();

  if (isNearTransition(m, d)) {
    return <SeasonalFlourish className={className} {...props} />;
  }

  // Spring: Mar 25 - Jun 16
  if ((m === 3 && d >= 25) || m === 4 || m === 5 || (m === 6 && d <= 16)) {
    return <SpringBlossom className={className} {...props} />;
  }

  // Summer: Jun 26 - Sep 17
  if ((m === 6 && d >= 26) || m === 7 || m === 8 || (m === 9 && d <= 17)) {
    return <WheatSprig className={className} {...props} />;
  }

  // Fall: Sep 27 - Dec 16
  if ((m === 9 && d >= 27) || m === 10 || m === 11 || (m === 12 && d <= 16)) {
    return <SeasonalFlourish className={className} {...props} />;
  }

  // Winter: Dec 26 - Mar 15
  return <WinterBranch className={className} {...props} />;
}
