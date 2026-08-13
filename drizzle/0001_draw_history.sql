CREATE TABLE `draws` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` integer NOT NULL,
	`lucky_number` text NOT NULL,
	`drawn_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_draws_participant_id` ON `draws` (`participant_id`);
