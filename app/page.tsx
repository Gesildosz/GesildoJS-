"use client" // Este componente precisa ser cliente para usar useState

import { useState, useEffect } from "react" // Importa useEffect
import Image from "next/image" // Importa o componente Image do Next.js
import Link from "next/link" // Importa Link para navegação
import { useRouter } from "next/navigation" // Import useRouter
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VehicleForm } from "@/components/vehicle-form"
import { VehicleList } from "@/components/vehicle-list" // Importa o componente de lista
import { Truck, ParkingSquare, TruckIcon as TruckLoading, CheckCircle, History } from "lucide-react" // Importa History icon
import { cn } from "@/lib/utils" // Importa a função cn para classes condicionais
import { format } from "date-fns" // Importa format para formatar a data
import { ptBR } from "date-fns/locale" // Importa o locale para português
import { QuickReportSidebar } from "@/components/quick-report-sidebar" // Importa o novo componente
import { StatusChangeDialog } from "@/components/status-change-dialog" // Importa o componente de diálogo de status
import { DriverRegistrationDialog } from "@/components/driver-registration-dialog" // Importa o novo componente de diálogo de motorista
import { DriverLookupDialog } from "@/components/driver-lookup-dialog" // Importa o novo componente de diálogo de consulta de motorista
import { toast } from "@/components/ui/use-toast" // Importa a função toast
import type { Anomaly } from "@/app/anomaly-registration/page" // IMPORTADO: Tipo Anomaly
import { AnomalyActionDialog } from "@/components/anomaly-action-dialog" // IMPORTADO: Novo diálogo de ação de anomalia
import { LoadingSplash } from "@/components/loading-splash" // NOVO: Importa o componente de splash screen

// Define o tipo para o status do veículo
type VehicleStatus = "patio" | "descarga" | "finalizado"

// Define o tipo para um objeto de veículo com os novos campos
export type Vehicle = {
  id: string // NOVO CAMPO: Identificador único para cada lançamento
  plate: string
  status: VehicleStatus
  dock: string
  temperature: string
  seal: string
  containerNumber: string
  vehicleProfile: string
  loadNumber: string
  scheduledDate: string
  arrivalDate: string // Novo campo para a data de chegada
  driverName?: string // Novo campo opcional
  driverPhone?: string // Novo campo opcional
  carrier?: string // Novo campo opcional
  hasAnomaly?: boolean // NOVO CAMPO: Indica se há anomalia na carga
}

