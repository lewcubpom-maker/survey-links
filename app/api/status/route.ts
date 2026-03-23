import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'SYSTEM')
    .single()

  if (error || !data) {
    return NextResponse.json({ status: 'ON' })
  }

  return NextResponse.json({ status: (data as any).value ?? 'ON' })
}