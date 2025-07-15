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
  generateAnomalyWhatsappReport,
  generateAnomalyEmailReport,
  generateAnomalyTxtReport,
  generateAnomalyExcelReport,
  generateAnomalyPdfReport,
} from "@/lib/report-generators" // Importa as novas funções de relatório de anomalias
import type { Anomaly } from "@/app/anomaly-registration/page" // Importa o tipo Anomaly

export default function AnomalyReportPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [searchPlate, setSearchPlate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filteredAnomalies, setFilteredAnomalies] = useState<Anomaly[]>([])
  const [currentDateTime, setCurrentDateTime] = useState("")

  useEffect(() => {
    // Load anomalies from Local Storage
    const storedAnomalies = localStorage.getItem("anomalies")
    if (storedAnomalies) {
      const parsedAnomalies: Anomaly[] = JSON.parse(storedAnomalies)
      setAnomalies(parsedAnomalies)
      setFilteredAnomalies(parsedAnomalies) // Initially show all anomalies
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
  }, [anomalies, searchPlate, startDate, endDate]) // Re-filter when dependencies change

  const applyFilters = () => {
    let tempFiltered = [...anomalies]

    if (searchPlate.trim()) {
      tempFiltered = tempFiltered.filter((a) => a.plate.includes(searchPlate.toUpperCase().trim()))
    }

    if (startDate) {
      const start = parseISO(startDate)
      tempFiltered = tempFiltered.filter((a) => {
        const registration = parseISO(a.registrationDate)
        return isAfter(registration, start) || registration.toDateString() === start.toDateString()
      })
    }

    if (endDate) {
      const end = parseISO(endDate)
      tempFiltered = tempFiltered.filter((a) => {
        const registration = parseISO(a.registrationDate)
        return isBefore(registration, end) || registration.toDateString() === end.toDateString()
      })
    }
    setFilteredAnomalies(tempFiltered)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
    if (filteredAnomalies.length === 0) {
      toast({
        title: "Nenhum resultado",
        description: "Nenhuma anomalia encontrada com os critérios de busca.",
        variant: "info",
      })
    } else {
      toast({
        title: "Busca Concluída",
        description: `${filteredAnomalies.length} anomalias encontradas.`,
        variant: "default",
      })
    }
  }

  const handleClearFilters = () => {
    setSearchPlate("")
    setStartDate("")
    setEndDate("")
    setFilteredAnomalies(anomalies) // Show all anomalies
    toast({
      title: "Filtros Limpos",
      description: "Exibindo todas as anomalias.",
    })
  }

  const handleGenerateReport = async (type: string) => {
    if (filteredAnomalies.length === 0) {
      toast({
        title: "Nenhum dado para relatório",
        description: "Não há anomalias no histórico filtrado para gerar o relatório.",
        variant: "destructive",
      })
      return
    }

    try {
      switch (type) {
        case "whatsapp":
          generateAnomalyWhatsappReport(filteredAnomalies)
          toast({ title: "Relatório WhatsApp gerado!", description: "Verifique a nova aba/janela." })
          break
        case "email":
          generateAnomalyEmailReport(filteredAnomalies)
          toast({ title: "Relatório E-mail gerado!", description: "Verifique seu cliente de e-mail." })
          break
        case "txt":
          generateAnomalyTxtReport(filteredAnomalies)
          toast({ title: "Relatório TXT gerado!", description: "Download iniciado." })
          break
        case "excel":
          generateAnomalyExcelReport(filteredAnomalies)
          toast({ title: "Relatório Excel (CSV) gerado!", description: "Download iniciado." })
          break
        case "pdf":
          await generateAnomalyPdfReport(filteredAnomalies)
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
              <h1 className="text-xl font-bold">Relatório de Anomalias</h1>
              <p className="text-sm text-jbs-blue/80">{currentDateTime}</p>
            </div>
          </div>
          <nav className="flex space-x-4 md:ml-auto items-center">
            <Link href="/" className="hover:text-jbs-green transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" /> Início
            </Link>
            <Link href="/history" className="hover:text-jbs-green transition-colors">
              Histórico
            </Link>
            <Link href="/monitoring" className="hover:text-jbs-green transition-colors">
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
        <h2 className="text-xl font-bold text-center mb-4 text-jbs-blue">Consultar Anomalias</h2>

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
                <Label htmlFor="startDate">Data de Registro (Início)</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Data de Registro (Fim)</Label>
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
            <CardTitle className="text-lg font-semibold text-jbs-blue">Gerar Relatório de Anomalias</CardTitle>
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

        {/* Anomaly List */}
        <h3 className="text-lg font-bold text-center mb-4 text-jbs-blue">Anomalias Registradas</h3>
        <Card className="w-full">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-jbs-blue text-white">
                  <TableRow>
                    <TableHead className="w-[100px] text-white">Placa</TableHead>
                    <TableHead className="text-white">N° Carga</TableHead>
                    <TableHead className="text-white">Cód. Produto</TableHead>
                    <TableHead className="text-white">CIF</TableHead>
                    <TableHead className="text-white">Carga Original</TableHead>
                    <TableHead className="text-white">Qtd. Cx</TableHead>
                    <TableHead className="text-white">Peso (kg)</TableHead>
                    <TableHead className="text-white">Tipo Anomalia</TableHead>
                    <TableHead className="text-white">Motivo</TableHead>
                    <TableHead className="text-white">Data Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnomalies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                        Nenhuma anomalia encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnomalies.map((anomaly) => (
                      <TableRow key={anomaly.id} className="hover:bg-jbs-blue/5 transition-colors">
                        <TableCell className="font-medium">{anomaly.plate}</TableCell>
                        <TableCell>{anomaly.loadNumber || "-"}</TableCell>
                        <TableCell>{anomaly.productCode}</TableCell>
                        <TableCell>{anomaly.cif}</TableCell>
                        <TableCell>{anomaly.originalLoad}</TableCell>
                        <TableCell>{anomaly.quantity}</TableCell>
                        <TableCell>{anomaly.weight}</TableCell>
                        <TableCell>{anomaly.anomalyType}</TableCell>
                        <TableCell>{anomaly.reasonDescription}</TableCell>
                        <TableCell>
                          {format(parseISO(anomaly.registrationDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
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
