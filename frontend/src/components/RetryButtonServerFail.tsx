import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { AlertDialogTitle } from "@radix-ui/react-alert-dialog";

interface RetryButtonServerFailProps {
  isOpen: boolean;
  failedCategories: {
    food: boolean;
    attraction: boolean;
  };
  onRetry: () => void;
}

const RetryButtonServerFail = ({ isOpen, onRetry }: RetryButtonServerFailProps) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-red-50 border border-red-300 rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <AlertDialogHeader className="flex items-center gap-2 justify-center text-center">
        
          <AlertDialogTitle className="text-xl font-bold text-red-700">
            Failed to load suggestions
          </AlertDialogTitle>
          <XCircle className="h-16 w-16 text-red-500" />
        </AlertDialogHeader>
        <AlertDialogDescription className="text-sm text-red-600 mt-4 text-center">
          Couldn't load suggestions. Please try again.
          
        </AlertDialogDescription>
        <Button
            className="bg-red-600 hover:bg-red-700 items-center text-white font-medium py-3 px-3 rounded-lg text-lg focus:outline"
            onClick={onRetry}
          >
            Retry
          </Button>
        <AlertDialogFooter className="mt-1 flex justify-center items-center">
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

  );
};

export default RetryButtonServerFail;