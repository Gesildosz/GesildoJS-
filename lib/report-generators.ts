import type { Vehicle } from "@/app/page" // Importa o tipo Vehicle
import type { Anomaly } from "@/app/anomaly-registration/page" // Importa o tipo Anomaly
import { toast } from "@/hooks/use-toast" // Importa o toast para feedback ao usuário
import { downloadFile } from "@/utils/download-file" // Importa a função downloadFile do novo local
import { format, parseISO } from "date-fns" // Importa format e parseISO para datas

// Função para obter imagem em base64 de uma URL e suas dimensões
async function getBase64Image(url: string): Promise<{ data: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}: ${response.status} ${response.statusText}`)
      return null
    }
    const blob = await response.blob()
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          resolve({ data: reader.result as string, width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = (event) => {
          console.error("Image loading error:", event)
          reject(new Error("Failed to load image for PDF."))
        }
        img.src = reader.result as string
      }
      reader.onerror = (error) => {
        console.error("FileReader error during image conversion:", error)
        reject(error)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Erro ao buscar ou converter imagem para base64:", error)
    return null
  }
}

// Helper function to ensure jsPDF and autoTable are ready
async function getReadyJsPDF() {
  console.log("getReadyJsPDF: Iniciando carregamento de jsPDF e jspdf-autotable...")

  // Armazena a referência original de window.jsPDF, se existir
  const originalJsPDF = (window as any).jsPDF

  try {
    // 1. Importa jsPDF
    const { default: ImportedJsPDF } = await import("jspdf")
    console.log("getReadyJsPDF: jsPDF importado.")

    // 2. Atribui a instância importada de jsPDF ao objeto global window
    // Isso é crucial para que jspdf-autotable possa encontrá-lo e aplicar seus patches.
    ;(window as any).jsPDF = ImportedJsPDF
    console.log("getReadyJsPDF: jsPDF importado atribuído a window.jsPDF.")

    // 3. Importa dinamicamente jspdf-autotable.
    // Esta importação tem efeitos colaterais e deve estender o protótipo de window.jsPDF.
    console.log("getReadyJsPDF: Carregando jspdf-autotable...")
    await import("jspdf-autotable")
    console.log("getReadyJsPDF: jspdf-autotable carregado e extensão aplicada.")

    // 4. Recupera o construtor jsPDF (agora com patch) do objeto window.
    // Ele deve agora conter o método autoTable.
    const PatchedJsPDF = (window as any).jsPDF

    // 5. Verifica se o método autoTable está presente
    if (typeof (PatchedJsPDF.prototype as any).autoTable !== "function") {
      console.error("getReadyJsPDF: ERRO CRÍTICO: jspdf-autotable falhou em estender o protótipo de jsPDF.")
      throw new Error("Falha na inicialização do PDF: 'autoTable' não foi adicionado ao jsPDF.")
    }
    console.log("getReadyJsPDF: jsPDF.prototype.autoTable está disponível.")
    return PatchedJsPDF
  } catch (error) {
    console.error("Erro durante o carregamento de jsPDF/jspdf-autotable:", error)
    throw error // Re-lança o erro após o log
  } finally {
    // 6. Restaura o window.jsPDF original para evitar poluição global
    if (originalJsPDF) {
      ;(window as any).jsPDF = originalJsPDF
    } else {
      delete (window as any).jsPDF
    }
    console.log("getReadyJsPDF: window.jsPDF restaurado para o estado original.")
  }
}

// --- Gerador de Relatório WhatsApp (Veículos) ---
export const generateWhatsappReport = (vehicles: Vehicle[]) => {
  let message = "Relatório de Veículos:\n\n"
  if (vehicles.length === 0) {
    message += "Nenhum veículo registrado."
  } else {
    vehicles.forEach((v, index) => {
      message += `${index + 1}. Placa: ${v.plate}, Status: ${v.status}, Doca: ${v.dock}, Carga: ${v.loadNumber || "-"}
