import CommandForm from './components/command-form';
import { gotoList } from './navigation';
export default function Command() {
  const handleCommandSaved = async () => {
    gotoList();
  };

  return <CommandForm onCommandSaved={handleCommandSaved} />;
}
