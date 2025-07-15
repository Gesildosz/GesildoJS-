"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { Vehicle } from "@/app/page" // Importa o tipo Vehicle
import { MessageSquareText, PhoneCall, Download, PencilIcon, SaveIcon, XIcon, Loader2 } from "lucide-react" // Importa os ícones
import { downloadFile } from "@/utils/download-file" // Importa a função downloadFile do novo local
import { Card, CardContent } from "@/components/ui/card" // Importa Card e CardContent
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Importa os componentes de Tooltip

interface DriverLookupDialogProps {
  isOpen: boolean
  onClose: () => void
  vehicles: Vehicle[] // Lista completa de veículos para consulta
  onUpdateDriverDetails: (plate: string, driverName: string, driverPhone: string, carrier: string) => void // Nova prop
}

export function DriverLookupDialog({ isOpen, onClose, vehicles, onUpdateDriverDetails }: DriverLookupDialogProps) {
  const [searchPlate, setSearchPlate] = useState("")
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false) // Novo estado para modo de edição
  const [editedDriverName, setEditedDriverName] = useState("")
  const [editedDriverPhone, setEditedDriverPhone] = useState("")
  const [editedCarrier, setEditedCarrier] = useState("")
  const [isUpdating, setIsUpdating] = useState(false) // Novo estado para o botão de atualização

  useEffect(() => {
    if (isOpen) {
      // Reseta os campos e resultados quando o diálogo é aberto
      setSearchPlate("")
      setFoundVehicle(null)
      setIsSearching(false)
      setNotFoundMessage(null)
      setIsEditing(false) // Reseta o modo de edição
      setEditedDriverName("")
      setEditedDriverPhone("")
      setEditedCarrier("")
      setIsUpdating(false)
    }
  }, [isOpen])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setFoundVehicle(null) // Limpa resultados anteriores
    setNotFoundMessage(null) // Limpa mensagem de não encontrado anterior
    setIsEditing(false) // Sai do modo de edição ao buscar

    if (!searchPlate.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma placa para buscar.",
        variant: "destructive",
      })
      setIsSearching(false)
      return
    }

    // Simula uma busca assíncrona
    await new Promise((resolve) => setTimeout(resolve, 500))

    const plateToSearch = searchPlate.toUpperCase().trim()
    const found = vehicles.find((v) => v.plate === plateToSearch)

    if (found) {
      setFoundVehicle(found)
      setEditedDriverName(found.driverName || "")
      setEditedDriverPhone(found.driverPhone || "")
      setEditedCarrier(found.carrier || "")
      toast({
        title: "Motorista Encontrado!",
        description: `Detalhes para a placa ${plateToSearch} carregados.`,
        variant: "default",
      })
    } else {
      setNotFoundMessage(`Nenhum motorista encontrado para a placa "${plateToSearch}".`)
      toast({
        title: "Não Encontrado",
        description: `Nenhum motorista encontrado para a placa ${plateToSearch}.`,
        variant: "destructive",
      })
    }
    setIsSearching(false)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (foundVehicle) {
      setEditedDriverName(foundVehicle.driverName || "")
      setEditedDriverPhone(foundVehicle.driverPhone || "")
      setEditedCarrier(foundVehicle.carrier || "")
    }
    setIsEditing(false)
  }

  const handleUpdate = async () => {
    if (!foundVehicle) return

    setIsUpdating(true)

    if (!editedDriverName.trim() || !editedDriverPhone.trim() || !editedCarrier.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos do motorista e transportadora para atualizar.",
        variant: "destructive",
      })
      setIsUpdating(false)
      return
    }

    // Simula uma chamada de API para atualização
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onUpdateDriverDetails(foundVehicle.plate, editedDriverName, editedDriverPhone, editedCarrier)
    setIsEditing(false) // Sai do modo de edição
    setIsUpdating(false)
    toast({
      title: "Cadastro Atualizado!",
      description: `Dados do motorista para a placa ${foundVehicle.plate} foram atualizados.`,
      variant: "default",
    })
    // Atualiza o foundVehicle para refletir as mudanças imediatamente no diálogo
    setFoundVehicle((prev) =>
      prev
        ? {
            ...prev,
            driverName: editedDriverName,
            driverPhone: editedDriverPhone,
            carrier: editedCarrier,
          }
        : null,
    )
  }

  // Função para limpar o número de telefone (remover caracteres não numéricos)
  const cleanPhoneNumber = (phone: string | undefined) => {
    return phone ? phone.replace(/\D/g, "") : ""
  }

  const handleDownloadList = () => {
    const uniqueDrivers: Vehicle[] = []
    const seenPlates = new Set<string>()

    vehicles.forEach((v) => {
      // Considera um motorista "cadastrado" se tiver nome, telefone e transportadora
      if (v.driverName && v.driverPhone && v.carrier && !seenPlates.has(v.plate)) {
        uniqueDrivers.push(v)
        seenPlates.add(v.plate)
      }
    })

    if (uniqueDrivers.length === 0) {
      toast({
        title: "Nenhum Motorista Cadastrado",
        description: "Não há dados de motoristas completos para baixar.",
        variant: "info",
      })
      return
    }

    const headers = ["Placa", "Nome Motorista", "Telefone", "Transportadora"]
    let csvContent = headers.join(";") + "\n"

    uniqueDrivers.forEach((driver) => {
      const row = [driver.plate, driver.driverName || "", driver.driverPhone || "", driver.carrier || ""]
      // Envolve cada campo com aspas e escapa aspas internas para CSV correto
      csvContent += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(";") + "\n"
    })

    downloadFile(csvContent, "lista_motoristas.csv", "text/csv;charset=utf-8;")
    toast({
      title: "Lista Baixada!",
      description: "A lista de motoristas foi baixada com sucesso.",
      variant: "default",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <TooltipProvider>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Consultar Cadastro de Motorista</DialogTitle>
            <DialogDescription>Digite a placa do veículo para buscar os dados do motorista.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSearch} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="searchPlate" className="text-right">
                Placa
              </Label>
              <Input
                id="searchPlate"
                type="text"
                placeholder="ABC-1234"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                required
                className="col-span-3"
                autoFocus // Foco automático
              />
            </div>
            <Button type="submit" className="w-full bg-jbs-blue hover:bg-jbs-blue/90 text-white" disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
                </>
              ) : (
                "Buscar Motorista"
              )}
            </Button>
          </form>

          {foundVehicle && (
            <Card className="mt-4 p-4 border-jbs-blue shadow-md">
              {" "}
              {/* Usando Card para visualização */}
              <CardContent className="p-0">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-jbs-blue">Detalhes do Motorista:</h4>
                  {!isEditing && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleEditClick} aria-label="Editar Cadastro">
                          <PencilIcon className="h-5 w-5 text-jbs-blue" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar Cadastro</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="mb-2">
                  <span className="font-medium">Placa:</span> {foundVehicle.plate}
                </p>
                <div className="grid grid-cols-4 items-center gap-4 mb-2">
                  <Label htmlFor="driverName" className="text-right">
                    Nome:
                  </Label>
                  {isEditing ? (
                    <Input
                      id="driverName"
                      value={editedDriverName}
                      onChange={(e) => setEditedDriverName(e.target.value)}
                      className="col-span-3"
                    />
                  ) : (
                    <p className="col-span-3">
                      {foundVehicle.driverName || <span className="text-muted-foreground italic">Não informado</span>}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4 mb-2">
                  <Label htmlFor="driverPhone" className="text-right">
                    Telefone:
                  </Label>
                  {isEditing ? (
                    <Input
                      id="driverPhone"
                      value={editedDriverPhone}
                      onChange={(e) => setEditedDriverPhone(e.target.value)}
                      className="col-span-3"
                      type="tel"
                    />
                  ) : (
                    <div className="col-span-3 flex items-center gap-2">
                      <p>
                        {foundVehicle.driverPhone || (
                          <span className="text-muted-foreground italic">Não informado</span>
                        )}
                      </p>
                      {foundVehicle.driverPhone && (
                        <>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  window.open(`https://wa.me/55${cleanPhoneNumber(foundVehicle.driverPhone)}`, "_blank")
                                }
                                className="text-green-500 hover:bg-green-500/10"
                                aria-label="Enviar WhatsApp"
                              >
                                <MessageSquareText className="h-5 w-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Enviar WhatsApp</TooltipContent>
                          </Tooltip>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  window.open(`tel:${cleanPhoneNumber(foundVehicle.driverPhone)}`, "_self")
                                }
                                className="text-blue-500 hover:bg-blue-500/10"
                                aria-label="Ligar para o motorista"
                              >
                                <PhoneCall className="h-5 w-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ligar para o motorista</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="carrier" className="text-right">
                    Transportadora:
                  </Label>
                  {isEditing ? (
                    <Input
                      id="carrier"
                      value={editedCarrier}
                      onChange={(e) => setEditedCarrier(e.target.value)}
                      className="col-span-3"
                    />
                  ) : (
                    <p className="col-span-3">
                      {foundVehicle.carrier || <span className="text-muted-foreground italic">Não informado</span>}
                    </p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={handleCancelEdit} type="button">
                      <XIcon className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="bg-jbs-green hover:bg-jbs-green/90 text-white"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="mr-2 h-4 w-4" /> Salvar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {notFoundMessage && (
            <div className="mt-4 p-4 border border-red-400 bg-red-50 text-red-800 rounded-md text-center font-medium">
              <p>{notFoundMessage}</p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadList}
              className="w-full sm:w-auto bg-jbs-green text-white hover:bg-jbs-green/90"
            >
              <Download className="mr-2 h-4 w-4" /> Baixar Lista Completa
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </TooltipProvider>
    </Dialog>
  )
}