`
    })
  }
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, "_blank")
}

// --- Gerador de Relatório E-mail (Veículos) ---
export const generateEmailReport = (vehicles: Vehicle[]) => {
  const subject = "Relatório Detalhado de Veículos"
  let body = "Prezado(a),\n\nSegue o relatório detalhado dos veículos:\n\n"
  if (vehicles.length === 0) {
    body += "Nenhum veículo registrado."
  } else {
    vehicles.forEach((v, index) => {
      body += `Veículo ${index + 1}:\n`
      body += `  Placa: ${v.plate}\n`
      body += `  Status: ${v.status}\n`
      body += `  Doca: ${v.dock}\n`
      body += `  Temperatura: ${v.temperature}\n`
      body += `  Lacre: ${v.seal}\n`
      if (v.vehicleProfile === "Contêiner") {
        body += `  N° Contêiner: ${v.containerNumber}\n`
      }
      body += `  Perfil: ${v.vehicleProfile}\n`
      body += `  N° Carga: ${v.loadNumber || "-sensitive"}\n`
      body += `  Agendamento: ${v.scheduledDate}\n`
      body += `  Chegada: ${v.arrivalDate}\n`
      body += `  Motorista: ${v.driverName || "Não informado"}\n`
      body += `  Telefone: ${v.driverPhone || "Não informado"}\n`
      body += `  Transportadora: ${v.carrier || "Não informado"}\n\n`
    })
  }
  body += "\nAtenciosamente,\nSua Equipe"

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoUrl, "_blank")
}

// --- Gerador de Relatório TXT (Veículos) ---
export const generateTxtReport = (vehicles: Vehicle[]) => {
  let content = "Relatório Detalhado de Veículos\n\n"
  if (vehicles.length === 0) {
    content += "Nenhum veículo registrado."
  } else {
    vehicles.forEach((v, index) => {
      content += `--- Veículo ${index + 1} ---\n`
      content += `Placa: ${v.plate}\n`
      content += `Status: ${v.status}\n`
      content += `Doca: ${v.dock}\n`
      content += `Temperatura: ${v.temperature}\n`
      content += `Lacre: ${v.seal}\n`
      if (v.vehicleProfile === "Contêiner") {
        content += `N° Contêiner: ${v.containerNumber}\n`
      }
      content += `Perfil: ${v.vehicleProfile}\n`
      content += `N° Carga: ${v.loadNumber || "-sensitive"}\n`
      content += `Agendamento: ${v.scheduledDate}\n`
      content += `Chegada: ${v.arrivalDate}\n`
      content += `Motorista: ${v.driverName || "Não informado"}\n`
      content += `Telefone: ${v.driverPhone || "Não informado"}\n`
      content += `Transportadora: ${v.carrier || "Não informado"}\n`
      content += "-----------------------\n\n"
    })
  }
  downloadFile(content, "relatorio_veiculos.txt", "text/plain")
}

// --- Gerador de Relatório Excel (CSV) (Veículos) ---
export const generateExcelReport = (vehicles: Vehicle[]) => {
  const headers = [
    "Placa",
    "Status",
    "Doca",
    "Temperatura",
    "Lacre",
    "N° Conteiner",
    "Perfil Veiculo",
    "N° Carga",
    "Agendamento",
    "Chegada",
    "Nome Motorista",
    "Telefone Motorista",
    "Transportadora",
  ]
  let csvContent = headers.join(";") + "\n" // Use semicolon for better Excel compatibility in some locales

  if (vehicles.length > 0) {
    vehicles.forEach((v) => {
      const row = [
        v.plate,
        v.status,
        v.dock,
        v.temperature,
        v.seal,
        v.vehicleProfile === "Contêiner" ? v.containerNumber : "",
        v.vehicleProfile,
        v.loadNumber || "-",
        v.scheduledDate,
        v.arrivalDate,
        v.driverName || "",
        v.driverPhone || "",
        v.carrier || "",
      ]
      // Envolve cada campo com aspas e escapa aspas internas para CSV correto
      csvContent += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(";") + "\n"
    })
  }

  downloadFile(csvContent, "relatorio_veiculos.csv", "text/csv;charset=utf-8;")
}

// --- Gerador de Relatório PDF (Veículos) ---
export const generatePdfReport = async (
  vehicles: Vehicle[],
  counts: {
    patio: number
    descarga: number
    finalizado: number
    resfriado: number
    congelado: number
    festivo: number
  },
) => {
  try {
    console.log("Iniciando geração do relatório PDF...")

    // Obtém o construtor jsPDF já estendido com autoTable
    const JsPdfConstructor = await getReadyJsPDF()
    const doc = new JsPdfConstructor()
    console.log("jsPDF instanciado.")

    // Verificação final na instância para garantir que autoTable está disponível
    if (typeof (doc as any).autoTable !== "function") {
      console.error("ERRO CRÍTICO: A função 'autoTable' não foi encontrada na instância do jsPDF após a criação.")
      throw new Error("Falha na geração do PDF: 'autoTable' não está disponível na instância do documento.")
    }

    let currentY = 10 // Posição Y inicial para o conteúdo
    const pageCenterX = doc.internal.pageSize.width / 2
    const marginX = 15 // Margem lateral para o conteúdo

    // --- Cabeçalho Profissional ---
    // Adicionar Logo
    console.log("Tentando carregar imagem do logo...")
    const imgDataWithDimensions = await getBase64Image("/images/jbs-logo.png")
    if (imgDataWithDimensions) {
      console.log("Logo carregado com sucesso.")
      const { data: imgData, width: imgWidth, height: imgHeight } = imgDataWithDimensions
      try {
        const desiredPdfWidth = 40 // Largura desejada em unidades do PDF (e.g., mm)
        const aspectRatio = imgWidth / imgHeight
        const calculatedPdfHeight = desiredPdfWidth / aspectRatio

        doc.addImage(imgData, "PNG", marginX, currentY, desiredPdfWidth, calculatedPdfHeight)
        currentY += calculatedPdfHeight + 5 // Move Y abaixo da imagem + margem
      } catch (imgError) {
        console.error("Erro ao adicionar imagem ao PDF:", imgError)
        console.warn("Logotipo JBS não pôde ser adicionado ao PDF. O relatório será gerado sem ele.")
        currentY = 10 // Reinicia Y se a imagem falhou, ou mantém em 10 se não houver imagem
      }
    } else {
      console.warn("Logotipo JBS não pôde ser carregado para o PDF. O relatório será gerado sem ele.")
      currentY = 10 // Começa do topo se não houver imagem
    }

    // Título Principal
    doc.setFontSize(24)
    doc.setTextColor(42, 59, 143) // JBS Blue
    doc.text("Relatório Detalhado de Veículos", pageCenterX, currentY, { align: "center" })
    currentY += 10

    // Data de Geração
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100) // Cinza para a data
    doc.text(
      `Data de Geração: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
      pageCenterX,
      currentY,
      { align: "center" },
    )
    currentY += 15 // Espaço após a data

    // Linha separadora
    doc.setDrawColor(42, 59, 143) // JBS Blue
    doc.line(marginX, currentY, doc.internal.pageSize.width - marginX, currentY)
    currentY += 10 // Espaço após a linha

    // --- Seção de Resumo de Veículos por Status ---
    doc.setFontSize(16)
    doc.setTextColor(42, 59, 143) // JBS Blue
    doc.text("Resumo de Veículos por Status", pageCenterX, currentY, { align: "center" })
    currentY += 5
    console.log("Gerando tabela de resumo por status...")
    ;(doc as any).autoTable({
      startY: currentY,
      head: [["Status", "Quantidade"]],
      body: [
        ["Pátio", counts.patio],
        ["Em Descarga", counts.descarga],
        ["Finalizado", counts.finalizado],
      ],
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 2,
        halign: "center",
        textColor: [0, 0, 0], // Preto para o texto do corpo
      },
      headStyles: {
        fillColor: [42, 59, 143], // JBS Blue
        textColor: [255, 255, 255], // Branco
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [230, 245, 225], // Verde claro JBS
      },
      margin: { left: marginX, right: marginX },
    })
    currentY = (doc as any).autoTable.previous.finalY + 10 // Atualiza Y após a tabela de resumo

    // --- Seção de Resumo de Veículos por Temperatura/Tipo ---
    doc.setFontSize(16)
    doc.setTextColor(42, 59, 143) // JBS Blue
    doc.text("Resumo de Veículos por Temperatura/Tipo", pageCenterX, currentY, { align: "center" })
    currentY += 5
    console.log("Gerando tabela de resumo por temperatura/tipo...")
    ;(doc as any).autoTable({
      startY: currentY,
      head: [["Tipo", "Quantidade"]],
      body: [
        ["Resfriado", counts.resfriado],
        ["Congelado", counts.congelado],
        ["Festivo", counts.festivo],
      ],
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 2,
        halign: "center",
        textColor: [0, 0, 0], // Preto para o texto do corpo
      },
      headStyles: {
        fillColor: [42, 59, 143], // JBS Blue
        textColor: [255, 255, 255], // Branco
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [230, 245, 225], // Verde claro JBS
      },
      margin: { left: marginX, right: marginX },
    })
    currentY = (doc as any).autoTable.previous.finalY + 15 // Atualiza Y após a tabela de resumo e adiciona mais espaço

    // --- Tabela Detalhada de Veículos ---
    doc.setFontSize(18)
    doc.setTextColor(42, 59, 143) // JBS Blue
    doc.text("Detalhes Completos dos Veículos", pageCenterX, currentY, { align: "center" })
    currentY += 8

    // Preparar dados da tabela principal
    const head = [
      [
        "Placa",
        "Status",
        "Doca",
        "Temp.",
        "Lacre",
        "N° Cont.",
        "Perfil",
        "N° Carga",
        "Agendamento",
        "Chegada",
        "Motorista",
        "Telefone",
        "Transportadora",
      ],
    ]
    const body = vehicles.map((v) => [
      v.plate,
      v.status,
      v.dock,
      v.temperature,
      v.seal,
      v.vehicleProfile === "Contêiner" ? v.containerNumber : "-",
      v.vehicleProfile,
      v.loadNumber || "-",
      v.scheduledDate,
      v.arrivalDate,
      v.driverName || "N/A",
      v.driverPhone || "N/A",
      v.carrier || "N/A",
    ])
    console.log("Gerando tabela detalhada de veículos...")
    ;(doc as any).autoTable({
      startY: currentY, // Inicia a tabela abaixo do cabeçalho dinamicamente
      head: head,
      body: body,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: "center",
        textColor: [0, 0, 0], // Preto para o texto do corpo
      },
      headStyles: {
        fillColor: [42, 59, 143], // JBS Blue (RGB)
        textColor: [255, 255, 255], // Texto branco
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [230, 245, 225], // Um verde bem claro para linhas alternadas
      },
      columnStyles: {
        0: { halign: "left" }, // Placa alinhada à esquerda
      },
      margin: { left: marginX, right: marginX },
      didDrawPage: (data: any) => {
        // Rodapé
        const str = "Página " + doc.internal.getNumberOfPages()
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100) // Cinza para o rodapé
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10)
      },
    })

    console.log("Salvando PDF...")
    doc.save("relatorio_veiculos.pdf")
    console.log("PDF salvo com sucesso.")
  } catch (error: any) {
    console.error("Erro fatal ao gerar relatório PDF:", error)
    let errorMessage = "Ocorreu um erro inesperado ao criar o relatório PDF."

    if (error instanceof Error) {
      errorMessage = error.message
      console.error("Detalhes do erro (Error object):", error.message)
      console.error("Stack trace (Error object):", error.stack)
    } else if (error && typeof error === "object" && "isTrusted" in error && error.isTrusted) {
      errorMessage = "Falha na geração do PDF: Um evento de erro interno foi disparado."
      console.error(
        "Erro capturado é um evento DOM (isTrusted=true). Possível causa: falha de carregamento ou renderização interna.",
        error,
      )
    } else if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as any).message
      console.error("Detalhes do erro (Object with message):", (error as any).message)
    } else {
      console.error("Erro de tipo desconhecido:", error)
    }

    toast({
      title: "Erro ao gerar PDF",
      description: errorMessage,
      variant: "destructive",
    })
  }
}

