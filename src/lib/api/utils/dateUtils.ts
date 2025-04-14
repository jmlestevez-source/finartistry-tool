
// Date utility functions

export const calculateStartDate = (period: string): string => {
  const today = new Date();
  let startDate;
  
  switch(period) {
    case '1y':
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      break;
    case '3y':
      startDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
      break;
    case '5y':
      startDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      break;
    case '10y':
      startDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      break;
    case 'max':
      startDate = new Date(1990, 0, 1);
      break;
    default:
      startDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
  }
  
  return startDate.toISOString().split('T')[0];
};

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
