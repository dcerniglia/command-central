ALTER TABLE "task_areas" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "task_items" ADD COLUMN "archived_at" timestamp with time zone;