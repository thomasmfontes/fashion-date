import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const participants=sqliteTable("participants",{id:integer("id").primaryKey({autoIncrement:true}),luckyNumber:text("lucky_number").notNull().unique(),name:text("name").notNull(),store:text("store").notNull(),phone:text("phone").notNull().unique(),instagram:text("instagram").notNull(),status:text("status").notNull().default("active"),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const settings=sqliteTable("settings",{key:text("key").primaryKey(),value:text("value").notNull()});