// --- NOVAS FUNÇÕES DE GERAÇÃO DE RELATÓRIOS PARA ANOMALIAS (LISTA COMPLETA) ---

// Gerador de Relatório WhatsApp (Anomalias)
export const generateAnomalyWhatsappReport = (anomalies: Anomaly[]) => {
  let message = "Relatório de Anomalias:\n\n"
  if (anomalies.length === 0) {
    message += "Nenhuma anomalia registrada."
  } else {
    anomalies.forEach((a, index) => {
      message += `${index + 1}. Placa: ${a.plate}, Tipo: ${a.anomalyType}, Motivo: ${a.reasonDescription.substring(0, 50)}...
`
    })
  }
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, "_blank")
}

// Gerador de Relatório E-mail (Anomalias)
export const generateAnomalyEmailReport = (anomalies: Anomaly[]) => {
  const subject = "Relatório Detalhado de Anomalias"
  let body = "Prezado(a),\n\nSegue o relatório detalhado das anomalias:\n\n"
  if (anomalies.length === 0) {
    body += "Nenhuma anomalia registrada."
  } else {
    anomalies.forEach((a, index) => {
      body += `Anomalia ${index + 1}:\n`
      body += `  Placa: ${a.plate}\n`
      body += `  N° Carga: ${a.loadNumber || "Não informado"}\n`
      body += `  Código Produto: ${a.productCode}\n`
      body += `  Descrição Produto: ${a.productDescription}\n` // NOVO CAMPO
      body += `  Nota Fiscal: ${a.invoiceNumber}\n` // NOVO CAMPO
      body += `  CIF: ${a.cif}\n`
      body += `  Origem da Carga: ${a.originName}\n` // RENOMEADO
      body += `  Quantidade Cx: ${a.quantity}\n`
      body += `  Peso (kg): ${a.weight}\n`
      body += `  Tipo de Anomalia: ${a.anomalyType}\n`
      body += `  Motivo: ${a.reasonDescription}\n`
      body += `  Data Registro: ${format(parseISO(a.registrationDate), "dd/MM/yyyy HH:mm")}\n\n`
    })
  }
  body += "\nAtenciosamente,\nSua Equipe"

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoUrl, "_blank")
}

