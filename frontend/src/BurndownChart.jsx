import { line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

export default function BurndownChart({ data }) {
    const labels = data.map(d => d.date);
    const remaining = data.map(d => d.remaining);

    return <Line data={{
        labels, 
        datasets: [
            {
                label: "Remaining Issues",
                data: remaining,
            }
        ]
    }} />;
}