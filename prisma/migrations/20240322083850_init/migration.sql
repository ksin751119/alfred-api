-- CreateTable
CREATE TABLE "tasks" (
    "sender" VARCHAR(255) NOT NULL,
    "target_ratio" INTEGER NOT NULL,
    "floor_ratio" INTEGER NOT NULL,
    "ceiling_ratio" INTEGER NOT NULL,
    "collateral_token" VARCHAR(255) NOT NULL,
    "borrow_token" VARCHAR(255) NOT NULL,
    "signature" VARCHAR(255) NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "address_nonce_pkey" PRIMARY KEY ("sender","collateral_token","borrow_token","chain_id")
);