// Gerador de Relatório TXT (Anomalias)
export const generateAnomalyTxtReport = (anomalies: Anomaly[]) => {
  let content = "Relatório Detalhado de Anomalias\n\n"
  if (anomalies.length === 0) {
    content += "Nenhuma anomalia registrada."
  } else {
    anomalies.forEach((a, index) => {
      content += `--- Anomalia ${index + 1} ---\n`
      content += `Placa: ${a.plate}\n`
      content += `N° Carga: ${a.loadNumber || "Não informado"}\n`
      content += `Código Produto: ${a.productCode}\n`
      content += `Descrição Produto: ${a.productDescription}\n` // NOVO CAMPO
      content += `Nota Fiscal: ${a.invoiceNumber}\n` // NOVO CAMPO
      content += `CIF: ${a.cif}\n`
      content += `Origem da Carga: ${a.originName}\n` // RENOMEADO
      content += `Quantidade Cx: ${a.quantity}\n`
      content += `Peso (kg): ${a.weight}\n`
      content += `Tipo de Anomalia: ${a.anomalyType}\n`
      content += `Motivo: ${a.reasonDescription}\n`
      content += `Data Registro: ${format(parseISO(a.registrationDate), "dd/MM/yyyy HH:mm")}\n`
      content += "-----------------------\n\n"
    })
  }
  downloadFile(content, "relatorio_anomalias.txt", "text/plain")
}

