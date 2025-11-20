CREATE SCHEMA "public";
CREATE TABLE "appointments" (
	"id" varchar(255) PRIMARY KEY,
	"reference_number" varchar(50) NOT NULL CONSTRAINT "appointments_reference_number_key" UNIQUE,
	"slot_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"patient_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "chk_reason_length" CHECK (CHECK (((length(reason) >= 3) AND (length(reason) <= 500))))
);
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "providers" (
	"id" varchar(255) PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"specialty" varchar(255) NOT NULL,
	"bio" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "time_slots" (
	"id" varchar(255) PRIMARY KEY,
	"provider_id" varchar(255) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "time_slots"("id") ON DELETE RESTRICT;
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "appointments_pkey" ON "appointments" ("id");
CREATE UNIQUE INDEX "appointments_reference_number_key" ON "appointments" ("reference_number");
CREATE INDEX "idx_created_at" ON "appointments" ("created_at");
CREATE INDEX "idx_patient_id" ON "appointments" ("patient_id");
CREATE INDEX "idx_provider_id_appts" ON "appointments" ("provider_id");
CREATE INDEX "idx_reference_number" ON "appointments" ("reference_number");
CREATE INDEX "idx_slot_id" ON "appointments" ("slot_id");
CREATE INDEX "idx_status" ON "appointments" ("status");
CREATE UNIQUE INDEX "ux_appointments_slot_id_not_cancelled" ON "appointments" ("slot_id");
CREATE INDEX "idx_email" ON "patients" ("email");
CREATE INDEX "idx_name" ON "patients" ("last_name","first_name");
CREATE INDEX "idx_phone" ON "patients" ("phone");
CREATE UNIQUE INDEX "patients_pkey" ON "patients" ("id");
CREATE UNIQUE INDEX "ux_patients_email" ON "patients" ("email");
CREATE INDEX "idx_specialty" ON "providers" ("specialty");
CREATE UNIQUE INDEX "providers_pkey" ON "providers" ("id");
CREATE INDEX "idx_available" ON "time_slots" ("available");
CREATE INDEX "idx_provider_available" ON "time_slots" ("provider_id","available","start_time");
CREATE INDEX "idx_provider_id" ON "time_slots" ("provider_id");
CREATE INDEX "idx_start_time" ON "time_slots" ("start_time");
CREATE UNIQUE INDEX "time_slots_pkey" ON "time_slots" ("id");
CREATE UNIQUE INDEX "ux_time_slots_provider_start_time" ON "time_slots" ("provider_id","start_time");
CREATE VIEW "provider_appointments_view" TABLESPACE public AS (SELECT a.id, a.provider_id, concat(p.first_name, ' ', p.last_name) AS patient_name, p.email AS patient_email, ts.start_time, ts.end_time, a.reason, a.status, a.created_at FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN time_slots ts ON a.slot_id::text = ts.id::text ORDER BY ts.start_time DESC);