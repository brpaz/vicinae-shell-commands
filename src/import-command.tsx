import ImportForm from './components/import-form';
import { gotoList } from './navigation';

export default function Command() {
  const handleImportComplete = async () => {
    gotoList();
  };

  return <ImportForm onImportComplete={handleImportComplete} />;
}