// Gerador de Relatório Excel (CSV) (Anomalias)
export const generateAnomalyExcelReport = (anomalies: Anomaly[]) => {
  const headers = [
    "Placa",
    "N° Carga",
    "Código Produto",
    "Descrição Produto", // NOVO CAMPO
    "Nota Fiscal", // NOVO CAMPO
    "CIF",
    "Origem da Carga", // RENOMEADO
    "Quantidade Cx",
    "Peso (kg)",
    "Tipo Anomalia",
    "Motivo",
    "Data Registro",
  ]
  let csvContent = headers.join(";") + "\n"

  if (anomalies.length > 0) {
    anomalies.forEach((a) => {
      const row = [
        a.plate,
        a.loadNumber || "-",
        a.productCode,
        a.productDescription, // NOVO CAMPO
        a.invoiceNumber, // NOVO CAMPO
        a.cif,
        a.originName, // RENOMEADO
        a.quantity,
        a.weight,
        a.anomalyType,
        a.reasonDescription,
        format(parseISO(a.registrationDate), "dd/MM/yyyy HH:mm"),
      ]
      csvContent += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(";") + "\n"
    })
  }

  downloadFile(csvContent, "relatorio_anomalias.csv", "text/csv;charset=utf-8;")
}

// Gerador de Relatório PDF (Anomalias)
export const generateAnomalyPdfReport = async (anomalies: Anomaly[]) => {
  try {
    console.log("Iniciando geração do relatório PDF de anomalias...")

    const JsPdfConstructor = await getReadyJsPDF()
    const doc = new JsPdfConstructor()

    if (typeof (doc as any).autoTable !== "function") {
      throw new Error("Falha na geração do PDF: 'autoTable' não está disponível na instância do documento.")
    }

    let currentY = 10
    const pageCenterX = doc.internal.pageSize.width / 2
    const marginX = 15

    // Header
    const imgDataWithDimensions = await getBase64Image("/images/jbs-logo.png")
    if (imgDataWithDimensions) {
      const { data: imgData, width: imgWidth, height: imgHeight } = imgDataWithDimensions
      try {
        const desiredPdfWidth = 40
        const aspectRatio = imgWidth / imgHeight
        const calculatedPdfHeight = desiredPdfWidth / aspectRatio
        doc.addImage(imgData, "PNG", marginX, currentY, desiredPdfWidth, calculatedPdfHeight)
        currentY += calculatedPdfHeight + 5
      } catch (imgError) {
        console.error("Erro ao adicionar imagem ao PDF:", imgError)
        currentY = 10
      }
    } else {
      currentY = 10
    }

    doc.setFontSize(20)
    doc.setTextColor(42, 59, 143)
    doc.text("Relatório de Ocorrência de Anomalia", pageCenterX, currentY, { align: "center" })
    currentY += 8

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Data de Geração: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
      pageCenterX,
      currentY,
      { align: "center" },
    )
    currentY += 15

    doc.setDrawColor(42, 59, 143)
    doc.line(marginX, currentY, doc.internal.pageSize.width - marginX, currentY)
    currentY += 10

    // Anomaly Table
    doc.setFontSize(18)
    doc.setTextColor(42, 59, 143)
    doc.text("Detalhes das Anomalias", pageCenterX, currentY, { align: "center" })
    currentY += 8

    const head = [
      [
        "Placa",
        "N° Carga",
        "Cód. Prod.",
        "Desc. Prod.", // NOVO CAMPO
        "NF", // NOVO CAMPO
        "CIF",
        "Origem", // RENOMEADO
        "Qtd. Cx",
        "Peso (kg)",
        "Tipo Anomalia",
        "Motivo",
        "Data Registro",
      ],
    ]
    const body = anomalies.map((a) => [
      a.plate,
      a.loadNumber || "-",
      a.productCode,
      a.productDescription, // NOVO CAMPO
      a.invoiceNumber, // NOVO CAMPO
      a.cif,
      a.originName, // RENOMEADO
      a.quantity,
      a.weight,
      a.anomalyType,
      a.reasonDescription,
      format(parseISO(a.registrationDate), "dd/MM/yyyy HH:mm"),
    ])
    ;(doc as any).autoTable({
      startY: currentY,
      head: head,
      body: body,
      theme: "grid",
      styles: {
        fontSize: 6, // Smaller font size for more columns
        cellPadding: 1,
        halign: "center",
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [42, 59, 143],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [230, 245, 225],
      },
      columnStyles: {
        0: { halign: "left" },
        10: { cellWidth: 30, halign: "left" }, // Give more space to reason description
      },
      margin: { left: marginX, right: marginX },
      didDrawPage: (data: any) => {
        const str = "Página " + doc.internal.getNumberOfPages()
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10)
      },
    })

    doc.save("relatorio_anomalias.pdf")
  } catch (error: any) {
    console.error("Erro fatal ao gerar relatório PDF de anomalias:", error)
    let errorMessage = "Ocorreu um erro inesperado ao criar o relatório PDF de anomalias."

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as any).message
    }

    toast({
      title: "Erro ao gerar PDF de Anomalias",
      description: errorMessage,
      variant: "destructive",
    })
  }
}

