/**
 * First-time setup: buy essentials (bowls, bed, toy, etc.) per pet type. One-time cost; then tutorial can show.
 */
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface InitialPurchaseProps {
  onComplete: (totalCost: number) => void;
  petType: string;
}

/** Essentials list and prices per pet type (dog bowls $30, etc.). */
const getPurchaseItems = (petType: string) => {
  const items: Record<string, Array<{ id: string; name: string; cost: number; description: string }>> = {
    dog: [
      { id: "collar", name: "Collar", cost: 15, description: "Essential for walks" },
      { id: "harness", name: "Harness", cost: 25, description: "Safe walking gear" },
      { id: "bed", name: "Dog Bed", cost: 50, description: "Comfy sleeping spot" },
      { id: "bowls", name: "Food & Water Bowls", cost: 30, description: "For meals" },
      { id: "toy", name: "Dog Toy", cost: 15, description: "For playtime fun" },
    ],
    cat: [
      { id: "collar", name: "Collar", cost: 12, description: "ID tag holder" },
      { id: "bed", name: "Cat Bed", cost: 40, description: "Comfy sleeping spot" },
      { id: "bowls", name: "Food & Water Bowls", cost: 18, description: "For meals" },
      { id: "toy", name: "Cat Toy", cost: 12, description: "For playtime fun" },
      { id: "litter", name: "Litter Box", cost: 30, description: "Essential for cats" },
    ],
    parrot: [
      { id: "cage", name: "Cage", cost: 80, description: "Safe home" },
      { id: "perch", name: "Perch", cost: 25, description: "For resting" },
      { id: "bowls", name: "Food & Water Bowls", cost: 15, description: "For meals" },
      { id: "toy", name: "Bird Toy", cost: 18, description: "For enrichment" },
      { id: "toys", name: "Extra Toys", cost: 20, description: "More enrichment" },
    ],
    rabbit: [
      { id: "hutch", name: "Hutch", cost: 60, description: "Safe home" },
      { id: "bedding", name: "Bedding", cost: 20, description: "Comfy sleeping" },
      { id: "bowls", name: "Food & Water Bowls", cost: 15, description: "For meals" },
      { id: "toy", name: "Rabbit Toy", cost: 12, description: "For playtime fun" },
      { id: "hay", name: "Hay Rack", cost: 10, description: "For feeding" },
    ],
  };
  return items[petType] || items.dog;
};

export const InitialPurchase = ({ onComplete, petType }: InitialPurchaseProps) => {
  const purchaseItems = getPurchaseItems(petType);
  const totalCost = purchaseItems.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-fade-in p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-6">
          <ShoppingBag className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl text-white font-bold mb-2">Welcome to Pet Ownership!</h2>
          <p className="text-white/70 text-lg">
            Let's get the essentials for your new companion
          </p>
        </div>

        <Card className="p-6 bg-card/95 backdrop-blur">
          <div className="space-y-3 mb-6">
            {purchaseItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="text-lg font-bold text-primary">${item.cost}</div>
              </motion.div>
            ))}
          </div>

          <div className="border-t border-border pt-4 mb-4">
            <div className="flex items-center justify-between text-xl font-bold">
              <span className="text-foreground">Total:</span>
              <span className="text-primary">${totalCost}</span>
            </div>
          </div>

          <Button
            onClick={() => onComplete(totalCost)}
            className="w-full"
            size="lg"
          >
            Purchase Essentials
          </Button>
        </Card>
      </motion.div>
    </div>
  );
};
