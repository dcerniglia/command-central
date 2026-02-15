ALTER TABLE "task_lists" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "task_lists" CASCADE;--> statement-breakpoint
ALTER TABLE "task_items" DROP CONSTRAINT "task_items_list_id_task_lists_id_fk";
--> statement-breakpoint
ALTER TABLE "task_items" DROP CONSTRAINT "task_items_area_id_task_areas_id_fk";
--> statement-breakpoint
ALTER TABLE "task_items" DROP COLUMN "list_id";--> statement-breakpoint
ALTER TABLE "task_items" DROP COLUMN "area_id";