import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Upload, Eye, Link2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useImportWizard } from '@/hooks/useImportWizard';
import Step1Upload from './Step1Upload';
import Step2Preview from './Step2Preview';
import Step3Mapping from './Step3Mapping';
import Step4Validation from './Step4Validation';
import Step5Confirmation from './Step5Confirmation';

const STEPS = [
  { number: 1, title: 'Upload', icon: Upload },
  { number: 2, title: 'Preview', icon: Eye },
  { number: 3, title: 'Mapeamento', icon: Link2 },
  { number: 4, title: 'Validação', icon: ShieldCheck },
  { number: 5, title: 'Confirmação', icon: CheckCircle2 },
];

export default function WizardContainer() {
  const { state, update, reset } = useImportWizard();

  const canGoNext = (): boolean => {
    switch (state.currentStep) {
      case 1: return !!state.file && state.rows.length > 0;
      case 2: return state.rows.length > 0;
      case 3: {
        const vals = Object.values(state.mapping);
        return vals.includes('name') && (vals.includes('email') || vals.includes('phone'));
      }
      case 4: return state.validationResults.some(r => r.status === 'success');
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) {
      if (state.currentStep === 3) toast.error('Mapeie ao menos Nome e (Email ou Telefone)');
      return;
    }
    update({ currentStep: state.currentStep + 1 });
  };

  const handlePrev = () => {
    if (state.currentStep > 1) update({ currentStep: state.currentStep - 1 });
  };

  const progress = ((state.currentStep - 1) / 4) * 100;

  return (
    <div className="min-h-full flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-muted w-full">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Sidebar – desktop */}
        <aside className="hidden lg:flex flex-col gap-1 w-56 shrink-0 border-r border-border p-4 bg-muted/20">
          {STEPS.map(step => {
            const Icon = step.icon;
            const isActive = state.currentStep === step.number;
            const isDone = state.currentStep > step.number;
            return (
              <button
                key={step.number}
                onClick={() => isDone && update({ currentStep: step.number })}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                  isActive ? 'bg-primary/10 text-primary font-medium'
                  : isDone ? 'text-success cursor-pointer hover:bg-muted/50'
                  : 'text-muted-foreground'
                }`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isDone ? 'bg-success/20 text-success'
                  : isActive ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <Check className="h-3.5 w-3.5" /> : step.number}
                </div>
                <span>{step.title}</span>
              </button>
            );
          })}
        </aside>

        {/* Mobile step indicator */}
        <div className="flex lg:hidden items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
          {STEPS.map(step => (
            <div key={step.number} className="flex items-center gap-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                state.currentStep > step.number ? 'bg-success/20 text-success'
                : state.currentStep === step.number ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
              }`}>
                {state.currentStep > step.number ? <Check className="h-3.5 w-3.5" /> : step.number}
              </div>
              {step.number < 5 && <div className={`w-4 sm:w-8 h-0.5 ${state.currentStep > step.number ? 'bg-success' : 'bg-muted'}`} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">{STEPS[state.currentStep - 1].title}</span>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {state.currentStep === 1 && <Step1Upload state={state} update={update} />}
            {state.currentStep === 2 && <Step2Preview state={state} />}
            {state.currentStep === 3 && <Step3Mapping state={state} update={update} />}
            {state.currentStep === 4 && <Step4Validation state={state} update={update} />}
            {state.currentStep === 5 && <Step5Confirmation state={state} update={update} reset={reset} />}
          </div>
        </main>
      </div>

      {/* Footer */}
      {state.currentStep < 5 && !state.importResult && (
        <div className="border-t border-border bg-card px-4 py-3">
          <div className="max-w-2xl mx-auto flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={state.currentStep === 1} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button onClick={handleNext} disabled={!canGoNext()} className="gap-1.5">
              Próximo <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
