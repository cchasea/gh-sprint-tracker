import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

export default function BurndownChart({ data }) {
  const labels = data.map(d => d.date);
  const values = data.map(d => d.remaining);

  return (
    <div style={{ width: 600 }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Remaining Issues",
              data: values,
            },
          ],
        }}
      />
    </div>
  );
}