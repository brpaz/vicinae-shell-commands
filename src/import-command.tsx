import ImportForm from './components/import-form';

export default function Command() {
  const handleImportComplete = async () => {
    // Form will handle closing after import
  };

  return <ImportForm onImportComplete={handleImportComplete} />;
}
