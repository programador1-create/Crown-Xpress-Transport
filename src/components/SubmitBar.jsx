import { useState } from 'react'
import { FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { generateInspectionPDF } from '../utils/pdfGenerator'
import { createInspection, buildPayload } from '../utils/api'

export default function SubmitBar({ onSuccess }) {
  const { t, language } = useLanguage()
  const ctx = useInspection()
  const { canSubmit, validation, completedCount, failedCount } = ctx
  const [generating, setGenerating] = useState(false)

  const issues = []
  if (!validation.allPointsEvaluated) issues.push(t('completeAllPoints'))
  if (!validation.failuresHaveIssue) issues.push(t('selectIssueForFailures'))
  if (!validation.failuresHavePhoto) issues.push(t('addPhotoForFailures'))
  // Seal photo is now optional - removed from validation
  if (!validation.guardSigned) issues.push(t('guardMustSign'))

  const handleSubmit = async () => {
    if (!canSubmit) return
    setGenerating(true)
    try {
      // 1. Generate PDF
      const pdfResult = await generateInspectionPDF({
        unitInfo: ctx.unitInfo,
        points: ctx.points,
        sealPhoto: ctx.sealPhoto,
        guardSignature: ctx.guardSignature,
        auditorSignature: ctx.auditorSignature,
        language,
      })
      const pdfBase64 = pdfResult.doc.output('datauristring')
      const pdfFilename = pdfResult.filename

      // 2. Upload to backend
      const payload = buildPayload(ctx, pdfBase64, pdfFilename)
      const uploadResult = await createInspection(payload)

      // 3. Show PDF in new window for 4 seconds, then download and close
      const pdfBlob = pdfResult.doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const pdfWindow = window.open(pdfUrl, '_blank', 'width=800,height=600')
      
      // Download the PDF
      pdfResult.doc.save(pdfFilename)
      
      // Close preview window after 4 seconds and trigger success
      setTimeout(() => {
        if (pdfWindow && !pdfWindow.closed) {
          pdfWindow.close()
        }
        URL.revokeObjectURL(pdfUrl)
        onSuccess?.({ filename: pdfFilename, ...uploadResult })
      }, 4000)
      
    } catch (e) {
      console.error('Submit error:', e)
      const msg = e.message || String(e)
      alert(language === 'es' ? `Error al guardar: ${msg}` : `Error saving: ${msg}`)
      setGenerating(false)
    }
  }

  return (
    <section className="sticky bottom-0 z-20 no-print">
      <div className="bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent pt-6 pb-3">
        <div className="card overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  canSubmit ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {canSubmit ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    {completedCount}/20 · {failedCount > 0 && (
                      <span className="text-rose-600">{failedCount} {t('bad')}</span>
                    )}
                    {failedCount === 0 && completedCount > 0 && (
                      <span className="text-emerald-600">{language === 'es' ? 'Sin fallas' : 'No failures'}</span>
                    )}
                  </div>
                  {issues.length > 0 ? (
                    <div className="text-xs text-amber-700 mt-0.5">
                      {issues[0]}
                      {issues.length > 1 && ` · +${issues.length - 1}`}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-700 mt-0.5">
                      {language === 'es' ? 'Listo para finalizar' : 'Ready to submit'}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || generating}
                className="btn-gold text-base px-6 py-3 shadow-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'es' ? 'Generando...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    {t('generatePdf')}
                  </>
                )}
              </button>
            </div>

            {issues.length > 0 && (
              <details className="mt-3 group">
                <summary className="text-xs font-semibold text-amber-700 cursor-pointer hover:text-amber-900">
                  {language === 'es' ? `Ver ${issues.length} pendiente(s)` : `View ${issues.length} pending`}
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-amber-700 pl-4">
                  {issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