// --- NOVAS FUNÇÕES DE GERAÇÃO DE RELATÓRIOS PARA ANOMALIAS (ANOMALIA ÚNICA) ---

export const generateSingleAnomalyWhatsappReport = (anomaly: Anomaly) => {
  let message = `Relatório de Ocorrência - Anomalia\n\n`
  message += `Placa: ${anomaly.plate}\n`
  message += `N° Carga: ${anomaly.loadNumber || "Não informado"}\n`
  message += `Cód. Produto: ${anomaly.productCode}\n`
  message += `Desc. Produto: ${anomaly.productDescription}\n`
  message += `Nota Fiscal: ${anomaly.invoiceNumber}\n`
  message += `CIF: ${anomaly.cif}\n`
  message += `Origem da Carga: ${anomaly.originName}\n`
  message += `Quantidade Cx: ${anomaly.quantity}\n`
  message += `Peso (kg): ${anomaly.weight}\n`
  message += `Tipo de Anomalia: ${anomaly.anomalyType}\n`
  message += `Motivo: ${anomaly.reasonDescription}\n`
  message += `Data Registro: ${format(parseISO(anomaly.registrationDate), "dd/MM/yyyy HH:mm")}\n`

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, "_blank")
}

export const generateSingleAnomalyEmailReport = (anomaly: Anomaly) => {
  const subject = `Relatório de Ocorrência - Anomalia na Placa ${anomaly.plate}`
  let body = `Prezado(a),\n\nSegue o relatório de ocorrência para a anomalia registrada:\n\n`
  body += `Placa: ${anomaly.plate}\n`
  body += `N° Carga: ${anomaly.loadNumber || "Não informado"}\n`
  body += `Código Produto: ${anomaly.productCode}\n`
  body += `Descrição Produto: ${anomaly.productDescription}\n`
  body += `Nota Fiscal: ${anomaly.invoiceNumber}\n`
  body += `CIF: ${anomaly.cif}\n`
  body += `Origem da Carga: ${anomaly.originName}\n`
  body += `Quantidade Cx: ${anomaly.quantity}\n`
  body += `Peso (kg): ${anomaly.weight}\n`
  body += `Tipo de Anomalia: ${anomaly.anomalyType}\n`
  body += `Motivo: ${anomaly.reasonDescription}\n`
  body += `Data Registro: ${format(parseISO(anomaly.registrationDate), "dd/MM/yyyy HH:mm")}\n\n`
  body += `Atenciosamente,\nSua Equipe`

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoUrl, "_blank")
}

