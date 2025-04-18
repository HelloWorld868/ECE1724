"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Event } from "@prisma/client";
import { format } from "date-fns";
import CancelButton from "@/components/CancelButton";

interface DiscountCode {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  maxUses: string;
  startDate: string;
  endDate: string;
}

interface EventFormProps {
  action: (formData: FormData) => void;
  initialData?: Event;
}

export function EventForm({ action, initialData }: EventFormProps) {
  const [tiers, setTiers] = useState([{ price: "", quantity: "" }]);
  const [showDiscountSection, setShowDiscountSection] = useState(false);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);

  const addTier = () => {
    setTiers([...tiers, { price: "", quantity: "" }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const addDiscountCode = () => {
    setDiscountCodes([...discountCodes, {
      id: Math.random().toString(36).substr(2, 9),
      code: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      maxUses: "",
      startDate: "",
      endDate: ""
    }]);
  };

  const removeDiscountCode = (id: string) => {
    const newDiscountCodes = discountCodes.filter(code => code.id !== id);
    setDiscountCodes(newDiscountCodes);
    if (newDiscountCodes.length === 0) {
      setShowDiscountSection(false);
    }
  };

  return (
    <form action={action} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          className="border p-2 w-full"
          defaultValue={initialData?.name || ""}
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium">
          Type
        </label>
        <select
          name="type"
          id="type"
          className="border p-2 w-full"
          defaultValue={initialData?.type || ""}
          required
        >
          <option value="">Select a type</option>
          <option value="Concert">Concert</option>
          <option value="Sports">Sports</option>
          <option value="Theatre">Theatre</option>
          <option value="Comedy">Comedy</option>
          <option value="Festival">Festival</option>
        </select>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          Location
        </label>
        <input
          type="text"
          name="location"
          id="location"
          className="border p-2 w-full"
          defaultValue={initialData?.location || ""}
        />
      </div>

      {/* Start Time */}
      <div>
        <label htmlFor="startTime" className="block text-sm font-medium">
          Start Time
        </label>
        <input
          type="datetime-local"
          name="startTime"
          id="startTime"
          className="border p-2 w-full"
          defaultValue={
            initialData
              ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm")
              : ""
          }
        />
      </div>

      {/* End Time */}
      <div>
        <label htmlFor="endTime" className="block text-sm font-medium">
          End Time
        </label>
        <input
          type="datetime-local"
          name="endTime"
          id="endTime"
          className="border p-2 w-full"
          defaultValue={
            initialData
              ? format(new Date(initialData.endTime), "yyyy-MM-dd'T'HH:mm")
              : ""
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Ticket Tiers</label>
        {tiers.map((_, index) => (
          <div key={index} className="flex gap-2 items-center mb-2">
            <input
              type="number"
              name="prices[]"
              placeholder="Price"
              className="border p-2 w-1/2"
              required
            />
            <input
              type="number"
              name="quantities[]"
              placeholder="Quantity"
              className="border p-2 w-1/2"
              required
            />
            {index > 0 && (
              <Button type="button" variant="ghost" onClick={() => removeTier(index)}>
                X
              </Button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addTier}
          className="text-blue-600 text-sm mt-1"
        >
          Add Ticket Tier
        </button>
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowDiscountSection(true);
            if (discountCodes.length === 0) {
              addDiscountCode();
            }
          }}
          className="w-full"
        >
          Add Discount Code
        </Button>

        {showDiscountSection && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium">Discount Codes</label>
            </div>
            {discountCodes.map((discount) => (
              <div key={discount.id} className="border p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Code</label>
                    <input
                      type="text"
                      name={`discountCodes[${discount.id}].code`}
                      placeholder="SUMMER2024"
                      className="border p-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      name={`discountCodes[${discount.id}].discountType`}
                      className="border p-2 w-full"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Value</label>
                    <input
                      type="number"
                      name={`discountCodes[${discount.id}].discountValue`}
                      placeholder="Enter value"
                      className="border p-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Uses</label>
                    <input
                      type="number"
                      name={`discountCodes[${discount.id}].maxUses`}
                      placeholder="Leave empty for unlimited"
                      className="border p-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      name={`discountCodes[${discount.id}].startDate`}
                      className="border p-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      name={`discountCodes[${discount.id}].endDate`}
                      className="border p-2 w-full"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => removeDiscountCode(discount.id)}
                    className="text-red-500"
                  >
                    Remove Discount Code
                  </Button>
                </div>
              </div>
            ))}
            {discountCodes.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={addDiscountCode}
                className="w-full mt-2"
              >
                Add Another Discount Code
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-between items-center mt-6">
        <CancelButton />
        <Button type="submit">{initialData ? "Update Event" : "Create Event"}</Button>
      </div>
      
    </form>
  );
}