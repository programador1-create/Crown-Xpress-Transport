import { useState, useEffect } from 'react'
import { Check, X, Camera, Eye, AlertTriangle, ChevronDown, ChevronUp, Edit2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { errorReports } from '../data/inspectionPoints'
import CameraModal from './CameraModal'
import PhotoViewerModal from './PhotoViewerModal'
import IssueSelectModal from './IssueSelectModal'

export default function InspectionPoint({ point }) {
  const { t, language } = useLanguage()
  const { points, setPointStatus, setPointIssue, setPointPhoto } = useInspection()
  const state = points[point.id]

  const [cameraOpen, setCameraOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const isBad = state.status === 'bad'
  const isGood = state.status === 'good'
  const issue = errorReports.find(e => e.id === state.issueId)
  const isComplete = isGood || (isBad && state.issueId && state.photo)

  // Auto-collapse when point becomes complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setCollapsed(true), 600)
      return () => clearTimeout(timer)
    } else {
      setCollapsed(false)
    }
  }, [isComplete])

  const statusBorder = isBad
    ? 'border-rose-300 bg-rose-50/40'
    : isGood
    ? 'border-emerald-300 bg-emerald-50/40'
    : 'border-slate-200 bg-white'

  // Collapsed view - compact summary
  if (collapsed && isComplete) {
    return (
      <>
        <button
          onClick={() => setCollapsed(false)}
          className={`w-full rounded-xl border-2 transition-all hover:shadow-md ${statusBorder} group`}
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              isBad ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {point.id}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-slate-700 text-sm truncate">
                {point[language]}
              </div>
              {isBad && issue && (
                <div className="text-xs text-rose-600 truncate flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {issue[language]}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isGood ? (
                <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> OK
                </div>
              ) : (
                <div className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <X className="w-3 h-3" /> {t('bad')}
                </div>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            </div>
          </div>
        </button>
      </>
    )
  }

  return (
    <>
      <div className={`rounded-xl border-2 transition-all ${statusBorder}`}>
        {/* Collapse toggle when complete */}
        {isComplete && (
          <button
            onClick={() => setCollapsed(true)}
            className="absolute top-2 right-2 z-10 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title={language === 'es' ? 'Colapsar' : 'Collapse'}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-stretch relative">
          {/* Number badge */}
          <div className={`flex flex-col items-center justify-center w-12 sm:w-14 flex-shrink-0 rounded-l-[10px] font-display font-bold text-lg ${
            isBad ? 'bg-rose-600 text-white' :
            isGood ? 'bg-emerald-600 text-white' :
            'bg-gradient-to-br from-crown-navy-dark to-crown-navy text-crown-gold'
          }`}>
            {point.id}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Description (bilingual stacked) */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 text-sm leading-snug">
                {point[language]}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                {point[language === 'es' ? 'en' : 'es']}
              </div>

              {/* Issue selection (when bad) */}
              {isBad && (
                <button
                  onClick={() => setIssueOpen(true)}
                  className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    issue
                      ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse-soft'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span className="truncate max-w-[260px]">
                    {issue ? issue[language] : t('issueRequired')}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Photo button (only for bad) */}
              {isBad && (
                <button
                  onClick={() => state.photo ? setViewerOpen(true) : setCameraOpen(true)}
                  className={`p-2 rounded-lg border-2 transition-colors ${
                    state.photo
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 animate-pulse-soft'
                  }`}
                  title={state.photo ? t('viewPhoto') : t('addPhoto')}
                >
                  {state.photo ? <Eye className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </button>
              )}

              {/* Good / Bad toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setPointStatus(point.id, 'good')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    isGood
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-500 hover:text-emerald-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> {t('good')}
                </button>
                <button
                  onClick={() => setPointStatus(point.id, 'bad')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    isBad
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-500 hover:text-rose-700'
                  }`}
                >
                  <X className="w-3.5 h-3.5" /> {t('bad')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onConfirm={(photo) => setPointPhoto(point.id, photo)}
        title={`${point.id}. ${point[language]}`}
      />
      <PhotoViewerModal
        open={viewerOpen}
        photo={state.photo}
        onClose={() => setViewerOpen(false)}
        onRetake={() => { setViewerOpen(false); setCameraOpen(true) }}
        title={`${point.id}. ${point[language]}`}
      />
      <IssueSelectModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        onSelect={(id) => setPointIssue(point.id, id)}
        currentIssueId={state.issueId}
      />
    </>
  )
}
