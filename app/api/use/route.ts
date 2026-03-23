import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  let id: number

  try {
    const body = await req.json()
    id = Number(body.id)
    if (!id || isNaN(id)) throw new Error('id ไม่ถูกต้อง')
  } catch {
    return NextResponse.json({ error: 'กรุณาส่ง id ที่ถูกต้อง' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('links')
    .update({ status: 'Used' })
    .eq('id', id)
    .select()

  console.log('UPDATE id:', id)
  console.log('DATA:', JSON.stringify(data))
  console.log('ERROR:', JSON.stringify(error))

  if (error) {
    return NextResponse.json({ error: error.message, detail: error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data })
}