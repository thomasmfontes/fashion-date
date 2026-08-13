CREATE TABLE `participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lucky_number` text NOT NULL,
	`name` text NOT NULL,
	`store` text NOT NULL,
	`phone` text NOT NULL,
	`instagram` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_lucky_number_unique` ON `participants` (`lucky_number`);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_phone_unique` ON `participants` (`phone`);
--> statement-breakpoint
CREATE INDEX `idx_participants_status` ON `participants` (`status`);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `settings` (`key`, `value`) VALUES ('registrations_open', 'true');
