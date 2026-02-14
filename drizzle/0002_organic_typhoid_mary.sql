ALTER TABLE "task_items" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "task_items" ADD COLUMN "estimate_minutes" integer;--> statement-breakpoint
ALTER TABLE "task_items" ADD COLUMN "time_spent_minutes" integer;