CREATE TABLE `closing_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`closing_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`purchase_type` text NOT NULL,
	`units_per_pack` integer,
	`quantity` integer NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	FOREIGN KEY (`closing_id`) REFERENCES `daily_closings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_closing_product` ON `closing_items` (`closing_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `daily_closings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`opening_cash_cents` integer NOT NULL,
	`gross_sales_cents` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_closings_date_unique` ON `daily_closings` (`date`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`purchase_type` text NOT NULL,
	`cost_cents` integer NOT NULL,
	`units_per_pack` integer,
	`archived` integer DEFAULT false NOT NULL
);