export const generateSingleAnomalyTxtReport = (anomaly: Anomaly) => {
  let content = `Relatório de Ocorrência - Anomalia\n\n`
  content += `Placa: ${anomaly.plate}\n`
  content += `N° Carga: ${anomaly.loadNumber || "Não informado"}\n`
  content += `Código Produto: ${anomaly.productCode}\n`
  content += `Descrição Produto: ${anomaly.productDescription}\n`
  content += `Nota Fiscal: ${anomaly.invoiceNumber}\n`
  content += `CIF: ${anomaly.cif}\n`
  content += `Origem da Carga: ${anomaly.originName}\n`
  content += `Quantidade Cx: ${anomaly.quantity}\n`
  content += `Peso (kg): ${anomaly.weight}\n`
  content += `Tipo de Anomalia: ${anomaly.anomalyType}\n`
  content += `Motivo: ${anomaly.reasonDescription}\n`
  content += `Data Registro: ${format(parseISO(anomaly.registrationDate), "dd/MM/yyyy HH:mm")}\n`

  downloadFile(content, `ocorrencia_anomalia_${anomaly.plate}.txt`, "text/plain")
}

export const generateSingleAnomalyExcelReport = (anomaly: Anomaly) => {
  const headers = [
    "Placa",
    "N° Carga",
    "Código Produto",
    "Descrição Produto",
    "Nota Fiscal",
    "CIF",
    "Origem da Carga",
    "Quantidade Cx",
    "Peso (kg)",
    "Tipo Anomalia",
    "Motivo",
    "Data Registro",
  ]
  let csvContent = headers.join(";") + "\n"

  const row = [
    anomaly.plate,
    anomaly.loadNumber || "-",
    anomaly.productCode,
    anomaly.productDescription,
    anomaly.invoiceNumber,
    anomaly.cif,
    anomaly.originName,
    anomaly.quantity,
    anomaly.weight,
    anomaly.anomalyType,
    anomaly.reasonDescription,
    format(parseISO(anomaly.registrationDate), "dd/MM/yyyy HH:mm"),
  ]
  csvContent += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(";") + "\n"

  downloadFile(csvContent, `ocorrencia_anomalia_${anomaly.plate}.csv`, "text/csv;charset=utf-8;")
}

