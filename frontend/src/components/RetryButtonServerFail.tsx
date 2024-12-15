import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

interface RetryButtonServerFailProps {
  isOpen: boolean;
  failedCategories: {
    food: boolean;
    attraction: boolean;
  };
  onRetry: () => void;
}

const RetryButtonServerFail = ({ isOpen, failedCategories, onRetry }: RetryButtonServerFailProps) => {
  const getErrorMessage = () => {
    if (failedCategories.food && failedCategories.attraction) {
      return "Unable to fetch food and attraction suggestions";
    }
    if (failedCategories.food) {
      return "Unable to fetch food suggestions";
    }
    return "Unable to fetch attraction suggestions";
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-red-50 border-red-200">
        <AlertDialogHeader className="flex flex-col items-center gap-2">
          <XCircle className="h-12 w-12 text-red-500" />
          <div className="text-lg font-semibold text-red-700">
            Server Failed to Fetch Suggestions
          </div>
          <div className="text-sm text-red-600">
            {getErrorMessage()}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={onRetry}
          >
            Retry Failed Suggestions
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RetryButtonServerFail;