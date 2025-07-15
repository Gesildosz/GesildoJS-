"use client"

import type React from "react"
import { parseISO } from "date-fns" // Import parseISO for date parsing

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog" // Import Dialog components
import {
  Home,
  SaveIcon,
  Loader2,
  MessageSquareText,
  Mail,
  FileText,
  FileSpreadsheet,
  FileIcon as FilePdf,
} from "lucide-react" // Import report icons
import { toast } from "@/hooks/use-toast"
import type { Vehicle } from "@/app/page" // Import Vehicle type for context
import {
  generateSingleAnomalyWhatsappReport,
  generateSingleAnomalyEmailReport,
  generateSingleAnomalyTxtReport,
  generateSingleAnomalyExcelReport,
  generateSingleAnomalyPdfReport,
} from "@/lib/report-generators" // Import single anomaly report generators
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // Import Table components

// Define Anomaly type
export type Anomaly = {
  id: string // Unique ID for the anomaly record
  vehicleId: string // Link to the specific vehicle launch
  plate: string // Redundant but useful for quick lookup
  loadNumber: string // Redundant but useful for quick lookup
  productCode: string
  productDescription: string // NOVO CAMPO
  invoiceNumber: string // NOVO CAMPO
  cif: string
  originName: string // RENOMEADO de originalLoad
  quantity: number
  weight: number
  anomalyType: "Falta" | "Sobra" | "Avaria" | "Shelf" | "Inversão" | "Vencido" // NOVOS TIPOS
  reasonDescription: string
  registrationDate: string // When the anomaly was registered
}

