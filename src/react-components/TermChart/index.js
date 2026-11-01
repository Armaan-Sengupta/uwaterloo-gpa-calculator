import React from "react";
import "./styles.css";

/**
 * A small line chart of OMSAS GPA per term, drawn as inline SVG.
 * Only the best and latest terms are labelled; hovering (or focusing) a point shows its values.
*/

const WIDTH = 600;
const HEIGHT = 190;
const PAD = { top: 26, right: 24, bottom: 34, left: 40 };

/**
 * Chooses the y-axis range: up to 4.0, starting a little below the lowest term so differences are visible
 * @param {Array<number>} values Term GPAs
 */
function yRange(values){
    const min = Math.min(...values);
    const lo = Math.max(0, Math.floor((min - 0.1) * 10) / 10);
    return [Math.min(lo, 3.5), 4.0];
}

class TermChart extends React.Component{
    constructor(){
        super();
        this.state = { hovered: null };
    }

    render(){
        const { points } = this.props;
        if (!points || points.length === 0) return null;

        const [lo, hi] = yRange(points.map(p => p.gpa));
        const plotW = WIDTH - PAD.left - PAD.right;
        const plotH = HEIGHT - PAD.top - PAD.bottom;
        const x = i => PAD.left + (points.length === 1 ? plotW / 2 : (i * plotW) / (points.length - 1));
        const y = v => PAD.top + ((hi - v) / (hi - lo)) * plotH;
        const ticks = [];
        const step = hi - lo > 1 ? 0.5 : 0.1;
        for (let t = hi; t >= lo - 1e-9; t -= step) ticks.push(Math.round(t * 100) / 100);
        const labelled = ticks.length > 6 ? ticks.filter((t, i) => i % 2 === 0) : ticks;

        const best = points.reduce((b, p, i) => (p.gpa > points[b].gpa ? i : b), 0);
        const last = points.length - 1;
        const { hovered } = this.state;
        const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.gpa)}`).join(" ");

        return (
            <figure className="term-chart">
                <figcaption className="term-chart-title">GPA per term</figcaption>
                <div className="term-chart-plot">
                    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Line chart of OMSAS GPA per term">
                        {labelled.map(t => (
                            <g key={t}>
                                <line className="grid" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(t)} y2={y(t)} />
                                <text className="axis" x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">{t.toFixed(1)}</text>
                            </g>
                        ))}
                        {points.map((p, i) => (
                            <text key={p.term} className="axis" x={x(i)} y={HEIGHT - 12} textAnchor="middle">{p.level || p.term}</text>
                        ))}
                        <path className="line" d={path} />
                        {points.map((p, i) => (
                            <g key={p.term}>
                                <circle className={`dot ${hovered === i ? "dot-active" : ""}`} cx={x(i)} cy={y(p.gpa)} r={hovered === i ? 6 : 4.5} />
                                {(i === best || i === last) && hovered === null && (
                                    <text className="value" x={x(i)} y={y(p.gpa) - 11} textAnchor="middle">{p.gpa.toFixed(2)}</text>
                                )}
                                {/* larger invisible hit target than the dot */}
                                <circle
                                    className="hit"
                                    cx={x(i)}
                                    cy={y(p.gpa)}
                                    r={16}
                                    tabIndex={0}
                                    aria-label={`${p.term}: GPA ${p.gpa.toFixed(2)}, average ${p.avg.toFixed(2)}%`}
                                    onMouseEnter={() => this.setState({ hovered: i })}
                                    onMouseLeave={() => this.setState({ hovered: null })}
                                    onFocus={() => this.setState({ hovered: i })}
                                    onBlur={() => this.setState({ hovered: null })}
                                />
                            </g>
                        ))}
                    </svg>
                    {hovered !== null && (
                        <div
                            className="term-chart-tip"
                            style={{
                                left: `${(x(hovered) / WIDTH) * 100}%`,
                                top: `${(y(points[hovered].gpa) / HEIGHT) * 100}%`,
                            }}
                        >
                            <strong>{points[hovered].term}</strong>
                            <span>GPA {points[hovered].gpa.toFixed(2)}</span>
                            <span>{points[hovered].avg.toFixed(2)}%</span>
                        </div>
                    )}
                </div>
            </figure>
        )
    }
}

export default TermChart;
