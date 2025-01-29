import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";

interface SaveButtonProps {
  isSaved: boolean;
  onSave: () => Promise<void>;
  onUnsave: () => Promise<void>;
  name: string;
}

const POISaveButton = ({ isSaved, onSave, onUnsave, name }: SaveButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnaving, setIsUnsaving] = useState(false);
  const [localSaved, setLocalSaved] = useState(isSaved);

  // Update localSaved when prop changes
  useEffect(() => {
    setLocalSaved(isSaved);
  }, [isSaved]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      await onSave();
      setLocalSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUnsaving(true);
    try {
      await onUnsave();
      setLocalSaved(false);
    } finally {
      setIsUnsaving(false);
    }
  };

    if (isSaving) {
    return (
    <Button
        variant="default"
        size="sm"
        disabled
        className="min-w-[70px] shrink-0"
    >
        Saving...
    </Button>
    );
    }
                
    if (isUnaving) {
    return (
        <Button
            variant="default"
            size="sm"
            disabled
            className="min-w-[70px] shrink-0"
        >
            Unsaving...
        </Button>
        );
    }
  if (!localSaved) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={handleSave}
        className="min-w-[70px] shrink-0"
      >
        Save
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`min-w-[70px] shrink-0 transition-colors ${
            isHovered 
              ? 'bg-red-50 text-red-600 border-red-200' 
              : 'bg-gray-50 text-gray-700'
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => e.stopPropagation()}
        >
          {isHovered ? 'Unsave' : 'Saved'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white text-gray-900 shadow-lg rounded-lg border border-gray-200 p-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-bold text-lg">
            Confirm Unsave
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove "{name}" from your saved places?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-end gap-2">
          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnsave}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Unsave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default POISaveButton;