import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useUserDeletion } from '@/hooks/useUserDeletion';

const DeleteAccountDialogDescription = ({ confirmText, setConfirmText, isDeleting }: { confirmText: string, setConfirmText: (v: string) => void, isDeleting: boolean }) => (
  <div className="space-y-3 text-base text-muted-foreground mt-2">
    <ul className="list-disc list-inside ml-2 space-y-1">
      <li>Your profile and account data</li>
      <li>All your style analyses and history
        <ul className="list-disc list-inside ml-4">
          <li>Your uploaded images</li>
        </ul>
      </li>
      <li>Your subscription (if active)</li>
    </ul>
    <div className="mt-2">
      <label htmlFor="delete-confirm" className="block text-sm font-medium mb-1">
        Type <span className="font-mono bg-muted px-1 rounded">delete my account</span> to confirm:
      </label>
      <Input
        id="delete-confirm"
        value={confirmText}
        onChange={e => setConfirmText(e.target.value)}
        placeholder="delete my account"
        className="w-full"
        autoComplete="off"
        disabled={isDeleting}
      />
    </div>
  </div>
);

export const DeleteAccountButton = () => {
  const [confirmText, setConfirmText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { deleteUserAccount, isDeleting } = useUserDeletion();

  const handleDelete = async () => {
    const success = await deleteUserAccount();
    if (success) {
      setIsOpen(false);
    }
  };

  const isConfirmValid = confirmText.toLowerCase() === 'delete my account';

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="rounded-2xl bg-background p-6 shadow-2xl border border-border max-w-md w-full">
        <AlertDialogTitle>
          <span className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-6 h-6" />
            Delete Account
          </span>
        </AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete your account and data.
        </AlertDialogDescription>
        <DeleteAccountDialogDescription
          confirmText={confirmText}
          setConfirmText={setConfirmText}
          isDeleting={isDeleting}
        />
        <AlertDialogFooter className="mt-4 flex flex-col gap-2">
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              className="w-full h-12 text-base font-bold rounded-xl transition-all duration-200 shadow-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              onClick={handleDelete}
              disabled={confirmText !== 'delete my account' || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </AlertDialogAction>
          <AlertDialogCancel asChild>
            <Button variant="outline" className="w-full h-12 rounded-xl">Cancel</Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 