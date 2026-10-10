import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  CircleHelp,
  FileSpreadsheet,
  FileUp,
  Filter,
  FolderOpen,
  Plus,
  Search,
  X,
} from 'lucide-react'

type Row = Record<string, string>
type Rule = { id: number; column: string; value: string }

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [fileName, setFileName] = useState('')
  const [rules, setRules] = useState<Rule[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredRows = useMemo(() => {
    const visible = rows.filter((row) => {
      const matchesRules = rules.every((rule) =>
        !rule.value.trim() || (row[rule.column] ?? '').toLowerCase().includes(rule.value.trim().toLowerCase()),
      )
      const matchesSearch = !search.trim() || headers.some((header) =>
        (row[header] ?? '').toLowerCase().includes(search.trim().toLowerCase()),
      )
      return matchesRules && matchesSearch
    })

    if (!sort) return visible
    return [...visible].sort((left, right) => {
      const a = left[sort.column] ?? ''
      const b = right[sort.column] ?? ''
      const aNumber = Number(a)
      const bNumber = Number(b)
      const comparison = a !== '' && b !== '' && Number.isFinite(aNumber) && Number.isFinite(bNumber)
        ? aNumber - bNumber
        : a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }, [headers, rows, rules, search, sort])

  function loadFile(file?: File) {
    if (!file) return
    setError('')
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Choose a .csv file to continue.')
      return
    }
    setLoading(true)
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: ({ data, meta, errors }) => {
        const fields = (meta.fields ?? []).filter(Boolean)
        if (!fields.length) {
          setError('This file has no column headers. Add a header row and try again.')
          setLoading(false)
          return
        }
        if (errors.length && !data.length) {
          setError('We could not read this CSV. Check its formatting and try again.')
          setLoading(false)
          return
        }
        setHeaders(fields)
        setRows(data.filter((row) => Object.values(row).some((value) => value?.trim())))
        setFileName(file.name)
        setRules([])
        setSearch('')
        setSort(null)
        setLoading(false)
      },
      error: () => {
        setError('We could not read this CSV. Check its formatting and try again.')
        setLoading(false)
      },
    })
  }

  function addRule() {
    if (!headers.length) return
    const used = new Set(rules.map((rule) => rule.column))
    const nextColumn = headers.find((header) => !used.has(header)) ?? headers[0]
    setRules((current) => [...current, { id: Date.now() + Math.random(), column: nextColumn, value: '' }])
  }

  function updateRule(id: number, changes: Partial<Rule>) {
    setRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...changes } : rule))
  }

  function toggleSort(column: string) {
    setSort((current) => current?.column === column
      ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { column, direction: 'asc' })
  }

  function reset() {
    setHeaders([])
    setRows([])
    setRules([])
    setSearch('')
    setFileName('')
    setSort(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Siddhant Fieldnotes home">
          <span className="brand-mark"><FileSpreadsheet size={19} strokeWidth={1.8} /></span>
          <span>siddhant fieldnotes<span className="brand-period">.</span></span>
        </a>
        <div className="privacy-note"><span className="privacy-dot" />Your files stay in this browser</div>
      </header>

      <section className="workspace" id="top">
        <div className="intro-row">
          <div>
            <div className="eyebrow"><span>01</span> DATA WORKSPACE</div>
            <h1>Make sense<br className="mobile-break" /> of your <em>data.</em></h1>
            <p className="intro-copy">Drop in a CSV. Find the rows that matter.</p>
          </div>
          {headers.length > 0 && (
            <button className="button button-quiet replace-button" onClick={() => inputRef.current?.click()}>
              <FolderOpen size={16} /> Replace file
            </button>
          )}
        </div>

        {!headers.length ? (
          <section
            className={`upload-zone ${dragging ? 'is-dragging' : ''} ${loading ? 'is-loading' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); loadFile(event.dataTransfer.files[0]) }}
            aria-label="CSV upload area"
          >
            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => loadFile(event.target.files?.[0])}
            />
            <div className="upload-icon"><FileUp size={24} strokeWidth={1.7} /></div>
            <h2>{loading ? 'Reading your file…' : 'Bring your data in'}</h2>
            <p>Drop your CSV anywhere in this area, or browse files</p>
            <button className="button button-dark" onClick={() => inputRef.current?.click()} disabled={loading}>
              <FolderOpen size={16} /> Choose a CSV
            </button>
            <span className="file-type">CSV files only <span>·</span> Processed locally</span>
          </section>
        ) : (
          <>
            <section className="file-strip">
              <div className="file-badge"><FileSpreadsheet size={18} /></div>
              <div className="file-details"><strong>{fileName}</strong><span>{headers.length} columns <i>·</i> {rows.length.toLocaleString()} records</span></div>
              <span className="ready-label"><Check size={14} /> READY</span>
            </section>

            <section className="filter-section">
              <div className="section-heading">
                <div className="section-title"><span className="heading-icon"><Filter size={16} /></span><h2>Refine results</h2><span className="rule-count">{rules.length}</span></div>
                <span className="match-note">All conditions must match</span>
              </div>
              <div className="filter-controls">
                <div className="rule-list">
                  {rules.length === 0 && <span className="no-rules">No column filters yet</span>}
                  {rules.map((rule, index) => (
                    <div className="rule-row" key={rule.id}>
                      <span className="rule-connector">{index === 0 ? 'WHERE' : 'AND'}</span>
                      <label className="select-wrap">
                        <select aria-label="Filter column" value={rule.column} onChange={(event) => updateRule(rule.id, { column: event.target.value })}>
                          {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                        </select><ChevronDown size={14} />
                      </label>
                      <span className="contains-label">contains</span>
                      <input className="filter-input" aria-label={`Filter value for ${rule.column}`} placeholder="Type to match…" value={rule.value} onChange={(event) => updateRule(rule.id, { value: event.target.value })} />
                      <button className="icon-button remove-rule" title="Remove filter" aria-label="Remove filter" onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))}><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <button className="button button-add" onClick={addRule}><Plus size={16} /> Add filter</button>
              </div>
              <div className="filter-footer">
                <span><CircleHelp size={14} /> Filters match text anywhere in a cell</span>
                {(rules.length > 0 || search) && <button className="text-button" onClick={() => { setRules([]); setSearch('') }}>Clear all</button>}
              </div>
            </section>

            <section className="table-section">
              <div className="table-heading">
                <div className="table-title"><h2>Records</h2><span className="result-count">{filteredRows.length.toLocaleString()} <i>/</i> {rows.length.toLocaleString()}</span></div>
                <label className="search-box"><Search size={16} /><input aria-label="Search all columns" placeholder="Search all columns" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></label>
              </div>
              <div className="table-frame">
                <div className="table-scroll">
                  <table>
                    <thead><tr><th className="row-index">#</th>{headers.map((header) => (
                      <th key={header}><button className={`sort-button ${sort?.column === header ? 'is-sorted' : ''}`} onClick={() => toggleSort(header)}>{header}{sort?.column === header ? sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} /> : <ArrowUpDown size={13} />}</button></th>
                    ))}</tr></thead>
                    <tbody>
                      {filteredRows.slice(0, 500).map((row, index) => (
                        <tr key={index}><td className="row-index">{(index + 1).toString().padStart(2, '0')}</td>{headers.map((header) => <td key={header} title={row[header]}>{row[header] || <span className="empty-cell">—</span>}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRows.length === 0 && <div className="table-empty"><Search size={21} /><strong>No matching records</strong><span>Try changing or clearing your filters.</span></div>}
                </div>
                {filteredRows.length > 500 && <div className="table-limit">Showing first 500 of {filteredRows.length.toLocaleString()} matching records.</div>}
              </div>
            </section>
          </>
        )}

        {error && <div className="error-message" role="alert"><X size={16} />{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={15} /></button></div>}
        {headers.length > 0 && <div className="workspace-footer"><span>FIELDNOTES <i>·</i> CSV VIEWER</span><button className="text-button reset-button" onClick={reset}>Start over</button></div>}
      </section>
      <footer className="page-footer"><span>SIDDHANT FIELDNOTES / 2026</span><span>Made for the curious</span></footer>
    </main>
  )
}

export default App