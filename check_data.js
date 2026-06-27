import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://wcladzpdkjhdfggttfkw.supabase.co', 'sb_publishable_FD1yOdF5XJjt4duaZpiLUA_suo9Cghr')

async function checkData() {
  const { data, error } = await supabase.from('attendance').select('*').order('created_at', { ascending: false }).limit(5)
  if (error) {
    console.error("ERROR:", error)
  } else {
    console.log("LAST 5 ATTENDANCE LOGS:")
    console.log(JSON.stringify(data, null, 2))
  }
}

checkData()
