import { closeMainWindow } from "@vicinae/api";
import ExportForm from "./components/export-form";

export default function Command() {
  const handleExportComplete = async () => {
    // await closeMainWindow();
  };

  return <ExportForm onExportComplete={handleExportComplete} />;
}
