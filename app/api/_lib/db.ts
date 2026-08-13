import { env } from "cloudflare:workers";
export type Participant={id:number;luckyNumber:string;name:string;store:string;phone:string;instagram:string;status:string;createdAt:string;wonAt:string|null};
export function database(){if(!env.DB)throw new Error("Banco de dados indisponível.");return env.DB}
export async function initialize(){const db=database();await db.batch([
db.prepare(`CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, lucky_number TEXT NOT NULL UNIQUE, name TEXT NOT NULL, store TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, instagram TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`),
db.prepare(`CREATE TABLE IF NOT EXISTS draws (id TEXT PRIMARY KEY, participant_id INTEGER NOT NULL, lucky_number TEXT NOT NULL, drawn_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
db.prepare(`CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status)`),
db.prepare(`CREATE INDEX IF NOT EXISTS idx_draws_participant_id ON draws(participant_id)`),
db.prepare(`INSERT OR IGNORE INTO settings(key,value) VALUES('registrations_open','true')`)]);return db}
export function adminAllowed(request:Request){const configured=(env as unknown as {ADMIN_PASSWORD?:string}).ADMIN_PASSWORD||"fashiondate2026";return request.headers.get("x-admin-key")===configured||new URL(request.url).searchParams.get("key")===configured}
export function row(raw:Record<string,unknown>):Participant{return{id:Number(raw.id),luckyNumber:String(raw.lucky_number),name:String(raw.name),store:String(raw.store),phone:String(raw.phone),instagram:String(raw.instagram),status:String(raw.status),createdAt:String(raw.created_at),wonAt:raw.won_at?String(raw.won_at):null}}
