"use client" // Este componente precisa ser cliente para usar useState

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  MessageSquareText,
  Mail,
  FileText,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Camera,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils" // Importa a função cn para classes condicionais
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Importa os componentes de Tooltip
import { toast } from "@/hooks/use-toast" // Importa o toast para feedback ao usuário
import {
  generateWhatsappReport,
  generateEmailReport,
  generateTxtReport,
  generateExcelReport,
  generatePdfReport,
} from "@/lib/report-generators" // Importa as funções de geração de relatório
import type { Vehicle } from "@/app/page" // Importa o tipo Vehicle

interface QuickReportSidebarProps {
  vehicles: Vehicle[] // Recebe a lista de veículos como prop
  patioCount: number // Nova prop
  descargaCount: number // Nova prop
  finalizadoCount: number // Nova prop
  resfriadoCount: number // Nova prop
  congeladoCount: number // Nova prop
  festivoCount: number // Nova prop
}

export function QuickReportSidebar({
  vehicles,
  patioCount,
  descargaCount,
  finalizadoCount,
  resfriadoCount,
  congeladoCount,
  festivoCount,
}: QuickReportSidebarProps) {
  const [isOpen, setIsOpen] = useState(false) // Estado para controlar se a barra lateral está aberta ou fechada
  const [isGenerating, setIsGenerating] = useState<string | null>(null) // Estado para controlar qual relatório está sendo gerado

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleGenerateReport = async (type: string) => {
    setIsGenerating(type)
    try {
      switch (type) {
        case "whatsapp":
          generateWhatsappReport(vehicles)
          toast({ title: "Relatório WhatsApp gerado!", description: "Verifique a nova aba/janela." })
          break
        case "email":
          generateEmailReport(vehicles)
          toast({ title: "Relatório E-mail gerado!", description: "Verifique seu cliente de e-mail." })
          break
        case "txt":
          generateTxtReport(vehicles)
          toast({ title: "Relatório TXT gerado!", description: "Download iniciado." })
          break
        case "excel":
          generateExcelReport(vehicles)
          toast({ title: "Relatório Excel (CSV) gerado!", description: "Download iniciado." })
          break
        case "pdf":
          await generatePdfReport(vehicles, {
            patio: patioCount,
            descarga: descargaCount,
            finalizado: finalizadoCount,
            resfriado: resfriadoCount,
            congelado: congeladoCount,
            festivo: festivoCount,
          }) // Passa as contagens
          toast({ title: "Relatório PDF gerado!", description: "Download iniciado." })
          break
        case "prtscr":
          // Implementação futura para Print Screen ou outro tipo de relatório visual
          toast({ title: "Funcionalidade em desenvolvimento", description: "Print Screen ainda não implementado." })
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
    } finally {
      setIsGenerating(null)
    }
  }

  return (
    <TooltipProvider>
      {" "}
      {/* Envolve com TooltipProvider para habilitar tooltips */}
      <Card
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50 p-2 shadow-lg flex flex-col items-center gap-4 bg-jbs-blue text-white transition-all duration-300 ease-in-out",
          isOpen ? "right-0 w-auto" : "right-0 w-12 overflow-hidden", // Quando fechado, largura fixa e esconde o excesso
        )}
      >
        {/* Botão de Alternância (Seta) - Posicionado absolutamente dentro do Card */}
        <Tooltip delayDuration={300}>
          {" "}
          {/* Adiciona Tooltip ao botão */}
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-12 w-12 rounded-l-lg rounded-r-none flex items-center justify-center shadow-lg bg-jbs-green text-white hover:bg-jbs-green/90",
                isOpen ? "left-[-48px]" : "left-0", // Move o botão para a esquerda do card quando aberto, ou para a borda direita do card quando fechado
              )}
              onClick={toggleSidebar}
              aria-label={isOpen ? "Fechar Relatório Rápido" : "Abrir Relatório Rápido"}
            >
              {isOpen ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}{" "}
              {/* Seta muda de direção */}
            </Button>
          </TooltipTrigger>
          {!isOpen && <TooltipContent side="left">Relatório Rápido</TooltipContent>}{" "}
          {/* Mostra tooltip apenas quando fechado */}
        </Tooltip>
        {/* Conteúdo da barra lateral (Texto "Relatório Rápido" e Ícone) */}
        {/* Visível apenas quando a barra lateral está aberta */}
        <div className={cn("flex flex-col items-center justify-center h-full", !isOpen && "hidden")}>
          <ClipboardList className="h-6 w-6 mb-2" />
          <span className="text-sm font-semibold [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
            Relatório Rápido
          </span>
        </div>
        {/* Botões de Relatório */}
        {/* Visíveis apenas quando a barra lateral está aberta */}
        <div className={cn("flex flex-col gap-2", !isOpen && "hidden")}>
          <Button
            variant="outline"
            size="icon"
            aria-label="WhatsApp"
            onClick={() => handleGenerateReport("whatsapp")}
            disabled={isGenerating === "whatsapp"}
            className="text-green-500 border-green-500 hover:bg-green-500/10"
          >
            {isGenerating === "whatsapp" ? "..." : <MessageSquareText className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="E-mail"
            onClick={() => handleGenerateReport("email")}
            disabled={isGenerating === "email"}
            className="text-blue-500 border-blue-500 hover:bg-blue-500/10"
          >
            {isGenerating === "email" ? "..." : <Mail className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="TXT"
            onClick={() => handleGenerateReport("txt")}
            disabled={isGenerating === "txt"}
            className="text-gray-700 border-gray-700 hover:bg-gray-700/10"
          >
            {isGenerating === "txt" ? "..." : <FileText className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Excel"
            onClick={() => handleGenerateReport("excel")}
            disabled={isGenerating === "excel"}
            className="text-green-600 border-green-600 hover:bg-green-600/10"
          >
            {isGenerating === "excel" ? "..." : <FileSpreadsheet className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="PDF"
            onClick={() => handleGenerateReport("pdf")}
            disabled={isGenerating === "pdf"}
            className="text-red-600 border-red-600 hover:bg-red-600/10"
          >
            {isGenerating === "pdf" ? "..." : <FilePdf className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Print Screen"
            onClick={() => handleGenerateReport("prtscr")}
            disabled={isGenerating === "prtscr"}
            className="text-gray-700 border-gray-700 hover:bg-gray-700/10"
          >
            {isGenerating === "prtscr" ? "..." : <Camera className="h-5 w-5" />}
          </Button>
        </div>
      </Card>
    </TooltipProvider>
  )
}
