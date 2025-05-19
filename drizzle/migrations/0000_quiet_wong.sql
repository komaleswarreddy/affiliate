CREATE TABLE `affiliates` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`user_id` text NOT NULL,
	`referral_code` text NOT NULL,
	`current_tier_id` text,
	`parent_affiliate_id` text,
	`company_name` text,
	`website_url` text,
	`social_media` text DEFAULT '{}',
	`tax_id` text,
	`tax_form_type` text,
	`payment_threshold` text DEFAULT '50' NOT NULL,
	`preferred_currency` text DEFAULT 'USD' NOT NULL,
	`promotional_methods` text DEFAULT '[]',
	`status` text DEFAULT 'pending' NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions` text NOT NULL,
	`is_custom` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subdomain` text NOT NULL,
	`domain` text,
	`logo_url` text,
	`primary_color` text DEFAULT '#3667CE',
	`secondary_color` text DEFAULT '#36A490',
	`subscription_tier` text DEFAULT 'standard' NOT NULL,
	`max_users` integer DEFAULT 5 NOT NULL,
	`max_affiliates` integer DEFAULT 20 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	`settings` text DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text,
	`country_code` text DEFAULT 'US',
	`timezone` text DEFAULT 'America/New_York',
	`language` text DEFAULT 'en',
	`referral_code` text,
	`role_id` text,
	`terms_accepted` integer DEFAULT 0 NOT NULL,
	`marketing_consent` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`is_affiliate` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliates_referral_code_unique` ON `affiliates` (`referral_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_subdomain_unique` ON `tenants` (`subdomain`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);