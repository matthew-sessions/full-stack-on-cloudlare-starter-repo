CREATE TABLE `subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`plan` text NOT NULL,
	`reference_id` text NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`status` text DEFAULT 'incomplete',
	`period_start` integer,
	`period_end` integer,
	`cancel_at_period_end` integer,
	`seats` integer
);
--> statement-breakpoint
ALTER TABLE `user` ADD `stripe_customer_id` text;