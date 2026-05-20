// src/hooks/useCartService.ts
"use client";

import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/types/database.types";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export function useCartService() {
  const supabase = useSupabaseClient<Database>();
  const { user } = useAuth();

  if (!user) {
    throw new Error("useCartService: user not authenticated");
  }

  const userId = user.id;

  // Ambil semua item cart user
  async function getCartItems() {
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  }

  // Tambah item ke cart
  async function addToCart(item: {
    product_id: number;
    title: string;
    category: string;
    price: number;
    image: string;
    quantity?: number;
    is_selected?: boolean;
  }) {
    if (!userId) throw new Error("User is not logged in");

    const payload = {
      user_id: userId,
      product_id: item.product_id,
      title: item.title,
      category: item.category,
      price: item.price,
      image: item.image,
      quantity: item.quantity ?? 1,
      is_selected: item.is_selected ?? true,
    };

    console.log("Insert payload:", payload);

    const { error } = await supabase
      .from("cart_items")
      .insert(payload as unknown as never);

    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
  }

  // Hapus item dari cart berdasarkan id produk
  async function removeFromCart(productId: number) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) throw error;
  }

  // Update jumlah item
  async function updateQuantity(productId: number, quantity: number) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity } as unknown as never)
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) throw error;
  }

  return {
    getCartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
  };
}
