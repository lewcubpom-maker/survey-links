'use client'
import { useEffect, useState } from 'react'
import type { Link } from '@/lib/supabase'
import styles from './page.module.css'

export default function Home() {
  const [links, setLinks]       = useState<Link[]>([])
  const [systemOn, setSystemOn] = useState(true)
  const [loading, setLoading]   = useState(true)
  const [marking, setMarking]   = useState<number | null>(null)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [linksRes, statusRes] = await Promise.all([
          fetch('/api/links'),
          fetch('/api/status'),
        ])
        const linksData  = await linksRes.json()
        const statusData = await statusRes.json()

        if (!linksRes.ok) throw new Error(linksData.error)
        setLinks(linksData)
        setSystemOn(statusData.status === 'ON')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function markUsed(id: number) {
    setMarking(id)
    try {
      const res = await fetch('/api/use', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setLinks(prev =>
        prev.map(l => l.id === id ? { ...l, status: 'Used' } : l)
      )
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setMarking(null)
    }
  }

  const total  = links.length
  const used   = links.filter(l => l.status === 'Used').length
  const avail  = total - used

  if (loading) return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <p style={{ color: 'var(--muted)', marginTop: 12 }}>กำลังโหลด...</p>
    </div>
  )

  if (error) return (
    <div className={styles.center}>
      <p style={{ color: 'var(--red)' }}>เกิดข้อผิดพลาด: {error}</p>
    </div>
  )

  if (!systemOn) return (
    <div className={styles.center}>
      <div className={styles.offBadge}>ระบบปิดชั่วคราว</div>
      <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>
        กรุณาติดต่อผู้ดูแลระบบ
      </p>
    </div>
  )

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Survey Link System</h1>
          <p className={styles.subtitle}>จัดการลิงก์แบบสำรวจทั้งหมด</p>
        </div>
        <div className={styles.onBadge}>ระบบเปิดใช้งาน</div>
      </header>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{total}</span>
          <span className={styles.statLabel}>ลิงก์ทั้งหมด</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum} style={{ color: 'var(--green)' }}>{avail}</span>
          <span className={styles.statLabel}>พร้อมใช้งาน</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum} style={{ color: 'var(--muted)' }}>{used}</span>
          <span className={styles.statLabel}>ใช้แล้ว</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>ชื่อ</th>
              <th>ลิงก์</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {links.map((l, i) => (
              <tr key={l.id} className={l.status === 'Used' ? styles.usedRow : ''}>
                <td className={styles.numCol}>{i + 1}</td>
                <td>{l.name}</td>
                <td>
                  <a href={l.link} target="_blank" rel="noopener noreferrer">
                    เปิดลิงก์ ↗
                  </a>
                </td>
                <td>
                  {l.status === 'Used'
                    ? <span className={styles.badgeUsed}>ใช้แล้ว</span>
                    : <span className={styles.badgeAvail}>พร้อมใช้</span>
                  }
                </td>
                <td>
                  {l.status !== 'Used' && (
                    <button
                      onClick={() => markUsed(l.id)}
                      disabled={marking === l.id}
                      className={styles.useBtn}
                    >
                      {marking === l.id ? 'กำลังบันทึก...' : 'ใช้งาน'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {links.length === 0 && (
          <p className={styles.empty}>ยังไม่มีลิงก์ในระบบ</p>
        )}
      </div>
    </main>
  )
}
