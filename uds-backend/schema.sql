-- SQL dump generated using DBML (dbml.dbdiagram.io)
-- Database: PostgreSQL
-- Generated at: 2025-10-06T21:36:07.593Z
CREATE TYPE "request_status_enum" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'returned'
);

CREATE TYPE "users_role_enum" AS ENUM ('guest', 'intern', 'staff', 'admin');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "first_name" varchar(50) NOT NULL,
  "last_name" varchar(50) NOT NULL,
  "email" varchar(256) UNIQUE NOT NULL,
  "phone" varchar(20) UNIQUE NOT NULL,
  "password" varchar(72) NOT NULL,
  "is_active" bool NOT NULL DEFAULT true,
  "role" users_role_enum NOT NULL DEFAULT 'intern',
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "items" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "name" varchar(256) NOT NULL,
  "description" text NOT NULL,
  "assigned_role" users_role_enum NOT NULL DEFAULT 'admin',
  "total" int NOT NULL DEFAULT 0,
  "available" int NOT NULL DEFAULT 0,
  "damaged" int NOT NULL DEFAULT 0,
  "in_use" int NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now()),
  CONSTRAINT "valid_quantities" CHECK ("total" = "available" + "damaged" + "in_use")
);

CREATE TABLE "user_requests" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "user_id" uuid NOT NULL,
  "item_id" uuid NOT NULL,
  "returned_at" timestamptz,
  "status" request_status_enum NOT NULL DEFAULT 'pending',
  "reviewed_at" timestamptz,
  "reviewed_by" uuid,
  "quantity" int NOT NULL DEFAULT 1,
  "due_date" timestamptz DEFAULT (now() + '7 day' :: interval),
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now()),
  CONSTRAINT valid_quantity_u_r CHECK (quantity > 0),
  CONSTRAINT valid_workflow_u_r CHECK (
    (
      status = 'pending'
      AND reviewed_at IS NULL
      AND reviewed_by IS NULL
    )
    OR (
      status = 'returned'
      AND returned_at IS NOT NULL
    )
    OR (
      status = 'rejected'
      AND reviewed_at IS NOT NULL
      AND reviewed_by IS NOT NULL
    )
    OR (
      status = 'approved'
      AND reviewed_at IS NOT NULL
      AND reviewed_by IS NOT NULL
    )
  )
);

CREATE TABLE "guests" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "first_name" varchar(50) NOT NULL,
  "last_name" varchar(50) NOT NULL,
  "email" varchar(256) UNIQUE NOT NULL,
  "phone" varchar(20) UNIQUE NOT NULL,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "approved_guest_requests" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "guest_id" uuid NOT NULL,
  "item_id" uuid NOT NULL,
  "request_id" uuid NOT NULL,
  "reviewed_by" uuid NOT NULL,
  "status" request_status_enum NOT NULL DEFAULT 'approved',
  "quantity" int NOT NULL DEFAULT 1,
  "reviewed_at" timestamptz NOT NULL DEFAULT (now()),
  "returned_at" timestamptz,
  "due_date" timestamptz DEFAULT (now() + '7 day' :: interval),
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now()),
  CONSTRAINT "valid_quantity_a_g_r" CHECK (quantity > 0),
  CONSTRAINT "valid_workflow_a_g_r" CHECK (
    (
      status = 'returned'
      AND returned_at IS NOT NULL
    )
    OR (
      status = 'rejected'
      AND reviewed_at IS NOT NULL
      AND reviewed_by IS NOT NULL
    )
    OR (
      status = 'approved'
      AND reviewed_at IS NOT NULL
      AND reviewed_by IS NOT NULL
    )
  )
);

CREATE TABLE "pending_guest_requests" (
  "id" uuid PRIMARY KEY DEFAULT (uuidv7()),
  "guest_id" uuid NOT NULL,
  "request" text NOT NULL,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE INDEX "idx_user_requests_status_active" ON "user_requests" ("status");

CREATE UNIQUE INDEX "idx_user_borrowed_item" ON "user_requests" ("user_id", "item_id")
WHERE
  "status" = 'approved'
  AND "returned_at" IS NULL;

CREATE UNIQUE INDEX "idx_guest_borrowed_item" ON "approved_guest_requests" ("guest_id", "item_id")
WHERE
  "status" = 'approved'
  AND "returned_at" IS NULL;

CREATE INDEX "idx_approved_guest_requests_status_active" ON "approved_guest_requests" ("status");

COMMENT ON TABLE "users" IS 'This table keeps a record of all users for the api. A user can be an admin.';

COMMENT ON TABLE "user_requests" IS 'This table links users to the items they want to request';

COMMENT ON TABLE "approved_guest_requests" IS 'This table links guests to items.';

ALTER TABLE
  "user_requests"
ADD
  FOREIGN KEY ("item_id") REFERENCES "items" ("id");

ALTER TABLE
  "user_requests"
ADD
  FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id");

ALTER TABLE
  "user_requests"
ADD
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE
  "pending_guest_requests"
ADD
  FOREIGN KEY ("guest_id") REFERENCES "guests" ("id") ON DELETE CASCADE;

ALTER TABLE
  "approved_guest_requests"
ADD
  FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id");

ALTER TABLE
  "approved_guest_requests"
ADD
  FOREIGN KEY ("item_id") REFERENCES "items" ("id");

ALTER TABLE
  "approved_guest_requests"
ADD
  FOREIGN KEY ("guest_id") REFERENCES "guests" ("id") ON DELETE CASCADE;

ALTER TABLE
  "approved_guest_requests"
ADD
  FOREIGN KEY ("request_id") REFERENCES "pending_guest_requests" ("id");