export interface Product {
  id: string;
  name: string;
  priceCents: number;
  active: boolean;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  priceCents: number;
}

export type UpdateProductDto = Partial<CreateProductDto> & {
  active?: boolean;
};
