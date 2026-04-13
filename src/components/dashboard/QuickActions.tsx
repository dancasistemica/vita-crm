import { Card } from "@/components/ui/ds";
import { PlusCircle, FileText, Send, UserPlus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "Nova Venda", icon: PlusCircle, path: "/vendas", color: "text-primary" },
    { label: "Cadastrar Lead", icon: UserPlus, path: "/leads", color: "text-info" },
    { label: "Enviar Relatório", icon: Send, path: "/relatorios", color: "text-success" },
    { label: "Configurações", icon: Settings, path: "/configuracoes", color: "text-neutral-500" },
  ];

  return (
    <Card className="shadow-card border-border/60 p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Ações Rápidas</h3>
          <p className="text-xs text-neutral-500">Tarefas frequentes do executivo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center justify-center p-4 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/40 transition-colors gap-3"
          >
            <action.icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
