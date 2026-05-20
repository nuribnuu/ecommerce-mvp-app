"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useAuth } from "@/context/AuthContext";
import { CartItem, CartItemUpsert } from "@/types/cart";
// Import Database tidak lagi diwajibkan untuk instance ini

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (item: CartItemUpsert) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  incrementQuantity: (productId: number) => Promise<void>;
  decrementQuantity: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  toggleSelect: (productId: number) => void;
  toggleSelectAll: () => void;
  removeSelectedFromCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // PERBAIKAN UTAMA: Menggunakan 'any' agar Supabase tidak memblokir tabel yang belum terdaftar di tipe
  const supabase = useSupabaseClient<any, "public">();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const fetchCart = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: true });

    if (error) {
      console.error("Failed to fetch cart:", error.message);
    } else if (data) {
      setCartItems(
        data.map((row: any) => ({
          id: row.product_id,
          title: row.title,
          category: row.category,
          price: row.price,
          image: row.image,
          quantity: row.quantity,
          isSelected: false,
          cartItemUuid: row.id,
        })),
      );
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchCartEffect = async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to fetch cart:", error.message);
      } else if (data) {
        setCartItems(
          data.map((row: any) => ({
            id: row.product_id,
            title: row.title,
            category: row.category,
            price: row.price,
            image: row.image,
            quantity: row.quantity,
            isSelected: false,
            cartItemUuid: row.id,
          })),
        );
      }
    };

    fetchCartEffect();
  }, [supabase, user?.id]);

  const addToCart = async (product: CartItemUpsert) => {
    if (!user?.id) {
      console.error("User not logged in");
      return;
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .limit(1);

    if (fetchErr) {
      console.error(fetchErr.message);
      return;
    }

    if (existing && existing.length > 0) {
      await supabase
        .from("cart_items")
        .update({ quantity: existing[0].quantity + product.quantity })
        .eq("id", existing[0].id);
    } else {
      await supabase.from("cart_items").insert([
        {
          user_id: user.id,
          product_id: product.id,
          title: product.title,
          category: product.category,
          price: product.price,
          image: product.image,
          quantity: product.quantity,
          is_selected: false,
        },
      ]);
    }

    await fetchCart();
  };

  const removeFromCart = async (productId: number) => {
    if (!user?.id) return;
    const item = cartItems.find((i) => i.id === productId);
    if (!item) return;
    await supabase.from("cart_items").delete().eq("id", item.cartItemUuid);
    await fetchCart();
  };

  const incrementQuantity = async (productId: number) => {
    const item = cartItems.find((i) => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + 1;

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", item.cartItemUuid);

    if (!error) {
      setCartItems((prev) =>
        prev.map((i) =>
          i.id === productId ? { ...i, quantity: newQuantity } : i,
        ),
      );
    }
  };

  const decrementQuantity = async (productId: number) => {
    const item = cartItems.find((i) => i.id === productId);
    if (!item) return;

    if (item.quantity <= 1) return;

    const newQuantity = item.quantity - 1;

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", item.cartItemUuid);

    if (!error) {
      setCartItems((prev) =>
        prev.map((i) =>
          i.id === productId ? { ...i, quantity: newQuantity } : i,
        ),
      );
    }
  };

  const toggleSelect = (productId: number) => {
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === productId ? { ...i, isSelected: !i.isSelected } : i,
      ),
    );
  };

  const toggleSelectAll = () => {
    const all = cartItems.every((i) => i.isSelected);
    setCartItems((prev) => prev.map((i) => ({ ...i, isSelected: !all })));
  };

  const removeSelectedFromCart = async () => {
    const toRemove = cartItems
      .filter((i) => i.isSelected)
      .map((i) => i.cartItemUuid);
    if (!toRemove.length) return;
    await supabase.from("cart_items").delete().in("id", toRemove);
    await fetchCart();
  };

  const updateQuantity = async (productId: number, newQty: number) => {
    const item = cartItems.find((i) => i.id === productId);
    if (!item) return;

    await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", item.cartItemUuid);
    await fetchCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        incrementQuantity,
        decrementQuantity,
        updateQuantity,
        toggleSelect,
        toggleSelectAll,
        removeSelectedFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};
