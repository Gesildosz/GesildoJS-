"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { format, parseISO, isBefore, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Home, Search, MessageSquareText, Mail, FileText, FileSpreadsheet, FileIcon as FilePdf } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  generateWhatsappReport,
  generateEmailReport,
  generateTxtReport,
  generateExcelReport,
  generatePdfReport,
} from "@/lib/report-generators"
import type { Vehicle } from "@/app/page" // Importa o tipo Vehicle

export default function HistoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchPlate, setSearchPlate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filteredHistory, setFilteredHistory] = useState<Vehicle[]>([])
  const [currentDateTime, setCurrentDateTime] = useState("")

  useEffect(() => {
    // Load vehicles from Local Storage
    const storedVehicles = localStorage.getItem("vehicles")
    if (storedVehicles) {
      const parsedVehicles: Vehicle[] = JSON.parse(storedVehicles)
      setVehicles(parsedVehicles)
      // Initially filter for finalized vehicles
      setFilteredHistory(parsedVehicles.filter((v) => v.status === "finalizado"))
    }

    // Update date and time
    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy HH:mm:ss", { locale: ptBR }))
    }
    updateDateTime()
    const intervalId = setInterval(updateDateTime, 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [vehicles, searchPlate, startDate, endDate]) // Re-filter when dependencies change

  const applyFilters = () => {
    let tempFiltered = vehicles.filter((v) => v.status === "finalizado")

    if (searchPlate.trim()) {
      tempFiltered = tempFiltered.filter((v) => v.plate.includes(searchPlate.toUpperCase().trim()))
    }

    if (startDate) {
      const start = parseISO(startDate)
      tempFiltered = tempFiltered.filter((v) => {
        const arrival = parseISO(v.arrivalDate)
        return isAfter(arrival, start) || arrival.toDateString() === start.toDateString()
      })
    }

    if (endDate) {
      const end = parseISO(endDate)
      tempFiltered = tempFiltered.filter((v) => {
        const arrival = parseISO(v.arrivalDate)
        return isBefore(arrival, end) || arrival.toDateString() === end.toDateString()
      })
    }
    setFilteredHistory(tempFiltered)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
    if (filteredHistory.length === 0) {
      toast({
        title: "Nenhum resultado",
        description: "Nenhum veículo finalizado encontrado com os critérios de busca.",
        variant: "info",
      })
    } else {
      toast({
        title: "Busca Concluída",
        description: `${filteredHistory.length} veículos encontrados.`,
        variant: "default",
      })
    }
  }

  const handleClearFilters = () => {
    setSearchPlate("")
    setStartDate("")
    setEndDate("")
    // Re-apply filters to show all finalized vehicles
    setFilteredHistory(vehicles.filter((v) => v.status === "finalizado"))
    toast({
      title: "Filtros Limpos",
      description: "Exibindo todos os veículos finalizados.",
    })
  }

  const handleGenerateReport = async (type: string) => {
    if (filteredHistory.length === 0) {
      toast({
        title: "Nenhum dado para relatório",
        description: "Não há veículos no histórico filtrado para gerar o relatório.",
        variant: "destructive",
      })
      return
    }

    try {
      switch (type) {
        case "whatsapp":
          generateWhatsappReport(filteredHistory)
          toast({ title: "Relatório WhatsApp gerado!", description: "Verifique a nova aba/janela." })
          break
        case "email":
          generateEmailReport(filteredHistory)
          toast({ title: "Relatório E-mail gerado!", description: "Verifique seu cliente de e-mail." })
          break
        case "txt":
          generateTxtReport(filteredHistory)
          toast({ title: "Relatório TXT gerado!", description: "Download iniciado." })
          break
        case "excel":
          generateExcelReport(filteredHistory)
          toast({ title: "Relatório Excel (CSV) gerado!", description: "Download iniciado." })
          break
        case "pdf":
          // For PDF, we need counts. For history, we might just pass 0 or re-calculate if needed.
          // For simplicity, I'll pass dummy counts for history PDF, or you can calculate them from filteredHistory
          await generatePdfReport(filteredHistory, {
            patio: 0,
            descarga: 0,
            finalizado: filteredHistory.length, // Only finalized count is relevant here
            resfriado: filteredHistory.filter((v) => v.temperature === "Resfriado").length,
            congelado: filteredHistory.filter((v) => v.temperature === "Congelado").length,
            festivo: filteredHistory.filter((v) => v.temperature === "Festivo").length,
          })
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-jbs">
      {/* Header Section */}
      <header className="w-full p-4 border-b bg-white text-jbs-blue shadow-sm">
        <div className="container mx-auto flex flex-col items-center md:flex-row md:justify-between">
          <div className="text-center md:text-left flex items-start gap-2">
            <Image src="/images/jbs-logo.png" alt="Logotipo JBS" width={70} height={70} className="h-auto" />
            <div>
              <h1 className="text-xl font-bold">Histórico de Descargas Finalizadas</h1>
              <p className="text-sm text-jbs-blue/80">{currentDateTime}</p>
            </div>
          </div>
          <nav className="flex space-x-4 md:ml-auto items-center">
            <Link href="/" className="hover:text-jbs-green transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" /> Início
            </Link>
            <Link href="/monitoring" className="hover:text-jbs-green transition-colors">
              {" "}
              Recursos
            </Link>
            <Link href="/contact" className="hover:text-jbs-green transition-colors">
              Contato
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto p-4 flex flex-col">
        <h2 className="text-xl font-bold text-center mb-4 text-jbs-blue">Consultar Histórico</h2>

        {/* Search Form */}
        <Card className="w-full max-w-2xl mx-auto mb-8 p-4 shadow-md">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-jbs-blue">Filtros de Busca</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="searchPlate">Buscar por Placa</Label>
                <Input
                  id="searchPlate"
                  type="text"
                  placeholder="Ex: ABC-1234"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data de Chegada (Início)</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Data de Chegada (Fim)</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="flex gap-2 mt-auto md:col-span-2 justify-end">
                <Button type="submit" className="bg-jbs-blue hover:bg-jbs-blue/90 text-white">
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Button>
                <Button type="button" variant="outline" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Report Buttons */}
        <Card className="w-full max-w-2xl mx-auto mb-8 p-4 shadow-md">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-jbs-blue">Gerar Relatório do Histórico</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-wrap gap-2 justify-center">
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
          </CardContent>
        </Card>

        {/* History List */}
        <h3 className="text-lg font-bold text-center mb-4 text-jbs-blue">Veículos Finalizados</h3>
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
                    <TableHead className="text-white">Motorista</TableHead>
                    <TableHead className="text-white">Telefone</TableHead>
                    <TableHead className="text-white">Transportadora</TableHead>
                    <TableHead className="text-white">Anomalia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                        Nenhum veículo finalizado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory.map((vehicle) => (
                      <TableRow key={vehicle.id} className="hover:bg-jbs-blue/5 transition-colors">
                        <TableCell className="font-medium">{vehicle.plate}</TableCell>
                        <TableCell>{vehicle.status === "finalizado" ? "Finalizado" : vehicle.status}</TableCell>
                        <TableCell>{vehicle.dock}</TableCell>
                        <TableCell>{vehicle.temperature}</TableCell>
                        <TableCell>{vehicle.seal}</TableCell>
                        <TableCell>{vehicle.containerNumber || "-"}</TableCell>
                        <TableCell>{vehicle.vehicleProfile}</TableCell>
                        <TableCell>{vehicle.loadNumber || "-"}</TableCell>
                        <TableCell>{vehicle.scheduledDate}</TableCell>
                        <TableCell>{vehicle.arrivalDate}</TableCell>
                        <TableCell>{vehicle.driverName || "N/A"}</TableCell>
                        <TableCell>{vehicle.driverPhone || "N/A"}</TableCell>
                        <TableCell>{vehicle.carrier || "N/A"}</TableCell>
                        <TableCell>{vehicle.hasAnomaly ? "Sim" : "Não"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer Section */}
      <footer className="w-full p-4 border-t bg-jbs-blue text-white text-center text-sm shadow-sm mt-auto">
        <div className="container mx-auto">
          <p>{"© 2025 Meu Aplicativo Responsivo. Todos os direitos reservados."}</p>
        </div>
      </footer>
    </div>
  )
}
