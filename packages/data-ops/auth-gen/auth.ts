import { createBetterAuth } from "@/auth";
import Database from "better-sqlite3";

export const auth = createBetterAuth(new Database("auth-gen/tmp.sqlite"));