export default function AnomalyRegistrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("vehicleId")

  const [currentDateTime, setCurrentDateTime] = useState("")
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [existingAnomalies, setExistingAnomalies] = useState<Anomaly[]>([]) // NOVO ESTADO: Anomalias existentes para este veículo
  const [productCode, setProductCode] = useState("")
  const [productDescription, setProductDescription] = useState("") // NOVO ESTADO
  const [invoiceNumber, setInvoiceNumber] = useState("") // NOVO ESTADO
  const [cif, setCif] = useState("")
  const [originName, setOriginName] = useState("") // RENOMEADO
  const [quantity, setQuantity] = useState<number | "">("")
  const [weight, setWeight] = useState<number | "">("")
  const [anomalyType, setAnomalyType] = useState<Anomaly["anomalyType"] | "">("")
  const [reasonDescription, setReasonDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmingPassword, setIsConfirmingPassword] = useState(false) // Estado para o diálogo de senha
  const [passwordInput, setPasswordInput] = useState("") // Estado para o input de senha

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy HH:mm:ss", { locale: ptBR }))
    }
    updateDateTime()
    const intervalId = setInterval(updateDateTime, 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (vehicleId) {
      const storedVehicles = localStorage.getItem("vehicles")
      const storedAnomalies = localStorage.getItem("anomalies") // Carrega anomalias

      if (storedVehicles) {
        const vehicles: Vehicle[] = JSON.parse(storedVehicles)
        const foundVehicle = vehicles.find((v) => v.id === vehicleId)
        if (foundVehicle) {
          setVehicle(foundVehicle)
          // Pre-fill origin name if available from vehicle's load number
          setOriginName(foundVehicle.loadNumber || "")
        } else {
          toast({
            title: "Erro",
            description: "Veículo não encontrado para registro de anomalia.",
            variant: "destructive",
          })
          router.push("/") // Redirect if vehicle not found
        }
      } else {
        toast({
          title: "Erro",
          description: "Nenhum veículo encontrado no armazenamento local.",
          variant: "destructive",
        })
        router.push("/") // Redirect if no vehicles
      }

      // Filtra e define as anomalias existentes para este veículo
      if (storedAnomalies) {
        const anomalies: Anomaly[] = JSON.parse(storedAnomalies)
        const filtered = anomalies.filter((a) => a.vehicleId === vehicleId)
        setExistingAnomalies(filtered)
      }
    } else {
      toast({
        title: "Erro",
        description: "ID do veículo não fornecido para registro de anomalia.",
        variant: "destructive",
      })
      router.push("/") // Redirect if no vehicleId
    }
  }, [vehicleId, router])

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate required fields before opening password dialog
    if (
      !vehicle ||
      !productCode ||
      !productDescription || // NOVO CAMPO
      !invoiceNumber || // NOVO CAMPO
      !cif ||
      !originName ||
      quantity === "" ||
      weight === "" ||
      !anomalyType ||
      !reasonDescription
    ) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }
    setIsConfirmingPassword(true) // Open password confirmation dialog
  }

  const handleConfirmPassword = async () => {
    if (!vehicle || passwordInput.toUpperCase() !== vehicle.plate.toUpperCase()) {
      toast({
        title: "Erro de Confirmação",
        description: "A placa digitada não corresponde. Tente novamente.",
        variant: "destructive",
      })
      return
    }

    setIsConfirmingPassword(false)
    setIsSubmitting(true)

    const newAnomaly: Anomaly = {
      id: Date.now().toString(), // Unique ID for this anomaly record
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      loadNumber: vehicle.loadNumber || originName, // Use loadNumber from vehicle or the form field
      productCode,
      productDescription, // NOVO CAMPO
      invoiceNumber, // NOVO CAMPO
      cif,
      originName, // RENOMEADO
      quantity: Number(quantity),
      weight: Number(weight),
      anomalyType: anomalyType as Anomaly["anomalyType"],
      reasonDescription,
      registrationDate: new Date().toISOString(),
    }

    // Save anomaly to local storage
    const storedAnomalies = localStorage.getItem("anomalies")
    const anomalies: Anomaly[] = storedAnomalies ? JSON.parse(storedAnomalies) : []
    anomalies.push(newAnomaly)
    localStorage.setItem("anomalies", JSON.stringify(anomalies))

    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

    toast({
      title: "Anomalia Registrada!",
      description: `Anomalia para a placa ${vehicle.plate} registrada com sucesso.`,
      variant: "default",
    })

    setIsSubmitting(false)
    router.push("/") // Redirect back to main page after registration
  }

  const handleGenerateReport = async (type: string) => {
    if (
      !vehicle ||
      !productCode ||
      !productDescription ||
      !invoiceNumber ||
      !cif ||
      !originName ||
      quantity === "" ||
      weight === "" ||
      !anomalyType ||
      !reasonDescription
    ) {
      toast({
        title: "Preencha os campos",
        description: "Por favor, preencha todos os campos da anomalia para gerar o relatório.",
        variant: "destructive",
      })
      return
    }

    const currentAnomalyData: Anomaly = {
      id: "temp-report-id", // Temporary ID for report generation
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      loadNumber: vehicle.loadNumber || originName,
      productCode,
      productDescription,
      invoiceNumber,
      cif,
      originName,
      quantity: Number(quantity),
      weight: Number(weight),
      anomalyType: anomalyType as Anomaly["anomalyType"],
      reasonDescription,
      registrationDate: new Date().toISOString(),
    }

    try {
      switch (type) {
        case "whatsapp":
          generateSingleAnomalyWhatsappReport(currentAnomalyData)
          toast({ title: "Relatório WhatsApp gerado!", description: "Verifique a nova aba/janela." })
          break
        case "email":
          generateSingleAnomalyEmailReport(currentAnomalyData)
          toast({ title: "Relatório E-mail gerado!", description: "Verifique o seu cliente de e-mail." })
          break
        case "txt":
          generateSingleAnomalyTxtReport(currentAnomalyData)
          toast({ title: "Relatório TXT gerado!", description: "Download iniciado." })
          break
        case "excel":
          generateSingleAnomalyExcelReport(currentAnomalyData)
          toast({ title: "Relatório Excel (CSV) gerado!", description: "Download iniciado." })
          break
        case "pdf":
          await generateSingleAnomalyPdfReport(currentAnomalyData)
          toast({ title: "Relatório PDF gerado!", description: "Download iniciado." })
          break
        default:
          break
      }
    } catch (error) {
      console.error(`Erro ao gerar relatório ${type}:`, error)
      toast({
        title: `Erro ao gerar relatório ${type}`,
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    }
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-jbs">
        <Loader2 className="h-12 w-12 animate-spin text-jbs-blue" />
        <p className="mt-4 text-jbs-blue">Carregando detalhes do veículo...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-jbs">
      {/* Header Section */}
      <header className="w-full p-4 border-b bg-white text-jbs-blue shadow-sm">
        <div className="container mx-auto flex flex-col items-center md:flex-row md:justify-between">
          <div className="text-center md:text-left flex items-start gap-2">
            <Image src="/images/jbs-logo.png" alt="Logotipo JBS" width={70} height={70} className="h-auto" />
            <div>
              <h1 className="text-xl font-bold">Registro de Anomalia</h1>
              <p className="text-sm text-jbs-blue/80">{currentDateTime}</p>
            </div>
          </div>
          <nav className="flex space-x-4 md:ml-auto items-center">
            <Link href="/" className="hover:text-jbs-green transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" /> Início
            </Link>
            <Link href="/contact" className="hover:text-jbs-green transition-colors">
              Contato
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="bg-jbs-blue text-white p-2">
            <CardTitle className="text-center text-lg">Registrar Anomalia para Placa: {vehicle.plate}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* NOVO: Seção para exibir anomalias existentes */}
            {existingAnomalies.length > 0 && (
              <div className="mb-6 border-b pb-4">
                <h4 className="text-md font-semibold text-jbs-blue mb-3 text-center">
                  Anomalias Existentes para esta Carga
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-jbs-blue/90 text-white">
                      <TableRow>
                        <TableHead className="text-white">Tipo</TableHead>
                        <TableHead className="text-white">Cód. Prod.</TableHead>
                        <TableHead className="text-white">Qtd. Cx</TableHead>
                        <TableHead className="text-white">Peso (kg)</TableHead>
                        <TableHead className="text-white">Data Reg.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingAnomalies.map((anomaly) => (
                        <TableRow key={anomaly.id} className="hover:bg-jbs-blue/5 transition-colors">
                          <TableCell>{anomaly.anomalyType}</TableCell>
                          <TableCell>{anomaly.productCode}</TableCell>
                          <TableCell>{anomaly.quantity}</TableCell>
                          <TableCell>{anomaly.weight}</TableCell>
                          <TableCell>
                            {format(parseISO(anomaly.registrationDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveClick} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="productCode">Código do Produto</Label>
                <Input
                  id="productCode"
                  type="text"
                  placeholder="Ex: PROD-001"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productDescription">Descrição do Produto</Label>
                <Input
                  id="productDescription"
                  type="text"
                  placeholder="Ex: Carne Bovina Congelada"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Nota Fiscal</Label>
                <Input
                  id="invoiceNumber"
                  type="text"
                  placeholder="Ex: 123456789"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cif">CIF</Label>
                <Input
                  id="cif"
                  type="text"
                  placeholder="Ex: 123456"
                  value={cif}
                  onChange={(e) => setCif(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="originName">Origem da Carga (Nome da Filial)</Label>
                <Input
                  id="originName"
                  type="text"
                  placeholder="Ex: Filial São Paulo"
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade Cx</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Ex: 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.50"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="anomalyType">Tipo de Anomalia</Label>
                <Select
                  value={anomalyType}
                  onValueChange={(value) => setAnomalyType(value as Anomaly["anomalyType"])}
                  required
                >
                  <SelectTrigger id="anomalyType">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Falta">Falta</SelectItem>
                    <SelectItem value="Sobra">Sobra</SelectItem>
                    <SelectItem value="Avaria">Avaria</SelectItem>
                    <SelectItem value="Shelf">Shelf</SelectItem>
                    <SelectItem value="Inversão">Inversão</SelectItem> {/* NOVO */}
                    <SelectItem value="Vencido">Vencido</SelectItem> {/* NOVO */}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reasonDescription">Descreva o Motivo</Label>
                <Textarea
                  id="reasonDescription"
                  placeholder="Detalhes da anomalia..."
                  value={reasonDescription}
                  onChange={(e) => setReasonDescription(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-jbs-blue hover:bg-jbs-blue/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    <SaveIcon className="mr-2 h-4 w-4" /> Salvar Anomalia
                  </>
                )}
              </Button>
            </form>

            {/* Report Buttons */}
            <div className="mt-6 border-t pt-4">
              <h4 className="text-md font-semibold text-jbs-blue mb-3 text-center">Gerar Relatório de Ocorrência</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleGenerateReport("whatsapp")}
                  className="text-green-500 border-green-500 hover:bg-green-500/10"
                >
                  <MessageSquareText className="mr-2 h-5 w-5" /> WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateReport("email")}
                  className="text-blue-500 border-blue-500 hover:bg-blue-500/10"
                >
                  <Mail className="mr-2 h-5 w-5" /> E-mail
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateReport("txt")}
                  className="text-gray-700 border-gray-700 hover:bg-gray-700/10"
                >
                  <FileText className="mr-2 h-5 w-5" /> TXT
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateReport("excel")}
                  className="text-green-600 border-green-600 hover:bg-green-600/10"
                >
                  <FileSpreadsheet className="mr-2 h-5 w-5" /> Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateReport("pdf")}
                  className="text-red-600 border-red-600 hover:bg-red-600/10"
                >
                  <FilePdf className="mr-2 h-5 w-5" /> PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Password Confirmation Dialog */}
      <Dialog open={isConfirmingPassword} onOpenChange={setIsConfirmingPassword}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Registro de Anomalia</DialogTitle>
            <DialogDescription>
              Para confirmar o registro da anomalia, digite a placa do veículo{" "}
              <span className="font-bold text-jbs-blue">{vehicle?.plate}</span> abaixo:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirm-plate" className="text-right">
                Placa
              </Label>
              <Input
                id="confirm-plate"
                type="text"
                placeholder="Digite a placa"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingPassword(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPassword}
              className="bg-jbs-blue hover:bg-jbs-blue/90 text-white"
              disabled={!passwordInput.trim()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer Section */}
      <footer className="w-full p-4 border-t bg-jbs-blue text-white text-center text-sm shadow-sm mt-auto">
        <div className="container mx-auto">
          <p>{"© 2025 Meu Aplicativo Responsivo. Todos os direitos reservados."}</p>
        </div>
      </footer>
    </div>
  )
}
