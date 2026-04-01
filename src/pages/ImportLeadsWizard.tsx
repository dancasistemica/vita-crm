import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportModal } from '@/hooks/useImportModal';
import { ArrowLeft } from 'lucide-react';
import Step1Intent from '@/components/import/steps/Step1Intent';
import Step2Explanation from '@/components/import/steps/Step2Explanation';
import Step3Download from '@/components/import/steps/Step3Download';
import Step4Upload from '@/components/import/steps/Step4Upload';
import Step5Import from '@/components/import/steps/Step5Import';
import Step6Results from '@/components/import/steps/Step6Results';
import { Button } from "@/components/ui/ds";

const STEP_LABELS = ['Intenção', 'Explicação', 'Download', 'Upload', 'Importação', 'Resultado'];

export default function ImportLeadsWizard() {
  const navigate = useNavigate();
  const { state, update, reset, setStep } = useImportModal();

  // Always start fresh
  useEffect(() => {
    reset();
  }, [reset]);

  const handleClose = () => {
    reset();
    navigate('/leads');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-neutral-900">📥 Importar Leads</h1>
        </div>
        <span className="text-sm text-neutral-500">
          {state.currentStep}/6 — {STEP_LABELS[state.currentStep - 1]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${
              i + 1 < state.currentStep ? 'bg-success'
              : i + 1 === state.currentStep ? 'bg-primary'
              : 'bg-muted'
            }`} />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto">
        {state.currentStep === 1 && <Step1Intent onNext={() => setStep(2)} onClose={handleClose} />}
        {state.currentStep === 2 && <Step2Explanation onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {state.currentStep === 3 && <Step3Download onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {state.currentStep === 4 && <Step4Upload state={state} update={update} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
        {state.currentStep === 5 && <Step5Import state={state} update={update} onNext={() => setStep(6)} onBack={() => setStep(4)} />}
        {state.currentStep === 6 && <Step6Results state={state} onImportMore={reset} onClose={handleClose} />}
      </div>
    </div>
  );
}
