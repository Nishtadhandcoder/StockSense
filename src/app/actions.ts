"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  try {
    await prisma.product.create({
      data: {
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        category: formData.get("category") as string,
        uom: formData.get("uom") as string,
        minReorderLevel: parseInt(formData.get("minReorderLevel") as string) || 0,
      }
    });
    revalidatePath("/products");
  } catch (error) {
    console.error("Failed to create product:", error);
  }
}

export async function createWarehouse(formData: FormData) {
  try {
    await prisma.warehouse.create({
      data: {
        name: formData.get("name") as string,
        code: formData.get("code") as string,
      }
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Failed to create warehouse:", error);
  }
}

export async function createLocation(formData: FormData) {
  try {
    await prisma.location.create({
      data: {
        name: formData.get("name") as string,
        warehouseId: formData.get("warehouseId") as string || null,
        isInternal: formData.get("isInternal") === "true",
      }
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Failed to create location:", error);
  }
}
