import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// แทน markAsUsed(rowNumber) ใน Apps Script
// รับ { id: number } แล้วอัปเดต status → "Used"
export async function PATCH(req: NextRequest) {
  let id: number

  try {
    const body = await req.json()
    id = Number(body.id)
    if (!id || isNaN(id)) throw new Error('id ไม่ถูกต้อง')
  } catch {
    return NextResponse.json({ error: 'กรุณาส่ง id ที่ถูกต้อง' }, { status: 400 })
  }

  const { error } = await supabase
    .from('links')
    .update({ status: 'Used' })
    .eq('id', id)

  if (error) {
    console.error('PATCH /api/use error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
