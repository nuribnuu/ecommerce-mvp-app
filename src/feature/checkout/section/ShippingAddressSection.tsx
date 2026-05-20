"use client";

import { useEffect, useState } from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { InputField } from "@/feature/auth/ui/InputField";
import { Button } from "@/feature/shared/ui/Button";
import { Typography } from "@/feature/shared/ui/Typography";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ShippingAddress } from "@/types/shipping_address";

const supabase = createClientComponentClient<any>();

type ShippingAddressSection = Pick<
  ShippingAddress,
  | "full_name"
  | "phone_number"
  | "address"
  | "district"
  | "city"
  | "province"
  | "postal_code"
  | "country"
  | "notes"
>;

const initialFormState: ShippingAddressSection = {
  full_name: "",
  phone_number: "",
  address: "",
  district: "",
  city: "",
  province: "",
  postal_code: "",
  country: "",
  notes: "",
};

type Props = {
  onValidationChange?: (isComplete: boolean) => void;
};

export const ShippingAddressSection = ({ onValidationChange }: Props) => {
  const [form, setForm] = useState<ShippingAddressSection>(initialFormState);
  const [savedForm, setSavedForm] =
    useState<ShippingAddressSection>(initialFormState);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchShippingAddress = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setForm(data);
        setSavedForm(data);
        setIsSaved(true);
      }
    };

    fetchShippingAddress();
  }, []);

  useEffect(() => {
    if (!onValidationChange) return;

    const requiredFields: (keyof ShippingAddressSection)[] = [
      "full_name",
      "phone_number",
      "address",
      "district",
      "city",
      "province",
      "postal_code",
      "country",
    ];
    const isComplete =
      isSaved &&
      requiredFields.every(
        (key) => savedForm[key] && savedForm[key].trim() !== "",
      );
    onValidationChange(isComplete);
  }, [isSaved, savedForm, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing, error: existingError } = await supabase
      .from("shipping_addresses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingError) {
      // Supabase uses `null` data when no row exists with `.single()`.
      // Treat that case as `no existing address`.
      if (!existing) {
        // continue as insert
      } else {
        console.error(
          "Failed to check existing shipping address:",
          existingError,
        );
        return;
      }
    }

    const payload = {
      ...form,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = existing
      ? await supabase
          .from("shipping_addresses")
          .update(payload)
          .eq("user_id", user.id)
      : await supabase.from("shipping_addresses").insert(payload);

    if (saveError) {
      console.error("Failed to save shipping address:", saveError);
      return;
    }

    setSavedForm(form);
    setIsSaved(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsSaved(false);
  };

  const handleCancel = () => {
    setForm(savedForm);
    setIsEditing(false);
    setIsSaved(true);
  };

  const fields: {
    name: keyof ShippingAddressSection;
    label: string;
    placeholder: string;
  }[] = [
    { name: "full_name", label: "Full Name", placeholder: "Enter full name" },
    {
      name: "phone_number",
      label: "Phone Number",
      placeholder: "Enter phone number",
    },
    {
      name: "address",
      label: "Address",
      placeholder: "Street address, P.O. box",
    },
    { name: "district", label: "District", placeholder: "Enter district" },
    { name: "city", label: "City", placeholder: "Enter city" },
    { name: "province", label: "Province", placeholder: "Enter province" },
    {
      name: "postal_code",
      label: "Postal Code",
      placeholder: "Enter postal code",
    },
    { name: "country", label: "Country", placeholder: "Enter country" },
    {
      name: "notes",
      label: "Delivery Notes",
      placeholder: "e.g. gate code (optional)",
    },
  ];

  return (
    <div className="flex flex-col border-3 rounded-2xl p-4 border-neutral-300 h-fit">
      <Disclosure>
        {({ open }) => (
          <div>
            <Disclosure.Button className="flex items-center justify-between w-full cursor-pointer">
              <Typography as="h1" size="xl" weight="bold">
                Shipping Address
              </Typography>
              {open ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </Disclosure.Button>

            <Disclosure.Panel className="mt-4">
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {fields.map(({ name, label, placeholder }) => (
                  <InputField
                    key={name}
                    label={label}
                    name={name}
                    value={form[name] ?? ""}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={name !== "notes"}
                    readOnly={isSaved}
                  />
                ))}

                <div className="flex justify-between gap-4 mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={isEditing ? handleCancel : handleEdit}
                    disabled={!isSaved && !isEditing}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                  <Button type="submit" disabled={isSaved && !isEditing}>
                    Save
                  </Button>
                </div>
              </form>
            </Disclosure.Panel>
          </div>
        )}
      </Disclosure>
    </div>
  );
};
