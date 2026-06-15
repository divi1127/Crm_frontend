export const exportToExcel = (data, filename) => {
  if (!data || !data.length) {
    alert('No data to export');
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]).filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt');
  
  // Convert data to CSV format
  const csvContent = [
    headers.map(header => header.toUpperCase()).join(','),
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        // Wrap cell in quotes if it contains a comma or newline
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('\n'))) {
          cell = `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
