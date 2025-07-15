"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AnomalyActionDialogProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  onChoice: (action: "new" | "edit") => void
}

export function AnomalyActionDialog({ isOpen, onClose, vehicleId, onChoice }: AnomalyActionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Anomalias Existentes para este Veículo</DialogTitle>
          <DialogDescription>
            A placa associada a este veículo já possui anomalias registradas. O que você gostaria de fazer?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => onChoice("new")} className="bg-jbs-green hover:bg-jbs-green/90 text-white">
            Registrar Nova Anomalia
          </Button>
          <Button
            onClick={() => onChoice("edit")}
            variant="outline"
            className="border-jbs-blue text-jbs-blue hover:bg-jbs-blue/10"
          >
            Ver/Editar Anomalias Existentes
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
