import { createAdminCrudApi } from "@/lib/api/admin-crud";
import type { CreateProductDto, Product, UpdateProductDto } from "@/types/product";

export const productsApi = createAdminCrudApi<
  Product,
  CreateProductDto,
  UpdateProductDto
>("/products");
