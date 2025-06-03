import React from 'react';

const SummaryCard = ({ title, value, isIncome }) => {
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    margin: '0 4px',
  };

  const valueStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: isIncome ? 'green' : 'red',
    marginTop: '4px',
  };

  const titleStyle = {
    fontSize: '12px',
    color: 'grey',
    fontWeight: '500',
  };

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
};

export default SummaryCard;