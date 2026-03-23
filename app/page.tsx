'use client'
import { useEffect, useState, useRef } from 'react'
import type { Link } from '@/lib/supabase'
import styles from './page.module.css'

const PER_PAGE = 100

type ModalMode = 'add' | 'edit' | null

export default function Home() {
  const [links, setLinks]           = useState<Link[]>([])
  const [loading, setLoading]       = useState(true)
  const [marking, setMarking]       = useState<number | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<'all' | 'available' | 'used'>('all')
  const [modal, setModal]           = useState<ModalMode>(null)
  const [editTarget, setEditTarget] = useState<Link | null>(null)
  const [form, setForm]             = useState({ name: '', link: '' })
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<number | null>(null)
  const [toast, setToast]           = useState<string | null>(null)
  const [importing, setImporting]   = useState(false)
  const toastTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef                = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  async function loadLinks() {
    try {
      const res = await fetch(`/api/links?t=${Date.now()}`)
      const data = await res.json()
      setLinks(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLinks() }, [])

  async function openAndMark(id: number, url: string) {
    if (marking === id) return
    setMarking(id)
    try {
      const res = await fetch('/api/use', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLinks(prev => prev.map(l => l.id === id ? { ...l, status: 'Used' } : l))
      window.open(url, '_blank')
      showToast('เปิดลิงก์และบันทึกแล้ว')
    } catch {
      alert('เกิดข้อผิดพลาด')
    } finally {
      setMarking(null)
    }
  }

  async function saveLink() {
    if (!form.name.trim() || !form.link.trim()) return
    setSaving(true)
    try {
      if (modal === 'add') {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, link: form.link, status: '' }),
        })
        if (!res.ok) throw new Error()
        showToast('เพิ่มลิงก์แล้ว')
      } else if (modal === 'edit' && editTarget) {
        const res = await fetch('/api/links', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editTarget.id, name: form.name, link: form.link }),
        })
        if (!res.ok) throw new Error()
        showToast('แก้ไขแล้ว')
      }
      await loadLinks()
      closeModal()
    } catch {
      alert('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLink(id: number) {
    if (!confirm('ลบรายการนี้?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLinks(prev => prev.filter(l => l.id !== id))
      showToast('ลบแล้ว')
    } catch {
      alert('ลบไม่สำเร็จ')
    } finally {
      setDeleting(null)
    }
  }

  function openAdd() {
    setForm({ name: '', link: '' })
    setEditTarget(null)
    setModal('add')
  }

  function openEdit(l: Link) {
    setForm({ name: l.name, link: l.link })
    setEditTarget(l)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditTarget(null)
    setForm({ name: '', link: '' })
  }

  function exportCSV() {
    const rows = [['#', 'ชื่อ', 'ลิงก์', 'สถานะ']]
    filtered.forEach((l, i) =>
      rows.push([String(i + 1), l.name, l.link, l.status === 'Used' ? 'ใช้แล้ว' : 'พร้อมใช้'])
    )
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'survey-links.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('Export เสร็จแล้ว')
  }

  function triggerImport() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { alert('ไฟล์ไม่มีข้อมูล'); return }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
      const nameIdx   = headers.findIndex(h => ['name','ชื่อ','ชื่อ'].includes(h))
      const linkIdx   = headers.findIndex(h => ['link','ลิงก์','url'].includes(h))
      const statusIdx = headers.findIndex(h => ['status','สถานะ'].includes(h))

      if (nameIdx === -1 || linkIdx === -1) {
        alert('ไม่พบคอลัมน์ name และ link\nกรุณาตรวจสอบ header บรรทัดแรก')
        return
      }

      const rows = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
        return {
          name:   cols[nameIdx]   || '',
          link:   cols[linkIdx]   || '',
          status: statusIdx >= 0 ? (cols[statusIdx] || '') : '',
        }
      }).filter(r => r.name && r.link)

      if (rows.length === 0) { alert('ไม่พบข้อมูลที่ถูกต้อง'); return }
      if (!confirm(`พบ ${rows.length} รายการ\nต้องการนำเข้าทั้งหมดไหม?`)) return

      const res = await fetch('/api/links/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      if (!res.ok) throw new Error()
      showToast(`นำเข้า ${rows.length} รายการแล้ว`)
      await loadLinks()
    } catch {
      alert('นำเข้าไม่สำเร็จ')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const filtered = links.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = l.name.toLowerCase().includes(q) || l.link.toLowerCase().includes(q)
    const matchFilter =
      filter === 'all'       ? true :
      filter === 'available' ? l.status !== 'Used' :
      l.status === 'Used'
    return matchSearch && matchFilter
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const total      = links.length
  const used       = links.filter(l => l.status === 'Used').length
  const avail      = total - used
  const pct        = total > 0 ? Math.round((used / total) * 100) : 0

  if (loading) return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <p className={styles.loadingText}>กำลังโหลด...</p>
    </div>
  )

  if (error) return (
    <div className={styles.center}>
      <p className={styles.errorText}>{error}</p>
    </div>
  )

  return (
    <div className={styles.root}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>SL</div>
          <span className={styles.logoText}>Survey Links</span>
        </div>

        <nav className={styles.nav}>
          {(['all', 'available', 'used'] as const).map(f => (
            <button key={f}
              className={`${styles.navItem} ${filter === f ? styles.navActive : ''}`}
              onClick={() => { setFilter(f); setPage(1) }}>
              <span className={`${styles.navDot} ${f === 'available' ? styles.navDotGreen : f === 'used' ? styles.navDotGray : ''}`} />
              <span className={styles.navLabel}>
                {f === 'all' ? 'ทั้งหมด' : f === 'available' ? 'พร้อมใช้' : 'ใช้แล้ว'}
              </span>
              <span className={styles.navCount}>
                {f === 'all' ? total : f === 'available' ? avail : used}
              </span>
            </button>
          ))}
        </nav>

        <div className={styles.progressBox}>
          <div className={styles.progressHeader}>
            <span>ความคืบหน้า</span>
            <span className={styles.progressPct}>{pct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <p className={styles.progressSub}>{used} / {total} ลิงก์ถูกใช้แล้ว</p>
        </div>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>จัดการลิงก์</h1>
            <p className={styles.subtitle}>
              {filtered.length} รายการ{search ? ` · ค้นหา "${search}"` : ''}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary} onClick={triggerImport} disabled={importing}>
              {importing ? 'กำลังนำเข้า...' : '↑ Import CSV'}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv"
              style={{ display: 'none' }} onChange={handleFileChange} />
            <button className={styles.btnSecondary} onClick={exportCSV}>
              ↓ Export CSV
            </button>
            <button className={styles.btnPrimary} onClick={openAdd}>
              + เพิ่มลิงก์
            </button>
          </div>
        </header>

        <div className={styles.stats}>
          {[
            { label: 'ทั้งหมด',  value: total, type: 'total' },
            { label: 'พร้อมใช้', value: avail, type: 'avail' },
            { label: 'ใช้แล้ว',  value: used,  type: 'used'  },
          ].map(s => (
            <div key={s.label} className={`${styles.statCard} ${styles['statCard_' + s.type]}`}>
              <span className={styles.statNum}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input className={styles.searchInput}
              placeholder="ค้นหาชื่อหรือลิงก์..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thNum}>#</th>
                <th>ชื่อ</th>
                <th>ลิงก์</th>
                <th className={styles.thStatus}>สถานะ</th>
                <th className={styles.thActions}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((l, i) => (
                <tr key={l.id} className={l.status === 'Used' ? styles.rowUsed : styles.rowActive}>
                  <td className={styles.tdNum}>{(page - 1) * PER_PAGE + i + 1}</td>
                  <td className={styles.tdName}>{l.name}</td>
                  <td className={styles.tdLink}>
                    <span className={styles.linkPreview}>{l.link}</span>
                  </td>
                  <td>
                    {l.status === 'Used'
                      ? <span className={styles.badgeUsed}>ใช้แล้ว</span>
                      : <span className={styles.badgeAvail}>พร้อมใช้</span>}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {l.status !== 'Used' && (
                        <button className={styles.btnOpen}
                          onClick={() => openAndMark(l.id, l.link)}
                          disabled={marking === l.id}>
                          {marking === l.id ? '...' : 'เปิด ↗'}
                        </button>
                      )}
                      <button className={styles.btnEdit} onClick={() => openEdit(l)}>แก้ไข</button>
                      <button className={styles.btnDel}
                        onClick={() => deleteLink(l.id)}
                        disabled={deleting === l.id}>
                        {deleting === l.id ? '...' : 'ลบ'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paged.length === 0 && <div className={styles.empty}>ไม่พบข้อมูล</div>}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}>← ก่อนหน้า</button>
            <div className={styles.pageNums}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | string)[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n); return acc
                }, [])
                .map((n, i) => typeof n === 'string'
                  ? <span key={`e${i}`} className={styles.pageEllipsis}>{n}</span>
                  : <button key={n}
                      className={`${styles.pageNum} ${page === n ? styles.pageActive : ''}`}
                      onClick={() => setPage(n)}>{n}</button>
                )}
            </div>
            <button className={styles.pageBtn}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}>ถัดไป →</button>
          </div>
        )}
      </main>

      {/* MODAL */}
      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modal === 'add' ? 'เพิ่มลิงก์ใหม่' : 'แก้ไขลิงก์'}
              </h2>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.fieldLabel}>ชื่อ</label>
              <input className={styles.fieldInput} placeholder="เช่น realRD001"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <label className={styles.fieldLabel}>ลิงก์ URL</label>
              <input className={styles.fieldInput} placeholder="https://..."
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={closeModal}>ยกเลิก</button>
              <button className={styles.btnPrimary} onClick={saveLink}
                disabled={saving || !form.name.trim() || !form.link.trim()}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
