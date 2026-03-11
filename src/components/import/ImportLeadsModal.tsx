import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useImportModal } from '@/hooks/useImportModal';
import Step1Intent from './steps/Step1Intent';
import Step2Explanation from './steps/Step2Explanation';
import Step3Download from './steps/Step3Download';
import Step4Upload from './steps/Step4Upload';
import Step5Import from './steps/Step5Import';
import Step6Results from './steps/Step6Results';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_LABELS = ['Intenção', 'Explicação', 'Download', 'Upload', 'Importação', 'Resultado'];

export default function ImportLeadsModal({ open, onOpenChange }: Props) {
  const isMobile = useIsMobile();
  const { state, update, reset, setStep } = useImportModal();

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const content = (
    <div className="flex flex-col max-h-[80vh]">
      {/* Step indicator */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display text-foreground">📥 Importar Leads</h2>
          <span className="text-xs text-muted-foreground">{state.currentStep}/6 — {STEP_LABELS[state.currentStep - 1]}</span>
        </div>
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {state.currentStep === 1 && <Step1Intent onNext={() => setStep(2)} onClose={handleClose} />}
        {state.currentStep === 2 && <Step2Explanation onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {state.currentStep === 3 && <Step3Download onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {state.currentStep === 4 && <Step4Upload state={state} update={update} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
        {state.currentStep === 5 && <Step5Import state={state} update={update} onNext={() => setStep(6)} onBack={() => setStep(4)} />}
        {state.currentStep === 6 && <Step6Results state={state} onImportMore={reset} onClose={handleClose} />}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] p-0 gap-0 overflow-hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
}
