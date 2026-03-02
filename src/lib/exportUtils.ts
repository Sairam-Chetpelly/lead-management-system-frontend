const getTimestampedFilename = (filename: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const nameParts = filename.split('.');
  const ext = nameParts.pop();
  const name = nameParts.join('.');
  return `${name}_${timestamp}.${ext}`;
};

export const downloadCSV = (data: any[], filename: string) => {
  try {
    console.log('downloadCSV called with:', { data, filename });
    
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    console.log('CSV headers:', headers);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    console.log('CSV content generated, length:', csvContent.length);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', getTimestampedFilename(filename));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('CSV download triggered successfully');
    } else {
      throw new Error('Browser does not support file downloads');
    }
  } catch (error) {
    console.error('Error in downloadCSV:', error);
    throw error;
  }
};

export const downloadCSVBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getTimestampedFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};