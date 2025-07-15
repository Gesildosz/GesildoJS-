"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PencilIcon, SaveIcon, XIcon, Trash2 } from "lucide-react" // Importa Trash2
import type { Vehicle } from "@/app/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog" // Importa componentes de Dialog
import { Label } from "@/components/ui/label" // Importa Label
import { toast } from "@/hooks/use-toast" // Importa toast

interface VehicleListProps {
  vehicles: Vehicle[]
  onUpdateVehicle: (vehicle: Vehicle) => void
  onDeleteVehicle: (id: string) => void
  onRowDoubleClick: (vehicleId: string) => void // NOVA PROP
}

type VehicleStatus = "patio" | "descarga" | "finalizado"

export function VehicleList({ vehicles, onUpdateVehicle, onDeleteVehicle, onRowDoubleClick }: VehicleListProps) {
  const [editingPlate, setEditingPlate] = useState<string | null>(null) // Ainda usa plate para o input de edição
  const [editedLoadNumber, setEditedLoadNumber] = useState<string>("")
  const [editingStatusPlate, setEditingStatusPlate] = useState<string | null>(null) // Ainda usa plate para o status

  // Estados para o diálogo de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [deletePassword, setDeletePassword] = useState("")

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingPlate(vehicle.plate) // Usa a placa para identificar qual linha está sendo editada
    setEditedLoadNumber(vehicle.loadNumber)
  }

  const handleSaveClick = (vehicle: Vehicle) => {
    // Encontra o veículo original pelo ID para garantir que o ID correto seja passado
    const originalVehicle = vehicles.find((v) => v.id === vehicle.id)
    if (originalVehicle) {
      onUpdateVehicle({ ...originalVehicle, loadNumber: editedLoadNumber })
    }
    setEditingPlate(null)
    setEditedLoadNumber("")
  }

  const handleCancelClick = () => {
    setEditingPlate(null)
    setEditedLoadNumber("")
  }

  const handlePlateClick = (plate: string) => {
    setEditingStatusPlate(editingStatusPlate === plate ? null : plate)
  }

  const handleStatusChange = (vehicle: Vehicle, newStatus: VehicleStatus) => {
    // Encontra o veículo original pelo ID para garantir que o ID correto seja passado
    const originalVehicle = vehicles.find((v) => v.id === vehicle.id)
    if (originalVehicle) {
      onUpdateVehicle({ ...originalVehicle, status: newStatus })
    }
    setEditingStatusPlate(null)
  }

  // Funções para o diálogo de exclusão
  const handleDeleteClick = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id) // Encontra o veículo pelo ID
    if (vehicle) {
      setVehicleToDelete(vehicle)
      setIsDeleteDialogOpen(true)
      setDeletePassword("") // Limpa a senha anterior
    }
  }

  const handleConfirmDelete = () => {
    if (vehicleToDelete && deletePassword.toUpperCase() === vehicleToDelete.plate.toUpperCase()) {
      onDeleteVehicle(vehicleToDelete.id) // Passa o ID para a função de exclusão
      toast({
        title: "Veículo Removido!",
        description: `A placa ${vehicleToDelete.plate} foi removida com sucesso.`,
        variant: "default",
      })
      setIsDeleteDialogOpen(false)
      setVehicleToDelete(null)
    } else {
      toast({
        title: "Erro de Exclusão",
        description: "A placa digitada não corresponde. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setVehicleToDelete(null)
    setDeletePassword("")
  }

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-jbs-blue text-white">
                <TableRow>
                  <TableHead className="w-[100px] text-white">Placa</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Doca</TableHead>
                  <TableHead className="text-white">Temp.</TableHead>
                  <TableHead className="text-white">Lacre</TableHead>
                  <TableHead className="text-white">N° Cont.</TableHead>
                  <TableHead className="text-white">Perfil</TableHead>
                  <TableHead className="text-white">N° Carga</TableHead>
                  <TableHead className="text-white">Agendamento</TableHead>
                  <TableHead className="text-white">Chegada</TableHead>
                  <TableHead className="text-right text-white">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      Nenhum veículo registrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow
                      key={vehicle.id}
                      className="hover:bg-jbs-blue/5 transition-colors"
                      onDoubleClick={() => onRowDoubleClick(vehicle.id)} // ADICIONADO: Duplo clique na linha
                    >
                      <TableCell className="font-medium">
                        <Button
                          variant="link"
                          onClick={() => handlePlateClick(vehicle.plate)}
                          className="p-0 h-auto text-jbs-blue hover:text-jbs-green"
                        >
                          {vehicle.plate}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {editingStatusPlate === vehicle.plate ? (
                          <Select
                            value={vehicle.status}
                            onValueChange={(value) => handleStatusChange(vehicle, value as VehicleStatus)}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue placeholder="Mudar Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="patio">Pátio</SelectItem>
                              <SelectItem value="descarga">Descarga</SelectItem>
                              <SelectItem value="finalizado">Finalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : vehicle.status === "descarga" ? (
                          "Descarga"
                        ) : vehicle.status === "patio" ? (
                          "Pátio"
                        ) : (
                          "Finalizado"
                        )}
                      </TableCell>
                      <TableCell>{vehicle.dock}</TableCell>
                      <TableCell>{vehicle.temperature}</TableCell>
                      <TableCell>{vehicle.seal}</TableCell>
                      <TableCell>{vehicle.containerNumber}</TableCell>
                      <TableCell>{vehicle.vehicleProfile}</TableCell>
                      <TableCell>
                        {editingPlate === vehicle.plate ? (
                          <Input
                            type="text"
                            value={editedLoadNumber}
                            onChange={(e) => setEditedLoadNumber(e.target.value)}
                            className="w-32"
                          />
                        ) : (
                          vehicle.loadNumber || "-"
                        )}
                      </TableCell>
                      <TableCell>{vehicle.scheduledDate}</TableCell>
                      <TableCell>{vehicle.arrivalDate}</TableCell>
                      <TableCell className="text-right">
                        {editingPlate === vehicle.plate ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => handleSaveClick(vehicle)}>
                              <SaveIcon className="h-4 w-4 text-jbs-green" />
                              <span className="sr-only">Salvar</span>
                            </Button>
                            <Button size="icon" variant="ghost" onClick={handleCancelClick}>
                              <XIcon className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Cancelar</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => handleEditClick(vehicle)}>
                              <PencilIcon className="h-4 w-4 text-jbs-blue" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(vehicle.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o veículo com a placa{" "}
              <span className="font-bold text-jbs-blue">{vehicleToDelete?.plate}</span>?
              <br />
              Para confirmar, digite a placa do veículo abaixo:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delete-plate" className="text-right">
                Placa
              </Label>
              <Input
                id="delete-plate"
                type="text"
                placeholder="Digite a placa"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={!deletePassword.trim()}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default VehicleList
