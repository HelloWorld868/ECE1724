"use client";

import { useRef, useState } from "react";
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
  setImageFiles: (files: File[]) => void;
  imageFiles?: File[];
}

export function EventForm({ action, initialData }: EventFormProps) {
  const [tiers, setTiers] = useState([{ name: "", price: "", quantity: "" }]);
  const [showDiscountSection, setShowDiscountSection] = useState(false);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTier = () => {
    setTiers([...tiers, { name: "", price: "", quantity: "" }]);
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
          className="border p-2 w-full text-sm"
          defaultValue={initialData?.name || ""}
        />
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-medium">
          Images
        </label>
        <input
          id="images"
          type="file"
          name="images"
          accept="image/*"
          multiple
          ref={inputRef}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setImageFiles(files);

            const previews: string[] = [];
            files.forEach((file) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === "string") {
                  previews.push(reader.result);
                  if (previews.length === files.length) {
                    setImagePreviews(previews);
                  }
                }
              };
              reader.readAsDataURL(file);
            });
          }}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-1.5 file:px-3
            file:rounded file:border-0 file:text-sm file:font-medium
            file:bg-neutral-100 file:text-neutral-700
            file:hover:bg-neutral-200 file:hover:cursor-pointer
            file:transition-colors"
        />

        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-2">
            {imagePreviews.map((src, index) => (
              <div key={index} className="relative w-32 h-32">
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newPreviews = imagePreviews.filter((_, i) => i !== index);
                    const newFiles = imageFiles.filter((_, i) => i !== index);
                    setImagePreviews(newPreviews);
                    setImageFiles(newFiles);

                    // Clear input manually to allow same file re-selection
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="absolute top-1 right-1 bg-white text-red-600 border border-gray-300 rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center hover:bg-red-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-sm">
          Type
        </label>
        <select
          name="type"
          id="type"
          className="border p-2 w-full text-sm"
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
          className="border p-2 w-full text-sm"
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
          className="border p-2 w-full text-sm"
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
          className="border p-2 w-full text-sm"
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
          <div key={index} className="flex flex-col gap-2 mb-4 border p-4 rounded-lg">
            <div className="w-full mb-2">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="names[]"
                placeholder="Tier Name (e.g. VIP, General Admission)"
                className="border p-2 w-full"
                required
              />
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  name="prices[]"
              id={`price-${index}`}
                  placeholder="Price"
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantities[]"
              id={`quantity-${index}`}
                  placeholder="Quantity"
                  className="border p-2 w-full"
                  required
                />
              </div>
              {index > 0 && (
                <Button type="button" variant="ghost" onClick={() => removeTier(index)} className="mt-6">
                  X
                </Button>
              )}
            </div>
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
            <div className="flex justify-between items-center mb-4 text-sm">
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
                      id={`discountCode-${discount.id}`}
                      placeholder="SUMMER2024"
                      className="border p-2 w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      name={`discountCodes[${discount.id}].discountType`}
                      className="border p-2 w-full text-sm"
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
                      id={`discountValue-${discount.id}`}
                      placeholder="Enter value"
                      className="border p-2 w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Uses</label>
                    <input
                      type="number"
                      name={`discountCodes[${discount.id}].maxUses`}
                      id={`maxUses-${discount.id}`}
                      placeholder="Leave empty for unlimited"
                      className="border p-2 w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      name={`discountCodes[${discount.id}].startDate`}
                      id={`startDate-${discount.id}`}
                      className="border p-2 w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      name={`discountCodes[${discount.id}].endDate`}
                      id={`endDate-${discount.id}`}
                      className="border p-2 w-full text-sm"
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