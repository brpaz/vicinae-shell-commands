import { closeMainWindow } from "@vicinae/api";
import ImportForm from "./components/import-form";

export default function Command() {
  const handleImportComplete = async () => {
    //await closeMainWindow();
  };

  return <ImportForm onImportComplete={handleImportComplete} />;
}
