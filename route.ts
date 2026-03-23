import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// แทน getData() ใน Apps Script
// ดึงลิงก์ทั้งหมดจากตาราง links
export async function GET() {
  const { data, error } = await supabase
    .from('links')
    .select('id, name, link, status')
    .order('id', { ascending: true })

  if (error) {
    console.error('GET /api/links error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
