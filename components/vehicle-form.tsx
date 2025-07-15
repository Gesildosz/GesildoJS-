"use client"

import type React from "react"
import { useState, useEffect } from "react" // Importa useEffect
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import type { Vehicle } from "@/app/page" // Importa o tipo Vehicle do app/page.tsx
import { Loader2, UserSearch } from "lucide-react" // Importa o ícone Loader2 e UserSearch
import { Switch } from "@/components/ui/switch" // Importa o componente Switch

// Define o tipo para o status do veículo (para consistência)
type VehicleStatus = "patio" | "descarga" | "finalizado"

// Define as props que o VehicleForm vai receber
interface VehicleFormProps {
  onVehicleSubmit: (vehicle: Vehicle) => void
  vehicles: Vehicle[] // Adicionado para verificar placas existentes
  onNewPlateDetected: (plate: string) => void // Adicionado para notificar nova placa
  onOpenDriverLookup: () => void // Nova prop para abrir o diálogo de consulta
  plate: string // Placa controlada pelo pai
  setPlate: (plate: string) => void // Função para atualizar a placa no pai
}

export function VehicleForm({
  onVehicleSubmit,
  vehicles,
  onNewPlateDetected,
  onOpenDriverLookup, // Nova prop
  plate,
  setPlate,
}: VehicleFormProps) {
  // Removido o estado 'plate' interno, agora é uma prop
  const [status, setStatus] = useState<VehicleStatus>("patio")
  const [dock, setDock] = useState("")
  const [temperature, setTemperature] = useState("")
  const [seal, setSeal] = useState("")
  const [containerNumber, setContainerContainer] = useState("")
  const [vehicleProfile, setVehicleProfile] = useState("")
  const [loadNumber, setLoadNumber] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [arrivalDate, setArrivalDate] = useState("")
  const [hasAnomaly, setHasAnomaly] = useState(false) // NOVO ESTADO para anomalia
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Efeito para preencher o formulário se a placa for de um veículo existente
  useEffect(() => {
    if (plate) {
      const existingVehicle = vehicles.find((v) => v.plate === plate.toUpperCase())
      if (existingVehicle) {
        setStatus(existingVehicle.status)
        setDock(existingVehicle.dock || "")
        setTemperature(existingVehicle.temperature || "")
        setSeal(existingVehicle.seal || "")
        setContainerContainer(existingVehicle.containerNumber || "")
        setVehicleProfile(existingVehicle.vehicleProfile || "")
        setLoadNumber(existingVehicle.loadNumber || "")
        setScheduledDate(existingVehicle.scheduledDate || "")
        setArrivalDate(existingVehicle.arrivalDate || "")
        setHasAnomaly(existingVehicle.hasAnomaly || false) // Carrega o estado da anomalia
      } else {
        // Se a placa não existe, limpa os outros campos para um novo cadastro
        setStatus("patio")
        setDock("")
        setTemperature("")
        setSeal("")
        setContainerContainer("")
        setVehicleProfile("")
        setLoadNumber("")
        setScheduledDate("")
        setArrivalDate("")
        setHasAnomaly(false) // Reseta a anomalia para nova placa
      }
    } else {
      // Limpa tudo se a placa estiver vazia
      setStatus("patio")
      setDock("")
      setTemperature("")
      setSeal("")
      setContainerContainer("")
      setVehicleProfile("")
      setLoadNumber("")
      setScheduledDate("")
      setArrivalDate("")
      setHasAnomaly(false) // Reseta a anomalia
    }
  }, [plate, vehicles])

  const handlePlateBlur = () => {
    const formattedPlate = plate.toUpperCase().trim()
    if (formattedPlate && !vehicles.some((v) => v.plate === formattedPlate)) {
      onNewPlateDetected(formattedPlate)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const isContainerRequired = vehicleProfile === "Contêiner"
    if (
      !plate.trim() ||
      !dock.trim() ||
      !temperature.trim() ||
      !seal.trim() ||
      (isContainerRequired && !containerNumber.trim()) ||
      !vehicleProfile.trim() ||
      !scheduledDate.trim() ||
      !arrivalDate.trim()
    ) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Encontra o veículo existente para manter os dados do motorista, se houver
    const existingVehicle = vehicles.find((v) => v.plate === plate.toUpperCase())

    onVehicleSubmit({
      plate: plate.toUpperCase(),
      status,
      dock,
      temperature,
      seal,
      containerNumber: isContainerRequired ? containerNumber : "",
      vehicleProfile,
      loadNumber,
      scheduledDate,
      arrivalDate,
      driverName: existingVehicle?.driverName, // Mantém o nome do motorista
      driverPhone: existingVehicle?.driverPhone, // Mantém o telefone do motorista
      carrier: existingVehicle?.carrier, // Mantém a transportadora
      hasAnomaly, // Inclui o status de anomalia
    })

    toast({
      title: "Veículo Registrado/Atualizado!",
      description: `Placa: ${plate.toUpperCase()}, Status: ${status}`,
      variant: "default",
    })

    // Limpa o formulário (a placa é limpa pelo pai)
    // setPlate(""); // Removido, pois o pai controla
    setStatus("patio")
    setDock("")
    setTemperature("")
    setSeal("")
    setContainerContainer("")
    setVehicleProfile("")
    setLoadNumber("")
    setScheduledDate("")
    setArrivalDate("")
    setHasAnomaly(false) // Reseta a anomalia
    setIsSubmitting(false)
  }

  const docaOptions = Array.from({ length: 30 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-jbs-blue text-white p-2">
        <CardTitle className="text-center text-lg">Registrar/Atualizar Veículo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <Label htmlFor="plate">Placa do Veículo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="plate"
                type="text"
                placeholder="ABC-1234"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                onBlur={handlePlateBlur} // Adicionado onBlur para verificar a placa
                required
                className="flex-1" // Faz o input ocupar o espaço restante
              />
              <Button
                type="button" // Importante para não submeter o formulário
                variant="outline"
                size="icon"
                onClick={onOpenDriverLookup} // Abre o diálogo de consulta
                className="text-jbs-blue border-jbs-blue hover:bg-jbs-blue/10 bg-transparent"
                aria-label="Consultar Motorista"
              >
                <UserSearch className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as VehicleStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patio">Pátio</SelectItem>
                <SelectItem value="descarga">Descarga</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dock">Doca do Veículo</Label>
            <Select value={dock} onValueChange={setDock} required>
              <SelectTrigger id="dock">
                <SelectValue placeholder="Selecione a doca" />
              </SelectTrigger>
              <SelectContent>
                {docaOptions.map((num) => (
                  <SelectItem key={num} value={num}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="temperature">Temperatura</Label>
            <Select value={temperature} onValueChange={setTemperature} required>
              <SelectTrigger id="temperature">
                <SelectValue placeholder="Selecione a temperatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Congelado">Congelado</SelectItem>
                <SelectItem value="Resfriado">Resfriado</SelectItem>
                <SelectItem value="Seco">Seco</SelectItem>
                <SelectItem value="Mista">Mista</SelectItem>
                <SelectItem value="Festivo">Festivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="seal">Lacre</Label>
            <Input
              id="seal"
              type="text"
              placeholder="Ex: 12345"
              value={seal}
              onChange={(e) => setSeal(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vehicleProfile">Perfil Veículo</Label>
            <Select value={vehicleProfile} onValueChange={setVehicleProfile} required>
              <SelectTrigger id="vehicleProfile">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Carreta">Carreta</SelectItem>
                <SelectItem value="Bi-Trem">Bi-Trem</SelectItem>
                <SelectItem value="Contêiner">Contêiner</SelectItem>
                <SelectItem value="Bi-Truck">Bi-Truck</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {vehicleProfile === "Contêiner" && (
            <div className="grid gap-2">
              <Label htmlFor="containerNumber">N° Conteiner</Label>
              <Input
                id="containerNumber"
                type="text"
                placeholder="Ex: CONT-001"
                value={containerNumber}
                onChange={(e) => setContainerContainer(e.target.value)}
                required={vehicleProfile === "Contêiner"}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="loadNumber">N° Carga (Opcional)</Label>
            <Input
              id="loadNumber"
              type="text"
              placeholder="Ex: CARGA-001"
              value={loadNumber}
              onChange={(e) => setLoadNumber(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scheduledDate">Agendamento do Veículo</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="arrivalDate">Data de Chegada do Veículo</Label>
            <Input
              id="arrivalDate"
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              required
            />
          </div>

          {/* NOVO CAMPO: Anomalia na Carga */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="hasAnomaly">Anomalia na Carga?</Label>
            <Switch
              id="hasAnomaly"
              checked={hasAnomaly}
              onCheckedChange={setHasAnomaly}
              aria-label="Anomalia na Carga"
            />
          </div>

          <Button type="submit" className="w-full bg-jbs-blue hover:bg-jbs-blue/90 text-white" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              "Salvar Veículo"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
