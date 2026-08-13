import { createAdminCrudHooks } from "@/hooks/use-admin-crud";
import { productsApi } from "@/lib/api/products";
import type { CreateProductDto, Product, UpdateProductDto } from "@/types/product";

const hooks = createAdminCrudHooks<Product, CreateProductDto, UpdateProductDto>(
  "products",
  productsApi,
);

export const useProducts = hooks.useList;
export const useCreateProduct = hooks.useCreate;
export const useUpdateProduct = hooks.useUpdate;
export const useRemoveProduct = hooks.useRemove;