export default function Component() {
  const router = useRouter() // Initialize useRouter

  // Estado para armazenar a lista de veículos
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]) // NOVO ESTADO: Para carregar anomalias
  const [currentDateTime, setCurrentDateTime] = useState("")

  // Estados para o pop-up de mudança de status
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [statusDialogFilterCategory, setStatusDialogFilterCategory] = useState<string>("")

  // Estados para o pop-up de cadastro de motorista (quando a placa é nova)
  const [isDriverRegistrationDialogOpen, setIsDriverRegistrationDialogOpen] = useState(false)
  const [plateForDriverRegistration, setPlateForDriverRegistration] = useState<string>("")

  // Estados para o pop-up de consulta de motorista (novo)
  const [isDriverLookupDialogOpen, setIsDriverLookupDialogOpen] = useState(false)

  // Estado para controlar a placa no formulário principal
  const [currentFormPlate, setCurrentFormPlate] = useState<string>("")

  // NOVO ESTADO: Armazena temporariamente os detalhes do motorista para uma nova placa
  const [tempDriverDetails, setTempDriverDetails] = useState<{
    plate: string
    driverName: string
    driverPhone: string
    carrier: string
  } | null>(null)

  // NOVOS ESTADOS para o diálogo de ação de anomalia
  const [isAnomalyActionDialogOpen, setIsAnomalyActionDialogOpen] = useState(false)
  const [vehicleIdForAnomalyAction, setVehicleIdForAnomalyAction] = useState<string | null>(null)

  // NOVOS ESTADOS PARA A TELA DE CARREGAMENTO E MENSAGEM DE BOAS-VINDAS
  const [isLoading, setIsLoading] = useState(true)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)

  // Efeito para carregar veículos e anomalias do Local Storage ao montar o componente
  // E para gerenciar a tela de carregamento
  useEffect(() => {
    // Check sessionStorage for splash screen status
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash")

    if (hasSeenSplash) {
      // If already seen in this session, skip splash screen
      setIsLoading(false)
    } else {
      // If not seen, show splash screen and set flag after animation
      const splashDuration = 5000 // 5 segundos como solicitado
      const timer = setTimeout(() => {
        setIsLoading(false) // Esconde a tela de carregamento
        setShowWelcomeMessage(true) // Ativa a exibição da mensagem de boas-vindas
        sessionStorage.setItem("hasSeenSplash", "true") // Marca que a splash foi vista
      }, splashDuration)

      return () => clearTimeout(timer) // Limpa o timer se o componente for desmontado
    }

    // Existing logic for loading vehicles and anomalies
    const storedVehicles = localStorage.getItem("vehicles")
    if (storedVehicles) {
      setVehicles(JSON.parse(storedVehicles))
    }
    const storedAnomalies = localStorage.getItem("anomalies")
    if (storedAnomalies) {
      setAnomalies(JSON.parse(storedAnomalies))
    }
  }, [])

  // Efeito para mostrar o toast de boas-vindas após o carregamento
  useEffect(() => {
    if (showWelcomeMessage) {
      toast({
        title: "Bem-vindo(a)!",
        description: "Sistema de Carga e Descarga SSA BH. 910 carregado com sucesso.",
        duration: 3000, // Mostra a mensagem de boas-vindas por 3 segundos
      })
      setShowWelcomeMessage(false) // Reseta para evitar que a mensagem seja exibida novamente
    }
  }, [showWelcomeMessage])

  // Efeito para salvar veículos e anomalias no Local Storage sempre que a lista for atualizada
  useEffect(() => {
    localStorage.setItem("vehicles", JSON.stringify(vehicles))
  }, [vehicles])

  useEffect(() => {
    localStorage.setItem("anomalies", JSON.stringify(anomalies)) // Salva anomalias
  }, [anomalies])

  useEffect(() => {
    // Função para atualizar a data e hora
    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy HH:mm:ss", { locale: ptBR }))
    }

    // Define a data e hora inicial
    updateDateTime()

    // Atualiza a data e hora a cada segundo
    const intervalId = setInterval(updateDateTime, 1000)

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId)
  }, [])

  // Função para adicionar ou atualizar um veículo
  const addOrUpdateVehicle = (newVehicleData: Omit<Vehicle, "id">) => {
    setVehicles((prevVehicles) => {
      // Encontra o índice de um veículo *ativo* (não finalizado) com a mesma placa
      const existingActiveVehicleIndex = prevVehicles.findIndex(
        (v) => v.plate === newVehicleData.plate && (v.status === "patio" || v.status === "descarga"),
      )

      let vehicleToSave: Vehicle
      const updatedVehicles = [...prevVehicles]

      if (existingActiveVehicleIndex > -1) {
        // Se um veículo ativo com a mesma placa for encontrado, atualiza seu registro
        const existingVehicle = updatedVehicles[existingActiveVehicleIndex]
        vehicleToSave = {
          ...existingVehicle, // Mantém o ID existente
          ...newVehicleData, // Sobrescreve com os novos dados do formulário
          // Preserva os detalhes do motorista do veículo existente,
          // a menos que tempDriverDetails seja para esta placa (fluxo de novo cadastro de motorista)
          driverName:
            tempDriverDetails?.plate === newVehicleData.plate
              ? tempDriverDetails.driverName
              : existingVehicle.driverName,
          driverPhone:
            tempDriverDetails?.plate === newVehicleData.plate
              ? tempDriverDetails.driverPhone
              : existingVehicle.driverPhone,
          carrier:
            tempDriverDetails?.plate === newVehicleData.plate ? tempDriverDetails.carrier : existingVehicle.carrier,
        }
        updatedVehicles[existingActiveVehicleIndex] = vehicleToSave
      } else {
        // Se não houver veículo ativo com a mesma placa (placa nova ou último lançamento finalizado),
        // cria um novo lançamento para este evento de descarga.
        vehicleToSave = {
          id: Date.now().toString(), // Gera um novo ID único para este evento de descarga
          ...newVehicleData,
          // Aplica tempDriverDetails se disponível para esta placa, caso contrário, undefined
          driverName: tempDriverDetails?.plate === newVehicleData.plate ? tempDriverDetails.driverName : undefined,
          driverPhone: tempDriverDetails?.plate === newVehicleData.plate ? tempDriverDetails.driverPhone : undefined,
          carrier: tempDriverDetails?.plate === newVehicleData.plate ? tempDriverDetails.carrier : undefined,
        }
        updatedVehicles.push(vehicleToSave)
      }

      // Handle redirection for anomaly registration
      if (vehicleToSave.hasAnomaly) {
        router.push(`/anomaly-registration?vehicleId=${vehicleToSave.id}`)
      }

      return updatedVehicles
    })
    setTempDriverDetails(null) // Limpa os detalhes temporários do motorista após o uso
    setCurrentFormPlate("")
  }

  // Função para atualizar um veículo existente na lista (usada pela tabela e pelos diálogos)
  const updateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles((prevVehicles) => prevVehicles.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)))
  }

  // Nova função para remover um veículo
  const handleDeleteVehicle = (idToRemove: string) => {
    setVehicles((prevVehicles) => prevVehicles.filter((v) => v.id !== idToRemove))
  }

  // Nova função para atualizar os detalhes do motorista
  const handleUpdateDriverDetails = (plate: string, driverName: string, driverPhone: string, carrier: string) => {
    setVehicles((prevVehicles) =>
      prevVehicles.map((v) =>
        v.plate === plate
          ? {
              ...v,
              driverName,
              driverPhone,
              carrier,
            }
          : v,
      ),
    )
  }

  // Calcula a contagem para cada status
  const patioCount = vehicles.filter((v) => v.status === "patio").length
  const descargaCount = vehicles.filter((v) => v.status === "descarga").length
  const finalizadoCount = vehicles.filter((v) => v.status === "finalizado").length

  // Calcula a contagem para cada tipo de temperatura/perfil
  const resfriadoCount = vehicles.filter((v) => v.temperature === "Resfriado").length
  const congeladoCount = vehicles.filter((v) => v.temperature === "Congelado").length
  const festivoCount = vehicles.filter((v) => v.temperature === "Festivo").length // Assumindo "Festivo" como temperatura

  // Função para lidar com o clique nos cartões e abrir o diálogo de status
  const handleCardClick = (category: string) => {
    setStatusDialogFilterCategory(category)
    setIsStatusDialogOpen(true)
  }

  // Função para fechar o diálogo de status
  const handleCloseStatusDialog = () => {
    setIsStatusDialogOpen(false)
    setStatusDialogFilterCategory("")
  }

  // Função chamada quando uma nova placa é detectada no VehicleForm
  const handleNewPlateDetected = (plate: string) => {
    setPlateForDriverRegistration(plate)
    setIsDriverRegistrationDialogOpen(true)
  }

  // Função para registrar os detalhes do motorista e NÃO adicionar o veículo ainda
  const handleRegisterDriverDetails = (plate: string, driverName: string, driverPhone: string, carrier: string) => {
    // Armazena os detalhes do motorista temporariamente
    setTempDriverDetails({ plate: plate.toUpperCase(), driverName, driverPhone, carrier })

    setCurrentFormPlate(plate.toUpperCase()) // Preenche o formulário principal com a nova placa
    setIsDriverRegistrationDialogOpen(false) // Fecha o diálogo de motorista
    toast({
      title: "Motorista Cadastrado!",
      description: `Dados do motorista para a placa ${plate.toUpperCase()} registrados.`,
      variant: "default",
    })
    // Adiciona um novo toast para guiar o usuário a continuar o preenchimento
    toast({
      title: "Continue o Cadastro do Veículo",
      description: `Agora, por favor, preencha os detalhes restantes para a placa ${plate.toUpperCase()} e clique em "Salvar Veículo".`,
      variant: "success", // Use uma variante que chame a atenção
      duration: 5000, // Mantém a mensagem por mais tempo
    })
  }

  // Função para lidar com o duplo clique na linha da tabela
  const handleRowDoubleClick = (vehicleId: string) => {
    // Verifica se já existem anomalias para este vehicleId
    const existingAnomaliesForVehicle = anomalies.filter((a) => a.vehicleId === vehicleId)

    if (existingAnomaliesForVehicle.length > 0) {
      setVehicleIdForAnomalyAction(vehicleId)
      setIsAnomalyActionDialogOpen(true) // Abre o novo diálogo de escolha
    } else {
      router.push(`/anomaly-registration?vehicleId=${vehicleId}`)
    }
  }

  // Função para lidar com a escolha do usuário no diálogo de ação de anomalia
  const handleAnomalyActionChoice = (action: "new" | "edit") => {
    if (!vehicleIdForAnomalyAction) return

    setIsAnomalyActionDialogOpen(false) // Fecha o diálogo

    if (action === "new") {
      router.push(`/anomaly-registration?vehicleId=${vehicleIdForAnomalyAction}`)
    } else if (action === "edit") {
      router.push(`/anomaly-report-by-vehicle?vehicleId=${vehicleIdForAnomalyAction}`) // Redireciona para a nova página
    }
    setVehicleIdForAnomalyAction(null) // Limpa o ID do veículo
  }

  // Renderiza a tela de carregamento se isLoading for true
  if (isLoading) {
    return <LoadingSplash onAnimationEnd={() => setIsLoading(false)} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-jbs">
      {/* Header Section */}
      <header className="w-full p-4 border-b bg-white text-jbs-blue shadow-sm">
        <div className="container mx-auto flex flex-col items-center md:flex-row md:justify-between">
          <div className="text-center md:text-left flex items-start gap-2">
            {" "}
            {/* Alterado para items-start */}
            <Image
              src="/images/jbs-logo.png"
              alt="Logotipo JBS"
              width={70} // Aumentado para 70
              height={70} // Aumentado para 70
              className="h-auto" // Garante que a altura seja ajustada automaticamente
            />
            <div>
              <h1 className="text-xl font-bold">Recebimento - 910 SSA</h1>
              <p className="text-sm text-jbs-blue/80">{currentDateTime}</p>
            </div>
          </div>
          <nav className="flex space-x-4 md:ml-auto items-center">
            <Link href="#" className="hover:text-jbs-green transition-colors">
              Início
            </Link>
            <Link href="/history" className="hover:text-jbs-green transition-colors flex items-center gap-1">
              <History className="h-4 w-4" /> Histórico
            </Link>
            <Link href="/monitoring" className="hover:text-jbs-green transition-colors">
              {" "}
              {/* ATUALIZADO */}
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
        {/* Título da Seção de Cartões */}
        <h2 className="text-xl font-bold text-center mb-4 text-jbs-blue">Visão Recebimento 910</h2>
        <div className="grid gap-4 grid-cols-3 items-start">
          {/* Card 1: Pátio */}
          <Card
            className={cn(
              "w-full h-40 flex flex-col items-center justify-start bg-card border-2 border-jbs-blue shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
            )}
            onClick={() => handleCardClick("patio")} // Abre o diálogo
          >
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-lg font-semibold text-center whitespace-nowrap text-jbs-blue">Pátio</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 flex flex-col items-center justify-center gap-2">
              <div className="text-5xl font-bold text-jbs-blue">{patioCount > 0 ? patioCount : null}</div>
              <ParkingSquare
                className={cn(
                  "h-8 w-8",
                  patioCount > 0 ? "text-jbs-green" : "text-jbs-blue/50", // Cor do ícone ajustada
                )}
              />
            </CardContent>
          </Card>
          {/* Card 2: Descarga */}
          <Card
            className={cn(
              "w-full h-40 flex flex-col items-center justify-start bg-card border-2 border-jbs-blue shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
            )}
            onClick={() => handleCardClick("descarga")} // Abre o diálogo
          >
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-lg font-semibold text-center whitespace-nowrap text-jbs-blue">
                Descarga
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 flex flex-col items-center justify-center gap-2">
              <div className="text-5xl font-bold text-jbs-blue">{descargaCount > 0 ? descargaCount : null}</div>
              <TruckLoading
                className={cn(
                  "h-8 w-8",
                  descargaCount > 0 ? "text-jbs-green" : "text-jbs-blue/50", // Cor do ícone ajustada
                )}
              />
            </CardContent>
          </Card>
          {/* Card 3: Finalizado */}
          <Card
            className={cn(
              "w-full h-40 flex flex-col items-center justify-start bg-card border-2 border-jbs-blue shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
            )}
            onClick={() => handleCardClick("finalizado")} // Abre o diálogo
          >
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-lg font-semibold text-center whitespace-nowrap text-jbs-blue">
                Finalizado
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 flex flex-col items-center justify-center gap-2">
              <div className="text-5xl font-bold text-jbs-blue">{finalizadoCount > 0 ? finalizadoCount : null}</div>
              <CheckCircle
                className={cn(
                  "h-8 w-8",
                  finalizadoCount > 0 ? "text-jbs-green" : "text-jbs-blue/50", // Cor do ícone ajustada
                )}
              />
            </CardContent>
          </Card>
        </div>
        {/* Linha Separadora */}
        <div className="w-full h-px bg-jbs-blue mt-8 mb-4" />

        {/* Novos Cartões: Resfriado, Congelado, Festivo */}
        <h2 className="text-xl font-bold text-center mb-4 text-jbs-blue">Visão por Temperatura/Tipo</h2>
        <div className="grid gap-4 grid-cols-3 items-start mb-8">
          {/* Card: Resfriado */}
          <Card
            className={cn(
              "w-full h-40 flex flex-col items-center justify-start bg-card border-2 border-jbs-blue shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
            )}
            onClick={() => handleCardClick("Resfriado")} // Abre o diálogo
          >
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-lg font-semibold text-center whitespace-nowrap text-jbs-blue">
                Resfriado
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 flex flex-col items-center justify-center gap-2">
              <div className="text-5xl font-bold text-jbs-blue">{resfriadoCount > 0 ? resfriadoCount : null}</div>
              <Truck
                className={cn(
                  "h-8 w-8",
                  resfriadoCount > 0 ? "text-jbs-green" : "text-jbs-blue/50", // Cor do ícone ajustada
                )}
              />
            </CardContent>
          </Card>
          {/* Card: Congelado */}
          <Card
            className={cn(
              "w-full h-40 flex flex-col items-center justify-start bg-card border-2 border-jbs-blue shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
            )}
            onClick={() => handleCardClick("Congelado")} // Abre o diálogo
          >
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-lg font-semibold text-center whitespace-nowrap text-jbs-blue">
                Congelado
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 flex flex-col items-center justify-center gap-2">
              <div className="text-5xl font-bold text-jbs-blue">{congeladoCount > 0 ? congeladoCount : null}</div>
              <Truck
                className={cn(
                  "h-8 w-8",
                  congeladoCount > 0 ? "text-jbs-green" : "text-jbs-blue/50", // Cor do ícone ajustada
                )}
              />
            </CardContent>
          </Card>
          {/* Card: Festivo */}
          <Card
            className={cn(
              "w-full h-40 flex flex-col items-center justify-start bg-card border-2 border-jbs-blue shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
            )}
            onClick={() => handleCardClick("Festivo")} // Abre o diálogo
          >
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-lg font-semibold text-center whitespace-nowrap text-jbs-blue">
                Festivo
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 flex flex-col items-center justify-center gap-2">
              <div className="text-5xl font-bold text-jbs-blue">{festivoCount > 0 ? festivoCount : null}</div>
              <Truck
                className={cn(
                  "h-8 w-8",
                  festivoCount > 0 ? "text-jbs-green" : "text-jbs-blue/50", // Cor do ícone ajustada
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Novo Título para a Tabela */}
        <h3 className="text-lg font-bold text-center mb-4 text-jbs-blue">Detalhes dos Veículos</h3>
        {/* Tabela de Acompanhamento - Passa a função de atualização e exclusão */}
        <VehicleList
          vehicles={vehicles}
          onUpdateVehicle={updateVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onRowDoubleClick={handleRowDoubleClick} // ADICIONADO: Passa a função de duplo clique
        />
        {/* Formulário de Veículo - Passa a função de atualização (agora abaixo da tabela) */}
        <div className="mt-8">
          <VehicleForm
            onVehicleSubmit={addOrUpdateVehicle}
            vehicles={vehicles} // Passa a lista de veículos para verificação
            onNewPlateDetected={handleNewPlateDetected} // Passa a função para abrir o diálogo de motorista
            onOpenDriverLookup={() => setIsDriverLookupDialogOpen(true)} // Passa a função para abrir o diálogo de consulta
            plate={currentFormPlate} // Controla a placa do formulário
            setPlate={setCurrentFormPlate} // Permite que o formulário atualize a placa
          />
        </div>
      </main>

      {/* Barra Lateral de Relatórios Rápidos - Passa a lista de veículos e as contagens */}
      <QuickReportSidebar
        vehicles={vehicles}
        patioCount={patioCount}
        descargaCount={descargaCount}
        finalizadoCount={finalizadoCount}
        resfriadoCount={resfriadoCount}
        congeladoCount={congeladoCount}
        festivoCount={festivoCount}
      />

      {/* Componente de Diálogo para Mudança de Status */}
      <StatusChangeDialog
        isOpen={isStatusDialogOpen}
        onClose={handleCloseStatusDialog}
        vehicles={vehicles} // Passa a lista completa de veículos
        onUpdateVehicle={updateVehicle}
        filterCategory={statusDialogFilterCategory} // Passa a categoria do cartão clicado
      />

      {/* Novo Componente de Diálogo para Cadastro de Motorista */}
      <DriverRegistrationDialog
        isOpen={isDriverRegistrationDialogOpen}
        onClose={() => setIsDriverRegistrationDialogOpen(false)}
        initialPlate={plateForDriverRegistration}
        onRegisterDriverDetails={handleRegisterDriverDetails}
      />

      {/* Novo Componente de Diálogo para Consulta de Motorista */}
      <DriverLookupDialog
        isOpen={isDriverLookupDialogOpen}
        onClose={() => setIsDriverLookupDialogOpen(false)}
        vehicles={vehicles}
        onUpdateDriverDetails={handleUpdateDriverDetails} // Passa a nova função de atualização
      />

      {/* NOVO Componente de Diálogo para Ação de Anomalia */}
      <AnomalyActionDialog
        isOpen={isAnomalyActionDialogOpen}
        onClose={() => setIsAnomalyActionDialogOpen(false)}
        vehicleId={vehicleIdForAnomalyAction || ""}
        onChoice={handleAnomalyActionChoice}
      />

      {/* Footer Section */}
      <footer className="w-full p-4 border-t bg-jbs-blue text-white text-center text-sm shadow-sm mt-auto">
        <div className="container mx-auto">
          <p>{"© 2025 Meu Aplicativo Responsivo. Todos os direitos reservados."}</p>
        </div>
      </footer>
    </div>
  )
}
