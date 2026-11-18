// Aplica os e-mails de autenticação no projeto Supabase do UDK.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_... node supabase/templates/apply.mjs
import { readFileSync } from "node:fs";
const here = new URL(".", import.meta.url);
const ref = "gyhsirfwwsmugvirpwsi";
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("Defina SUPABASE_ACCESS_TOKEN");
const subjects = JSON.parse(readFileSync(new URL("subjects.json", here), "utf8"));
const read = (name) => readFileSync(new URL(`${name}.html`, here), "utf8");
const body = {};
for (const key of Object.keys(subjects)) {
  body[`mailer_subjects_${key}`] = subjects[key];
  body[`mailer_templates_${key}_content`] = read(key);
}
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const result = await response.json();
if (!response.ok) console.log(JSON.stringify(result).slice(0, 600));
console.log(response.status, Object.keys(subjects).map((key) => `${key}: ${result[`mailer_subjects_${key}`] ?? "?"}`).join(" | "));
