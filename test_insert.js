import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://wcladzpdkjhdfggttfkw.supabase.co', 'sb_publishable_FD1yOdF5XJjt4duaZpiLUA_suo9Cghr')

async function testInsert() {
  const { data, error } = await supabase.from('leave_requests').select('*').limit(1)

  if (error) {
    console.error("SUPABASE ERROR:", error)
  } else {
    console.log("SUCCESS:", data)
  }
}

testInsert()
