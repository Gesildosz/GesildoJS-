"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Home, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Anomaly } from "@/app/anomaly-registration/page" // Importa o tipo Anomaly

export default function AnomalyDetailsByTypePage() {
  const searchParams = useSearchParams()
  const anomalyTypeFilter = searchParams.get("type") // Obtém o tipo de anomalia da URL

  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [filteredAnomalies, setFilteredAnomalies] = useState<Anomaly[]>([])
  const [currentDateTime, setCurrentDateTime] = useState("")

  useEffect(() => {
    const storedAnomalies = localStorage.getItem("anomalies")
    if (storedAnomalies) {
      const parsedAnomalies: Anomaly[] = JSON.parse(storedAnomalies)
      setAnomalies(parsedAnomalies)
    }

    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy HH:mm:ss", { locale: ptBR }))
    }
    updateDateTime()
    const intervalId = setInterval(updateDateTime, 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (anomalyTypeFilter) {
      const filtered = anomalies.filter((a) => a.anomalyType === anomalyTypeFilter)
      setFilteredAnomalies(filtered)
      if (filtered.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: `Nenhuma anomalia do tipo "${anomalyTypeFilter}" encontrada.`,
          variant: "info",
        })
      } else {
        toast({
          title: "Detalhes Carregados",
          description: `${filtered.length} anomalias do tipo "${anomalyTypeFilter}" encontradas.`,
          variant: "default",
        })
      }
    } else {
      setFilteredAnomalies([]) // Limpa se não houver filtro
      toast({
        title: "Erro",
        description: "Tipo de anomalia não especificado na URL.",
        variant: "destructive",
      })
    }
  }, [anomalies, anomalyTypeFilter])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-jbs">
      {/* Header Section */}
      <header className="w-full p-4 border-b bg-white text-jbs-blue shadow-sm">
        <div className="container mx-auto flex flex-col items-center md:flex-row md:justify-between">
          <div className="text-center md:text-left flex items-start gap-2">
            <Image src="/images/jbs-logo.png" alt="Logotipo JBS" width={70} height={70} className="h-auto" />
            <div>
              <h1 className="text-xl font-bold">Detalhes de Anomalias por Tipo</h1>
              <p className="text-sm text-jbs-blue/80">{currentDateTime}</p>
            </div>
          </div>
          <nav className="flex space-x-4 md:ml-auto items-center">
            <Link href="/monitoring" className="hover:text-jbs-green transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Monitoramento
            </Link>
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
      <main className="flex-1 container mx-auto p-4 flex flex-col">
        <h2 className="text-xl font-bold text-center mb-4 text-jbs-blue">
          Anomalias do Tipo: {anomalyTypeFilter || "N/A"}
        </h2>

        <Card className="w-full">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-jbs-blue text-white">
                  <TableRow>
                    <TableHead className="w-[100px] text-white">Placa</TableHead>
                    <TableHead className="text-white">N° Carga</TableHead>
                    <TableHead className="text-white">Cód. Produto</TableHead>
                    <TableHead className="text-white">Desc. Produto</TableHead>
                    <TableHead className="text-white">Nota Fiscal</TableHead>
                    <TableHead className="text-white">CIF</TableHead>
                    <TableHead className="text-white">Origem da Carga</TableHead>
                    <TableHead className="text-white">Qtd. Cx</TableHead>
                    <TableHead className="text-white">Peso (kg)</TableHead>
                    <TableHead className="text-white">Motivo</TableHead>
                    <TableHead className="text-white">Data Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnomalies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                        Nenhuma anomalia encontrada para este tipo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnomalies.map((anomaly) => (
                      <TableRow key={anomaly.id} className="hover:bg-jbs-blue/5 transition-colors">
                        <TableCell className="font-medium">{anomaly.plate}</TableCell>
                        <TableCell>{anomaly.loadNumber || "-"}</TableCell>
                        <TableCell>{anomaly.productCode}</TableCell>
                        <TableCell>{anomaly.productDescription}</TableCell>
                        <TableCell>{anomaly.invoiceNumber}</TableCell>
                        <TableCell>{anomaly.cif}</TableCell>
                        <TableCell>{anomaly.originName}</TableCell>
                        <TableCell>{anomaly.quantity}</TableCell>
                        <TableCell>{anomaly.weight}</TableCell>
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
