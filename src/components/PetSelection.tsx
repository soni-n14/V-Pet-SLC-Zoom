/**
 * Choose pet type and name. Clears previous save and flags tutorial for after first purchase.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Dog, Cat, Bird, Rabbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface PetSelectionProps {
  onSelectPet: (type: string, name: string) => void;
}

const petTypes = [
  { id: "dog", name: "Dog", icon: Dog, color: "bg-gradient-to-br from-amber-100 to-orange-100", available: true },
  { id: "cat", name: "Cat", icon: Cat, color: "bg-gradient-to-br from-purple-100 to-pink-100", available: true },
  { id: "parrot", name: "Parrot", icon: Bird, color: "bg-gradient-to-br from-green-100 to-teal-100", available: true },
  { id: "rabbit", name: "Rabbit", icon: Rabbit, color: "bg-gradient-to-br from-blue-100 to-indigo-100", available: true },
];

const LETTERS_AND_SPACES_ONLY = /^[a-zA-Z\s]*$/;

export const PetSelection = ({ onSelectPet }: PetSelectionProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [petName, setPetName] = useState("");

  const nameInvalid = petName.length > 0 && !LETTERS_AND_SPACES_ONLY.test(petName);
  const canSubmit = selectedType && petName.trim() && !nameInvalid;

  const handleSubmit = () => {
    if (canSubmit) {
      localStorage.removeItem("vpet_pet_data");
      localStorage.setItem("vpet_show_tutorial", "true");
      onSelectPet(selectedType, petName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Choose Your Pet
          </h1>
          <p className="text-lg text-muted-foreground">
            Select a companion to begin your journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {petTypes.map((pet, index) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative p-6 cursor-pointer transition-all duration-300 ${
                  selectedType === pet.id
                    ? "ring-4 ring-primary shadow-lg scale-105"
                    : "hover:shadow-md hover:scale-102"
                } ${!pet.available ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => pet.available && setSelectedType(pet.id)}
              >
                <div
                  className={`${pet.color} rounded-2xl p-6 mb-4 flex items-center justify-center`}
                >
                  <pet.icon className="w-16 h-16 text-foreground/70" />
                </div>
                <h3 className="text-xl font-semibold text-center text-foreground">
                  {pet.name}
                </h3>
                {!pet.available && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Coming Soon
                  </p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {selectedType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="p-6 bg-card">
              <label className="block mb-2 text-sm font-medium text-foreground">
                Name your pet
              </label>
              <Input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Enter a name..."
                className={`mb-1 ${nameInvalid ? "border-destructive bg-destructive/5 focus-visible:ring-destructive" : ""}`}
                maxLength={20}
              />
              {nameInvalid && (
                <p className="mb-4 text-sm text-destructive">
                  You can only use letters for your pet&apos;s name.
                </p>
              )}
              {!nameInvalid && <div className="mb-4" />}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                size="lg"
              >
                Start Journey
              </Button>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
