import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET — ดึงลิงก์ทั้งหมด (แทน getData)
export async function GET() {
  const { data, error } = await supabase
    .from('links')
    .select('id, name, link, status')
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  return response
}

// POST — เพิ่มลิงก์ใหม่
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, link, status } = body

  if (!name || !link) {
    return NextResponse.json({ error: 'name และ link จำเป็น' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('links')
    .insert({ name, link, status: status || '' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT — แก้ไขลิงก์
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, name, link } = body

  if (!id || !name || !link) {
    return NextResponse.json({ error: 'id, name และ link จำเป็น' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('links')
    .update({ name, link })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — ลบลิงก์
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: 'id จำเป็น' }, { status: 400 })
  }

  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}