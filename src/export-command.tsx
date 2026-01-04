import ExportForm from './components/export-form';

export default function Command() {
  const handleExportComplete = async () => {
    // Form will handle closing after export
  };

  return <ExportForm onExportComplete={handleExportComplete} />;
}
