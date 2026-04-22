import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import { Zap, X, ChevronDown, ChevronUp } from 'lucide-react'

// ── Keyword chip ──────────────────────────────────────────────────────────────
const Chip = ({ label, variant }) => {
    const styles = variant === 'matched'
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-red-50 text-red-600 border-red-200'
    return (
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles}`}>
            {label}
        </span>
    )
}

// ── Section bar ───────────────────────────────────────────────────────────────
const Bar = ({ label, value }) => {
    const color = value >= 75 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444'
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-16 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
            </div>
            <span className="text-[10px] font-semibold w-6 text-right" style={{ color }}>{value}</span>
        </div>
    )
}

// ── Panel content (shared desktop + mobile) ───────────────────────────────────
const PanelContent = ({ jd, setJd, status, result, open, setOpen }) => (
    <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '420px' }}>
        <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Job Description
            </label>
            <textarea
                rows={3}
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50 text-gray-700"
                placeholder="Paste job description… score updates automatically."
                value={jd}
                onChange={e => setJd(e.target.value)}
            />
            <p className="text-[10px] text-gray-400 mt-1">
                {status === 'typing' && '⏳ Waiting for you to stop typing…'}
                {status === 'loading' && '🔄 Analysing…'}
                {status === 'done' && '✅ Score updated'}
                {status === 'error' && '❌ Analysis failed, retrying on next change'}
                {status === 'idle' && 'Score updates 2s after you stop typing'}
            </p>
        </div>

        {result && (
            <div className="space-y-3">
                {/* Ring + bars */}
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <svg width="64" height="64" viewBox="0 0 64 64">
                            {(() => {
                                const r2 = 26, c2 = 2 * Math.PI * r2
                                const f2 = (result.score / 100) * c2
                                const col = result.score >= 75 ? '#22c55e' : result.score >= 50 ? '#f59e0b' : '#ef4444'
                                return <>
                                    <circle cx="32" cy="32" r={r2} fill="none" stroke="#e5e7eb" strokeWidth="7" />
                                    <circle cx="32" cy="32" r={r2} fill="none" stroke={col} strokeWidth="7"
                                        strokeDasharray={`${f2} ${c2}`} strokeLinecap="round"
                                        transform="rotate(-90 32 32)"
                                        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                                    <text x="32" y="36" textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">{result.score}</text>
                                </>
                            })()}
                        </svg>
                        <span className="text-[10px] text-gray-400">/ 100</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <Bar label="Keywords" value={result.sectionScores?.keywords ?? 0} />
                        <Bar label="Formatting" value={result.sectionScores?.formatting ?? 0} />
                        <Bar label="Relevance" value={result.sectionScores?.relevance ?? 0} />
                        <Bar label="Impact" value={result.sectionScores?.impact ?? 0} />
                    </div>
                </div>

                {/* Summary */}
                {result.summary && (
                    <p className="text-[11px] text-gray-500 leading-relaxed bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                        {result.summary}
                    </p>
                )}

                {/* Keywords + Tips toggle */}
                <div>
                    <button
                        onClick={() => setOpen(p => !p)}
                        className="text-[11px] font-semibold text-gray-600 flex items-center gap-1 hover:text-gray-800 w-full"
                    >
                        Keywords & Tips
                        {open ? <ChevronUp className="size-3 ml-auto" /> : <ChevronDown className="size-3 ml-auto" />}
                    </button>
                    {open && (
                        <div className="mt-2 space-y-2">
                            <p className="text-[10px] font-semibold text-gray-500">✅ Matched</p>
                            <div className="flex flex-wrap gap-1">
                                {result.matchedKeywords?.length > 0
                                    ? result.matchedKeywords.slice(0, 12).map(k => <Chip key={k} label={k} variant="matched" />)
                                    : <span className="text-[10px] text-gray-400">None found</span>}
                            </div>
                            <p className="text-[10px] font-semibold text-gray-500 mt-1">❌ Missing</p>
                            <div className="flex flex-wrap gap-1">
                                {result.missingKeywords?.length > 0
                                    ? result.missingKeywords.slice(0, 12).map(k => <Chip key={k} label={k} variant="missing" />)
                                    : <span className="text-[10px] text-gray-400">All matched 🎉</span>}
                            </div>
                            {result.formattingTips?.length > 0 && (
                                <div className="space-y-1.5 mt-1">
                                    <p className="text-[10px] font-semibold text-gray-500">💡 Tips</p>
                                    {result.formattingTips.map((t, i) => {
                                        const s = t.type === 'error'
                                            ? { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '✕' }
                                            : t.type === 'success'
                                                ? { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: '✓' }
                                                : { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', icon: '⚠' }
                                        return (
                                            <div key={i} className="flex gap-1.5 items-start text-[10px] rounded-lg p-2 border"
                                                style={{ backgroundColor: s.bg, borderColor: s.border }}>
                                                <span className="font-bold shrink-0" style={{ color: s.text }}>{s.icon}</span>
                                                <span style={{ color: s.text }}>{t.tip}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
)

// ── Main ATSBadge ─────────────────────────────────────────────────────────────
const ATSBadge = ({ resumeData }) => {
    const { token } = useSelector(s => s.auth)
    const [jd, setJd] = useState('')
    const [result, setResult] = useState(null)
    const [status, setStatus] = useState('idle')
    const [open, setOpen] = useState(false)
    const [showPanel, setShowPanel] = useState(false)
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
    const btnRef = useRef(null)
    const dropdownRef = useRef(null)
    const debounceRef = useRef(null)

    const buildResumeText = useCallback(() => {
        const r = resumeData
        const lines = []
        if (r.personal_info?.name) lines.push(r.personal_info.name)
        if (r.personal_info?.email) lines.push(r.personal_info.email)
        if (r.professional_summary) lines.push(r.professional_summary)
        r.experience?.forEach(e => {
            lines.push(`${e.title || ''} at ${e.company || ''}`)
            if (e.description) lines.push(e.description)
        })
        r.education?.forEach(e => lines.push(`${e.degree || ''} at ${e.institution || ''}`))
        r.projects?.forEach(p => {
            lines.push(p.name || '')
            if (p.description) lines.push(p.description)
        })
        r.skills?.forEach(s => lines.push(typeof s === 'string' ? s : s.name || ''))
        return lines.filter(Boolean).join('\n')
    }, [resumeData])

    const runAnalysis = useCallback(async (jobDescription) => {
        const resumeText = buildResumeText()
        if (!resumeText.trim() || !jobDescription.trim()) return
        setStatus('loading')
        try {
            const { data } = await api.post(
                '/api/ats/check',
                { resumeText, jobDescription },
                { headers: { Authorization: token } }
            )
            if (data.success) { setResult(data.result); setStatus('done') }
            else setStatus('error')
        } catch { setStatus('error') }
    }, [buildResumeText, token])

    // Debounce on JD change
    useEffect(() => {
        if (!jd.trim()) { setStatus('idle'); setResult(null); return }
        setStatus('typing')
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => runAnalysis(jd), 2000)
        return () => clearTimeout(debounceRef.current)
    }, [jd, runAnalysis])

    // Debounce on resume content change
    useEffect(() => {
        if (!jd.trim()) return
        setStatus('typing')
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => runAnalysis(jd), 2000)
        return () => clearTimeout(debounceRef.current)
    }, [resumeData])

    // Recalculate dropdown position from button rect
    const updatePos = useCallback(() => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setDropdownPos({ top: rect.bottom + 8, left: rect.left })
        }
    }, [])

    const handleToggle = () => {
        updatePos()
        setShowPanel(p => !p)
    }

    // Re-track position on scroll AND resize
    useEffect(() => {
        if (!showPanel) return
        window.addEventListener('scroll', updatePos, true)
        window.addEventListener('resize', updatePos)
        return () => {
            window.removeEventListener('scroll', updatePos, true)
            window.removeEventListener('resize', updatePos)
        }
    }, [showPanel, updatePos])

    // Close on outside click (desktop)
    useEffect(() => {
        const handler = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                btnRef.current && !btnRef.current.contains(e.target)
            ) setShowPanel(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Lock background scroll on mobile — use position:fixed trick to prevent page jump
    useEffect(() => {
        if (!showPanel) return
        const isMobile = window.innerWidth < 768
        if (!isMobile) return
        const scrollY = window.scrollY
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.left = '0'
        document.body.style.right = '0'
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.position = ''
            document.body.style.top = ''
            document.body.style.left = ''
            document.body.style.right = ''
            document.body.style.overflow = ''
            window.scrollTo(0, scrollY)
        }
    }, [showPanel])

    const scoreColor = result
        ? result.score >= 75 ? '#22c55e' : result.score >= 50 ? '#f59e0b' : '#ef4444'
        : null

    return (
        <>
            {/* ── Trigger button ── */}
            <button
                ref={btnRef}
                onClick={handleToggle}
                className="flex items-center gap-1 text-sm text-green-600 bg-gradient-to-br from-green-50 to-green-100 ring-green-300 hover:ring transition-all px-3 py-2 rounded-lg"
                title="ATS Score"
            >
                {status === 'loading' || status === 'typing' ? (
                    <svg className="animate-spin h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                ) : (
                    <Zap size={14} className="fill-green-400 stroke-green-600" />
                )}
                <span className="font-medium">
                    {result
                        ? <span style={{ color: scoreColor }} className="font-bold">{result.score}</span>
                        : 'ATS'}
                </span>
            </button>

            {/* ── Desktop dropdown via portal ── */}
            {showPanel && createPortal(
                <div
                    ref={dropdownRef}
                    className="hidden md:flex md:flex-col mt-0.5 fixed w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-[9999]"
                    style={{ top: dropdownPos.top, left: dropdownPos.left, maxHeight: '480px' }}
                >
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100 rounded-t-2xl shrink-0">
                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                            <Zap className="size-4 fill-green-400 stroke-green-600" />
                            Live ATS Score
                        </div>
                        <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="size-4" />
                        </button>
                    </div>
                    <PanelContent jd={jd} setJd={setJd} status={status} result={result} open={open} setOpen={setOpen} />
                </div>,
                document.body
            )}

            {/* ── Mobile bottom sheet via portal ── */}
            {showPanel && createPortal(
                <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end">
                    {/* Backdrop — pointer-events-none so touches pass through to the sheet */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none"
                    />
                    {/* Tap-to-close area — sits behind the sheet only */}
                    <div
                        className="absolute inset-0"
                        style={{ zIndex: 0 }}
                        onClick={() => setShowPanel(false)}
                    />
                    {/* Sheet — higher z so it receives all touch events */}
                    <div
                        className="relative bg-white rounded-t-3xl shadow-2xl w-full flex flex-col"
                        style={{ animation: 'ats-slide-up 0.3s cubic-bezier(0.32,0.72,0,1)', zIndex: 1 }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                                <Zap className="size-4 fill-green-400 stroke-green-600" />
                                Live ATS Score
                            </div>
                            <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="size-5" />
                            </button>
                        </div>
                        <PanelContent jd={jd} setJd={setJd} status={status} result={result} open={open} setOpen={setOpen} />
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes ats-slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                    }
                }
            `}</style>
        </>
    )
}

export default ATSBadge