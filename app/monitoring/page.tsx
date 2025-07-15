"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"
import { useRouter } from "next/navigation" // Importa useRouter
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList, // Importa LabelList para exibir rótulos nas barras
} from "recharts" // Importa componentes do Recharts
import type { Vehicle } from "@/app/page" // Importa o tipo Vehicle
import type { Anomaly } from "@/app/anomaly-registration/page" // Importa o tipo Anomaly

export default function MonitoringPage() {
  const router = useRouter() // Inicializa useRouter
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]) // NOVO ESTADO para anomalias
  const [currentDateTime, setCurrentDateTime] = useState("")

  useEffect(() => {
    const storedVehicles = localStorage.getItem("vehicles")
    if (storedVehicles) {
      setVehicles(JSON.parse(storedVehicles))
    }

    const storedAnomalies = localStorage.getItem("anomalies") // Carrega anomalias
    if (storedAnomalies) {
      setAnomalies(JSON.parse(storedAnomalies))
    }

    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy HH:mm:ss", { locale: ptBR }))
    }
    updateDateTime()
    const intervalId = setInterval(updateDateTime, 1000)
    return () => clearInterval(intervalId)
  }, [])

  // --- Funções de Agregação de Dados para Gráficos ---

  // 1. Frequência de Placas
  const getPlateFrequencyData = () => {
    const plateCounts: { [key: string]: number } = {}
    vehicles.forEach((v) => {
      plateCounts[v.plate] = (plateCounts[v.plate] || 0) + 1
    })
    return Object.keys(plateCounts).map((plate) => ({
      plate,
      count: plateCounts[plate],
    }))
  }

  // 2. Anomalias por Placa
  const getAnomalyByPlateData = () => {
    const anomalyCounts: { [key: string]: number } = {}
    vehicles.forEach((v) => {
      if (v.hasAnomaly) {
        anomalyCounts[v.plate] = (anomalyCounts[v.plate] || 0) + 1
      }
    })
    return Object.keys(anomalyCounts).map((plate) => ({
      plate,
      anomalies: anomalyCounts[plate],
    }))
  }

  // 3. Distribuição de Status
  const getStatusDistributionData = () => {
    const statusCounts: { [key: string]: number } = {
      patio: 0,
      descarga: 0,
      finalizado: 0,
    }
    vehicles.forEach((v) => {
      statusCounts[v.status] = (statusCounts[v.status] || 0) + 1
    })
    return Object.keys(statusCounts).map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1), // Capitaliza a primeira letra
      value: statusCounts[status],
    }))
  }

  // 4. Distribuição por Temperatura/Tipo
  const getTemperatureDistributionData = () => {
    const tempCounts: { [key: string]: number } = {}
    vehicles.forEach((v) => {
      tempCounts[v.temperature] = (tempCounts[v.temperature] || 0) + 1
    })
    return Object.keys(tempCounts).map((temp) => ({
      name: temp,
      value: tempCounts[temp],
    }))
  }

  // 5. Distribuição por Perfil de Veículo
  const getVehicleProfileDistributionData = () => {
    const profileCounts: { [key: string]: number } = {}
    vehicles.forEach((v) => {
      profileCounts[v.vehicleProfile] = (profileCounts[v.vehicleProfile] || 0) + 1
    })
    return Object.keys(profileCounts).map((profile) => ({
      name: profile,
      value: profileCounts[profile],
    }))
  }

  // 6. Distribuição de Anomalias por Tipo (para o gráfico de barras com porcentagem)
  const getAnomalyTypeDistributionData = () => {
    const anomalyTypeCounts: { [key: string]: number } = {}
    anomalies.forEach((a) => {
      anomalyTypeCounts[a.anomalyType] = (anomalyTypeCounts[a.anomalyType] || 0) + 1
    })

    const totalAnomalies = anomalies.length
    if (totalAnomalies === 0) {
      return []
    }

    return Object.keys(anomalyTypeCounts).map((type) => ({
      name: type,
      count: anomalyTypeCounts[type],
      percentage: (anomalyTypeCounts[type] / totalAnomalies) * 100,
    }))
  }

  const plateFrequencyData = getPlateFrequencyData()
  const anomalyByPlateData = getAnomalyByPlateData()
  const statusDistributionData = getStatusDistributionData()
  const temperatureDistributionData = getTemperatureDistributionData()
  const vehicleProfileDistributionData = getVehicleProfileDistributionData()
  const anomalyTypeDistributionData = getAnomalyTypeDistributionData() // Dados para o novo gráfico de barras

  // Cores para os gráficos de pizza (ajustadas para a paleta JBS)
  const PIE_COLORS = ["#2A3B8F", "#68B34A", "#00ACC1", "#FFC107", "#FF5722", "#9C27B0"]

  // Função para lidar com o clique na barra
  const handleBarClick = (data: { name: string; count: number; percentage: number }) => {
    router.push(`/anomaly-details-by-type?type=${data.name}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-jbs">
      {/* Header Section */}
      <header className="w-full p-4 border-b bg-white text-jbs-blue shadow-sm">
        <div className="container mx-auto flex flex-col items-center md:flex-row md:justify-between">
          <div className="text-center md:text-left flex items-start gap-2">
            <Image src="/images/jbs-logo.png" alt="Logotipo JBS" width={70} height={70} className="h-auto" />
            <div>
              <h1 className="text-xl font-bold">Monitoramento de Veículos</h1>
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
        <h2 className="text-xl font-bold text-center mb-8 text-jbs-blue">Painel de Monitoramento</h2>

        {vehicles.length === 0 && anomalies.length === 0 ? (
          <Card className="w-full max-w-2xl mx-auto p-6 text-center text-muted-foreground">
            <CardTitle className="text-lg font-semibold text-jbs-blue mb-4">Nenhum Dado Disponível</CardTitle>
            <CardContent>
              <p>Não há veículos ou anomalias registradas para gerar os gráficos de monitoramento.</p>
              <p>Por favor, registre alguns veículos e anomalias na página inicial para ver os dados aqui.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gráfico 1: Frequência de Placas */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-jbs-blue">Frequência de Placas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={plateFrequencyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plate" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Registros" fill="#2A3B8F" /> {/* JBS Blue */}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico 2: Anomalias por Placa */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-jbs-blue">Anomalias por Placa</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Wrap the chart in a Link to the anomaly report page */}
                <Link href="/anomaly-report" className="block w-full h-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={anomalyByPlateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plate" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="anomalies" name="Anomalias" fill="#FF5722" />{" "}
                      {/* Laranja/Vermelho para anomalias */}
                    </BarChart>
                  </ResponsiveContainer>
                </Link>
              </CardContent>
            </Card>

            {/* Gráfico 3: Distribuição de Status */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-jbs-blue">Distribuição de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico 4: Distribuição por Temperatura/Tipo */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-jbs-blue">Distribuição por Temperatura</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={temperatureDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {temperatureDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico 5: Distribuição por Perfil de Veículo */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-jbs-blue">Distribuição por Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vehicleProfileDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {vehicleProfileDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico 6: Distribuição de Anomalias por Tipo (Bar Chart com Porcentagem) */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-jbs-blue">
                  Distribuição de Anomalias por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[300px]">
                {anomalies.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma anomalia registrada para exibir a distribuição.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={anomalyTypeDistributionData}
                      margin={{
                        top: 20, // Aumenta a margem superior para os rótulos de porcentagem
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} /> {/* Garante que o eixo Y mostre números inteiros */}
                      <Tooltip formatter={(value, name, props) => [`${props.payload.percentage.toFixed(1)}%`, name]} />{" "}
                      {/* Customiza o tooltip para mostrar a porcentagem */}
                      <Legend />
                      <Bar dataKey="count" name="N° Anomalias" fill="#FF5722" onClick={handleBarClick}>
                        <LabelList dataKey="percentage" position="top" formatter={(value) => `${value.toFixed(1)}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}
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
