// src/screens/GrafikOmsetPage.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SummaryCard from '../components/SummaryCard';

const GrafikOmsetPage = ({
  totalIncomeForMonth,
  monthlyIncomeSpots,
  maxYValue,
  monthLabels,
}) => {
  const currencyFormat = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const chartData = monthlyIncomeSpots.map((spot, index) => ({
    name: monthLabels[index],
    value: spot.y,
    x: spot.x,
  }));

  const formatYAxis = (value) => {
      if (value >= 1000000) {
          return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}Jt`;
      } else if (value >= 1000) {
          return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}rb`;
      }
      return value.toLocaleString('id-ID');
  };


  return (
    <div style={{ padding: '16px' }}> {/* Use div with padding */}
      {/* Summary Card for the selected month's income */}
      <SummaryCard
        title="Pemasukkan"
        value={currencyFormat.format(totalIncomeForMonth)}
        isIncome={true}
      />
      <div style={{ height: '24px' }}></div> {/* SizedBox equivalent */}

      {/* Chart Container */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        padding: '16px',
      }}>
         {/* Use ResponsiveContainer to make chart responsive */}
         <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{
                 top: 5, right: 30, left: 20, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} /> {/* Grid */}
              <XAxis dataKey="name" /> {/* X-axis labels */}
              <YAxis domain={[0, maxYValue * 1.1]} tickFormatter={formatYAxis} /> {/* Y-axis with formatter */}
              <Tooltip formatter={(value) => currencyFormat.format(value)} /> {/* Tooltip */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrafikOmsetPage;