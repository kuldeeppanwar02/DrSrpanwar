const { config } = require("dotenv");
config({ path: ".env.local" });
const postgres = require("postgres");

async function check() {
  const sql = postgres(process.env.POSTGRES_URL);
  
  const visits = await sql`select * from patient_visits`;
  console.log("Visits count:", visits.length);
  if (visits.length > 0) {
    console.log(visits[0]);
  }
  
  const queue = await sql`select * from queue_entries where status = 'done'`;
  console.log("Done in queue count:", queue.length);
  
  process.exit(0);
}

check();
