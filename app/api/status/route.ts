import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'SYSTEM')
    .single()

  console.log('DATA:', JSON.stringify(data))
  console.log('ERROR:', JSON.stringify(error))

  if (error) {
    return NextResponse.json({ status: 'ERROR', detail: error.message })
  }

  return NextResponse.json({ status: data.value ?? 'ON' })
}