import { useState } from 'react'
import { FileText, AlertCircle, CheckCircle2, Loader2, X, Truck, PenLine, Home } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { generateInspectionPDF } from '../utils/pdfGenerator'
import { createInspection, buildPayload } from '../utils/api'
import SignatureCanvas from 'react-signature-canvas'
import { useRef } from 'react'

export default function SubmitBar({ onSuccess }) {
  const { t, language } = useLanguage()
  const ctx = useInspection()
  const { canSubmit, validation, completedCount, failedCount, operatorSignature, setOperatorSignature, unitInfo } = ctx
  const [generating, setGenerating] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfFilename, setPdfFilename] = useState('')
  const sigRef = useRef(null)

  const issues = []
  if (!validation.allPointsEvaluated) issues.push(t('completeAllPoints'))
  if (!validation.failuresHaveIssue) issues.push(t('selectIssueForFailures'))
  if (!validation.failuresHavePhoto) issues.push(t('addPhotoForFailures'))
  // Seal photo is now optional - removed from validation
  // Operator signature is captured when clicking "Generate PDF"
  if (!validation.guardSigned) issues.push(t('guardMustSign'))

  // Step 1: Click "Generate PDF" -> Show signature modal
  const handleGenerateClick = () => {
    if (!canSubmit) return
    setShowSignatureModal(true)
  }

  // Step 2: Operator signs -> Generate PDF (signature is optional)
  const handleSignAndGenerate = async () => {
    // Operator signature is optional - can be empty
    let signatureData = null
    if (sigRef.current && !sigRef.current.isEmpty()) {
      signatureData = sigRef.current.toDataURL('image/png')
      setOperatorSignature({
        name: unitInfo.driverName?.toUpperCase() || '',
        signature: signatureData,
        signedAt: new Date().toISOString()
      })
    }

    setShowSignatureModal(false)
    setGenerating(true)

    // Small delay to ensure state is updated
    setTimeout(async () => {
      try {
        // 1. Generate PDF with the new signature
        const pdfResult = await generateInspectionPDF({
          unitInfo: ctx.unitInfo,
          points: ctx.points,
          sealPhoto: ctx.sealPhoto,
          guardSignature: ctx.guardSignature,
          auditorSignature: ctx.auditorSignature,
          operatorSignature: signatureData ? {
            name: unitInfo.driverName?.toUpperCase() || '',
            signature: signatureData,
            signedAt: new Date().toISOString()
          } : null,
          language,
        })
        const pdfBase64 = pdfResult.doc.output('datauristring')
        const pdfFilename = pdfResult.filename

        // 2. Upload to backend (with compressed images)
        const payload = await buildPayload(ctx, pdfBase64, pdfFilename)
        const uploadResult = await createInspection(payload)

        // 3. Show PDF in modal viewer
        const pdfBlob = pdfResult.doc.output('blob')
        const pdfBlobUrl = URL.createObjectURL(pdfBlob)
        setPdfUrl(pdfBlobUrl)
        setPdfFilename(pdfFilename)
        setShowPdfViewer(true)
        
        // Reset generating state
        setGenerating(false)
        
      } catch (e) {
        console.error('Submit error:', e)
        const msg = e.message || String(e)
        alert(language === 'es' ? `Error al guardar: ${msg}` : `Error saving: ${msg}`)
        setGenerating(false)
      }
    }, 100)
  }
  
  const clearSignature = () => {
    if (sigRef.current) {
      sigRef.current.clear()
    }
  }

  const handleClosePdfViewer = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
    setShowPdfViewer(false)
    setPdfUrl(null)
    ctx.resetInspection()
    onSuccess?.({ filename: pdfFilename })
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
                onClick={handleGenerateClick}
                disabled={!canSubmit || generating}
                className="btn-gold text-base px-6 py-3 shadow-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'es' ? 'GENERANDO...' : 'GENERATING...'}
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    {t('generatePdf').toUpperCase()}
                  </>
                )}
              </button>
            </div>

            {issues.length > 0 && (
              <details className="mt-3 group">
                <summary className="text-xs font-semibold text-amber-700 cursor-pointer hover:text-amber-900">
                  {language === 'es' ? `VER ${issues.length} PENDIENTE(S)` : `VIEW ${issues.length} PENDING`}
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

      {/* Operator Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-lg">
                      {language === 'es' ? 'FIRMA DEL OPERADOR' : 'OPERATOR SIGNATURE'}
                    </h3>
                    <p className="text-emerald-100 text-sm">
                      {unitInfo.driverName?.toUpperCase() || (language === 'es' ? 'OPERADOR' : 'OPERATOR')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSignatureModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Signature Area */}
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-1 text-center">
                {language === 'es' 
                  ? 'Firma del operador (opcional)' 
                  : 'Operator signature (optional)'}
              </p>
              <p className="text-xs text-slate-400 mb-3 text-center italic">
                {language === 'es' 
                  ? 'Puede dejar en blanco y continuar' 
                  : 'You can leave blank and continue'}
              </p>
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{
                    className: 'w-full h-40 bg-white',
                    style: { width: '100%', height: '160px' }
                  }}
                  penColor="black"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={clearSignature}
                  className="flex-1 py-3 px-4 border-2 border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  <PenLine className="w-4 h-4" />
                  {language === 'es' ? 'LIMPIAR' : 'CLEAR'}
                </button>
                <button
                  onClick={handleSignAndGenerate}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {language === 'es' ? 'GENERAR PDF' : 'GENERATE PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal - with scrollable container for tablet */}
      {showPdfViewer && pdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Header - fixed at top */}
          <div className="bg-gradient-to-r from-crown-navy to-crown-navy-dark px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {language === 'es' ? '✅ INSPECCIÓN GUARDADA' : '✅ INSPECTION SAVED'}
                </h3>
                <p className="text-crown-gold text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">{pdfFilename}</p>
              </div>
            </div>
            <button
              onClick={handleClosePdfViewer}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">{language === 'es' ? 'Regresar a Inicio' : 'Return to Home'}</span>
              <span className="sm:hidden">{language === 'es' ? 'Inicio' : 'Home'}</span>
            </button>
          </div>

          {/* PDF Container - scrollable on tablet */}
          <div 
            className="flex-1 overflow-auto"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            <iframe
              src={pdfUrl}
              className="w-full border-0"
              style={{ 
                height: '200vh',
                minHeight: '100%'
              }}
              title="PDF Viewer"
            />
          </div>
        </div>
      )}

      </section>
  )
}
