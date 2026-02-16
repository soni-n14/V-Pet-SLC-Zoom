/**
 * Header options: Q&A and Generate Report. Report callback is passed from Dashboard so it can open the modal with current pet data.
 */
import { MoreHorizontal, HelpCircle, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface OptionsMenuProps {
  onGenerateReport?: () => void;
}

export const OptionsMenu = ({ onGenerateReport }: OptionsMenuProps) => {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border">
        {onGenerateReport && (
          <DropdownMenuItem
            onClick={onGenerateReport}
            className="cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => navigate("/qa")}
          className="cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Q & A
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
