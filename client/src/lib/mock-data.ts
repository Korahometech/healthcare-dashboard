export function generateHealthMetrics() {
  const categories = ['Heart Rate', 'Blood Pressure', 'Blood Sugar'];
  const today = new Date();
  const data = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    categories.forEach(category => {
      let baseValue;
      let variance;
      
      switch (category) {
        case 'Heart Rate':
          baseValue = 75;
          variance = 10;
          break;
        case 'Blood Pressure':
          baseValue = 120;
          variance = 15;
          break;
        case 'Blood Sugar':
          baseValue = 100;
          variance = 20;
          break;
        default:
          baseValue = 100;
          variance = 10;
      }

      const value = baseValue + (Math.random() - 0.5) * variance;
      const confidenceInterval = {
        upper: value + variance * 0.2,
        lower: value - variance * 0.2,
      };

      data.push({
        date: date.toISOString().split('T')[0],
        category,
        value: Math.round(value * 10) / 10,
        confidenceInterval,
      });
    });
  }

  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
