const postgres = require('postgres');
const env = require('dotenv').config({ path: '.env.local' }).parsed || process.env;

async function run() {
  const sql = postgres(env.SUPABASE_DATABASE_URL);
  try {
    await sql`ALTER TABLE queue_entries ADD COLUMN is_report_check boolean DEFAULT false;`;
    console.log("Column added successfully!");
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log("Column already exists.");
    } else {
      console.error(e);
    }
  } finally {
    await sql.end();
  }
}
run();
