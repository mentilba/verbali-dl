import { DIM_LABELS, type DimKey } from "../lib/types";
import { rankDimensions } from "../lib/formulas";

export default function DimensionBars({ scores }: { scores: Record<DimKey, number> }) {
  const ranked = rankDimensions(scores);
  return (
    <div>
      {ranked.map(({ dim, score }) => (
        <div className="bar-row" key={dim}>
          <span className="bar-label">{DIM_LABELS[dim]}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(score / 10) * 100}%` }} />
          </div>
          <span className="bar-value">{score.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
