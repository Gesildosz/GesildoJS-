"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import type { Vehicle } from "@/app/page" // Importa o tipo Vehicle

interface StatusChangeDialogProps {
  isOpen: boolean
  onClose: () => void
  vehicles: Vehicle[] // Lista completa de veículos
  onUpdateVehicle: (updatedVehicle: Vehicle) => void
  filterCategory: string // A categoria do cartão que foi clicado (ex: "patio", "Resfriado")
}

type VehicleStatus = "patio" | "descarga" | "finalizado" // Define os status possíveis

export function StatusChangeDialog({
  isOpen,
  onClose,
  vehicles,
  onUpdateVehicle,
  filterCategory,
}: StatusChangeDialogProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("") // Alterado para ID do veículo
  const [newStatus, setNewStatus] = useState<VehicleStatus | "">("")

  // Reseta o estado do formulário quando o diálogo é aberto/fechado
  useEffect(() => {
    if (isOpen) {
      setSelectedVehicleId("")
      setNewStatus("")
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (!selectedVehicleId || !newStatus) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um veículo e um novo status.",
        variant: "destructive",
      })
      return
    }

    const vehicleToUpdate = vehicles.find((v) => v.id === selectedVehicleId) // Busca pelo ID
    if (vehicleToUpdate) {
      onUpdateVehicle({ ...vehicleToUpdate, status: newStatus })
      toast({
        title: "Status Atualizado!",
        description: `Veículo ${vehicleToUpdate.plate} agora está em ${newStatus}.`, // Usa a placa para a mensagem
        variant: "default",
      })
      onClose()
    } else {
      toast({
        title: "Erro",
        description: "Veículo não encontrado.",
        variant: "destructive",
      })
    }
  }

  // Filtra os veículos para exibição no seletor: apenas os ativos (pátio, descarga)
  // e que correspondam à categoria do cartão clicado (se houver)
  const activeVehiclesForSelection = vehicles.filter(
    (v) =>
      (v.status === "patio" || v.status === "descarga") &&
      (filterCategory === "" || // Se não houver filtro de categoria, mostra todos os ativos
        v.status.toLowerCase() === filterCategory.toLowerCase() ||
        v.temperature.toLowerCase() === filterCategory.toLowerCase()),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mudar Status do Veículo</DialogTitle>
          <DialogDescription>Selecione um veículo e defina um novo status.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vehicle-plate" className="text-right">
              Placa
            </Label>
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger id="vehicle-plate" className="col-span-3">
                <SelectValue placeholder="Selecione a placa do veículo" />
              </SelectTrigger>
              <SelectContent>
                {activeVehiclesForSelection.length === 0 ? (
                  <SelectItem value="no-vehicles" disabled>
                    Nenhum veículo ativo nesta categoria
                  </SelectItem>
                ) : (
                  activeVehiclesForSelection.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate} ({v.status})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-status" className="text-right">
              Novo Status
            </Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as VehicleStatus)}>
              <SelectTrigger id="new-status" className="col-span-3">
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patio">Pátio</SelectItem>
                <SelectItem value="descarga">Descarga</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-jbs-blue hover:bg-jbs-blue/90 text-white">
            Confirmar Mudança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
