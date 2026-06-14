-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "mrp" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "ratingCount" INTEGER NOT NULL,
    "deliveryMin" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT[],
    "rankScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "img" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'garv',
    "items" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "savings" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "zoneCode" TEXT NOT NULL DEFAULT '110001',
    "deliveryMin" INTEGER NOT NULL,
    "address" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'placed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_subCategory_idx" ON "Product"("subCategory");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt" DESC);
