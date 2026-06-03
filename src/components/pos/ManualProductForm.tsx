"use client";

import { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ManualProductFormProps {
  onAdd: (item: { name: string; price: number; quantity: number }) => void;
  disabled?: boolean;
}

export const ManualProductForm: React.FC<ManualProductFormProps> = ({ onAdd, disabled = false }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [errors, setErrors] = useState<{ name?: string; price?: string; quantity?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Product name is required";
    const pn = parseFloat(price);
    if (!price || isNaN(pn) || pn <= 0) newErrors.price = "Enter a valid price";
    const qn = parseInt(quantity, 10);
    if (!quantity || isNaN(qn) || qn <= 0) newErrors.quantity = "Enter a valid quantity";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onAdd({ name: name.trim(), price: parseFloat(price), quantity: parseInt(quantity, 10) });
    setName("");
    setPrice("");
    setQuantity("1");
    setErrors({});
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Plus className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Manual Entry</h4>
          <p className="text-xs text-muted-foreground">Add items not in inventory</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Product name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          onKeyDown={onKey}
          error={errors.name}
          disabled={disabled}
          className="h-10"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Quantity"
            min="1"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (errors.quantity) setErrors({ ...errors, quantity: undefined });
            }}
            onKeyDown={onKey}
            error={errors.quantity}
            disabled={disabled}
            className="h-10"
          />
          <Input
            type="number"
            placeholder="Price"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              if (errors.price) setErrors({ ...errors, price: undefined });
            }}
            onKeyDown={onKey}
            error={errors.price}
            disabled={disabled}
            className="h-10"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="w-full h-10"
          disabled={disabled || !name.trim() || !price || !quantity}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add to Sale
        </Button>
      </form>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>Manual items will NOT affect inventory stock levels. Use this for products not yet in your catalog.</p>
      </div>
    </div>
  );
};
