-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Straight',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availability" TEXT NOT NULL DEFAULT 'In Stock',
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 2,
    "lace_type" TEXT NOT NULL DEFAULT 'Closure',
    "density" TEXT NOT NULL DEFAULT '180%',
    "cap_size" TEXT NOT NULL DEFAULT 'Medium',
    "colors_json" TEXT NOT NULL DEFAULT '[]',
    "lengths_json" TEXT NOT NULL DEFAULT '[]',
    "media_json" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "delivery_address" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "payment_proof_path" TEXT DEFAULT '',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'New',
    "items_json" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_id_key" ON "orders"("order_id");
