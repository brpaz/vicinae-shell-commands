import { closeMainWindow } from '@vicinae/api';
import CommandForm from './components/command-form';

export default function Command() {
  const handleCommandSaved = async () => {
    await closeMainWindow();
  };

  return <CommandForm onCommandSaved={handleCommandSaved} />;
}