export const generateSingleAnomalyPdfReport = async (anomaly: Anomaly) => {
  try {
    console.log("Iniciando geração do relatório PDF de ocorrência de anomalia...")

    const JsPdfConstructor = await getReadyJsPDF()
    const doc = new JsPdfConstructor()

    if (typeof (doc as any).autoTable !== "function") {
      throw new Error("Falha na geração do PDF: 'autoTable' não está disponível na instância do documento.")
    }

    let currentY = 10
    const pageCenterX = doc.internal.pageSize.width / 2
    const marginX = 15

    // Header
    const imgDataWithDimensions = await getBase64Image("/images/jbs-logo.png")
    if (imgDataWithDimensions) {
      const { data: imgData, width: imgWidth, height: imgHeight } = imgDataWithDimensions
      try {
        const desiredPdfWidth = 40
        const aspectRatio = imgWidth / imgHeight
        const calculatedPdfHeight = desiredPdfWidth / aspectRatio
        doc.addImage(imgData, "PNG", marginX, currentY, desiredPdfWidth, calculatedPdfHeight)
        currentY += calculatedPdfHeight + 5
      } catch (imgError) {
        console.error("Erro ao adicionar imagem ao PDF:", imgError)
        currentY = 10
      }
    } else {
      currentY = 10
    }

    doc.setFontSize(20)
    doc.setTextColor(42, 59, 143)
    doc.text("Relatório de Ocorrência de Anomalia", pageCenterX, currentY, { align: "center" })
    currentY += 8

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Data de Geração: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
      pageCenterX,
      currentY,
      { align: "center" },
    )
    currentY += 15

    doc.setDrawColor(42, 59, 143)
    doc.line(marginX, currentY, doc.internal.pageSize.width - marginX, currentY)
    currentY += 10

    // Anomaly Details
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Placa: ${anomaly.plate}`, marginX, currentY)
    currentY += 7
    doc.text(`N° Carga: ${anomaly.loadNumber || "Não informado"}`, marginX, currentY)
    currentY += 7
    doc.text(`Código do Produto: ${anomaly.productCode}`, marginX, currentY)
    currentY += 7
    doc.text(`Descrição do Produto: ${anomaly.productDescription}`, marginX, currentY)
    currentY += 7
    doc.text(`Nota Fiscal: ${anomaly.invoiceNumber}`, marginX, currentY)
    currentY += 7
    doc.text(`CIF: ${anomaly.cif}`, marginX, currentY)
    currentY += 7
    doc.text(`Origem da Carga: ${anomaly.originName}`, marginX, currentY)
    currentY += 7
    doc.text(`Quantidade Cx: ${anomaly.quantity}`, marginX, currentY)
    currentY += 7
    doc.text(`Peso (kg): ${anomaly.weight}`, marginX, currentY)
    currentY += 7
    doc.text(`Tipo de Anomalia: ${anomaly.anomalyType}`, marginX, currentY)
    currentY += 7
    doc.text(`Data de Registro: ${format(parseISO(anomaly.registrationDate), "dd/MM/yyyy HH:mm")}`, marginX, currentY)
    currentY += 10

    doc.setFontSize(14)
    doc.setTextColor(42, 59, 143)
    doc.text("Motivo da Anomalia:", marginX, currentY)
    currentY += 7
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    const splitReason = doc.splitTextToSize(anomaly.reasonDescription, doc.internal.pageSize.width - 2 * marginX)
    doc.text(splitReason, marginX, currentY)
    currentY += splitReason.length * 7 + 10 // Adjust Y based on text height

    doc.save(`ocorrencia_anomalia_${anomaly.plate}.pdf`)
  } catch (error: any) {
    console.error("Erro fatal ao gerar relatório PDF de ocorrência de anomalia:", error)
    let errorMessage = "Ocorreu um erro inesperado ao criar o relatório PDF de ocorrência."

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as any).message
    }

    toast({
      title: "Erro ao gerar PDF de Ocorrência",
      description: errorMessage,
      variant: "destructive",
    })
  }
}
