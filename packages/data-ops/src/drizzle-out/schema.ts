import { sqliteTable, AnySQLiteColumn, text, numeric, index, real, integer, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const links = sqliteTable("links", {
	linkId: text("link_id").primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	destinations: numeric().notNull(),
	created: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updated: numeric().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	name: text().notNull(),
});

export const linkClicks = sqliteTable("link_clicks", {
	id: text().notNull(),
	accountId: text("account_id").notNull(),
	country: text(),
	destination: text().notNull(),
	clickedTime: numeric("clicked_time").notNull(),
	latitude: real(),
	longitude: real(),
},
(table) => [
	index("idx_link_clicks_account_id").on(table.accountId),
	index("idx_link_clicks_clicked_time").on(table.clickedTime),
	index("idx_link_clicks_id").on(table.id),
]);

export const destinationEvaluations = sqliteTable("destination_evaluations", {
	id: text().primaryKey(),
	linkId: text("link_id").notNull(),
	accountId: text("account_id").notNull(),
	destinationUrl: text("destination_url").notNull(),
	status: text().notNull(),
	reason: text().notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("idx_destination_evaluations_account_time").on(table.accountId, table.createdAt),
]);

export const user = sqliteTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: integer().notNull(),
	image: text(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
});

export const session = sqliteTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: numeric().notNull(),
	token: text().notNull(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull().references(() => user.id),
});

export const account = sqliteTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull().references(() => user.id),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: numeric(),
	refreshTokenExpiresAt: numeric(),
	scope: text(),
	password: text(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
});

export const verification = sqliteTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: numeric().notNull(),
	createdAt: numeric(),
	updatedAt: numeric(),
});

