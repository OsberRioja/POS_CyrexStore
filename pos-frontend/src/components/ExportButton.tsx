interface ExportButtonProps {
  data: any[];
  filename: string;
  className?: string;
}

export default function ExportButton({ data, filename, className = '' }: ExportButtonProps) {
  const exportToCSV = () => {
    if (data.length === 0) return;

    // Obtener las cabeceras del primer objeto
    const headers = Object.keys(data[0]);
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar comas y comillas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={data.length === 0}
      className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      📊 Exportar CSV
    </button>
  );
}