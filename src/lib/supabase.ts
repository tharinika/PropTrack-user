import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://abnyberowlisohijoyyi.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibnliZXJvd2xpc29oaWpveXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODgyNTUsImV4cCI6MjA5MDg2NDI1NX0.nOpPyGy4tLaeqV-OvgeJrf4_Wss1mfMsxV0s5UTY2d8"

export const supabase = createClient(supabaseUrl, supabaseKey)