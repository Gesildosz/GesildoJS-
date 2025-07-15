"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Home, Search, MessageSquareText, PhoneCall, Copy, Loader2, FileWarning } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Vehicle } from "@/app/page" // Importa o tipo Vehicle
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation" // Importa useRouter

export default function ContactPage() {
  const router = useRouter()
  const [currentDateTime, setCurrentDateTime] = useState("")
  const [searchPlate, setSearchPlate] = useState("")
  const [foundDriver, setFoundDriver] = useState<Vehicle | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    const storedVehicles = localStorage.getItem("vehicles")
    if (storedVehicles) {
      setVehicles(JSON.parse(storedVehicles))
    }

    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy HH:mm:ss", { locale: ptBR }))
    }
    updateDateTime()
    const intervalId = setInterval(updateDateTime, 1000)
    return () => clearInterval(intervalId)
  }, [])

  const cleanPhoneNumber = (phone: string | undefined) => {
    return phone ? phone.replace(/\D/g, "") : ""
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setFoundDriver(null) // Clear previous results

    if (!searchPlate.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma placa para buscar.",
        variant: "destructive",
      })
      setIsSearching(false)
      return
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    const plateToSearch = searchPlate.toUpperCase().trim()
    const found = vehicles.find((v) => v.plate === plateToSearch)

    if (found) {
      setFoundDriver(found)
      toast({
        title: "Motorista Encontrado!",
        description: `Detalhes para a placa ${plateToSearch} carregados.`,
        variant: "default",
      })
    } else {
      toast({
        title: "Não Encontrado",
        description: `Nenhum motorista encontrado para a placa ${plateToSearch}.`,
        variant: "destructive",
      })
    }
    setIsSearching(false)
  }

  const handleCopyDetails = () => {
    if (foundDriver) {
      const details = `
Placa: ${foundDriver.plate}
Nome: ${foundDriver.driverName || "Não informado"}
Telefone: ${foundDriver.driverPhone || "Não informado"}
Transportadora: ${foundDriver.carrier || "Não informado"}
      `.trim()
      navigator.clipboard
        .writeText(details)
        .then(() => {
          toast({
            title: "Detalhes Copiados!",
            description: "Os detalhes do motorista foram copiados para a área de transferência.",
          })
        })
        .catch((err) => {
          console.error("Failed to copy: ", err)
          toast({
            title: "Erro ao Copiar",
            description: "Não foi possível copiar os detalhes. Tente novamente.",
            variant: "destructive",
          })
        })
    }
  }

  const handleRegisterAnomaly = () => {
    if (foundDriver) {
      router.push(`/anomaly-registration?vehicleId=${foundDriver.id}`)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground font-jbs">
        {/* Header Section */}
        <header className="w-full p-4 border-b bg-white text-jbs-blue shadow-sm">
          <div className="container mx-auto flex flex-col items-center md:flex-row md:justify-between">
            <div className="text-center md:text-left flex items-start gap-2">
              <Image src="/images/jbs-logo.png" alt="Logotipo JBS" width={70} height={70} className="h-auto" />
              <div>
                <h1 className="text-xl font-bold">Central de Contato</h1>
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
              <Link href="/contact" className="hover:text-jbs-green transition-colors font-bold text-jbs-green">
                Contato
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 container mx-auto p-4 flex flex-col items-center">
          <h2 className="text-xl font-bold text-center mb-6 text-jbs-blue">Opções de Contato com Motoristas</h2>

          {/* Search Driver Card */}
          <Card className="w-full max-w-lg mx-auto mb-8 p-6 shadow-lg border-jbs-blue">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-semibold text-jbs-blue">Buscar Motorista por Placa</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSearch} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="searchPlate">Placa do Veículo</Label>
                  <Input
                    id="searchPlate"
                    type="text"
                    placeholder="Ex: ABC-1234"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-jbs-blue hover:bg-jbs-blue/90 text-white"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" /> Buscar Motorista
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Driver Details and Contact Options */}
          {foundDriver && (
            <Card className="w-full max-w-lg mx-auto p-6 shadow-lg border-jbs-green">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-semibold text-jbs-green">Detalhes do Motorista</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid gap-2 mb-4 text-gray-700">
                  <p>
                    <span className="font-medium text-jbs-blue">Placa:</span> {foundDriver.plate}
                  </p>
                  <p>
                    <span className="font-medium text-jbs-blue">Nome:</span>{" "}
                    {foundDriver.driverName || <span className="italic text-muted-foreground">Não informado</span>}
                  </p>
                  <p>
                    <span className="font-medium text-jbs-blue">Telefone:</span>{" "}
                    {foundDriver.driverPhone || <span className="italic text-muted-foreground">Não informado</span>}
                  </p>
                  <p>
                    <span className="font-medium text-jbs-blue">Transportadora:</span>{" "}
                    {foundDriver.carrier || <span className="italic text-muted-foreground">Não informado</span>}
                  </p>
                </div>

                <h3 className="text-md font-semibold text-jbs-blue mb-3">Opções de Contato</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-green-500 border-green-500 hover:bg-green-500/10 bg-transparent"
                        onClick={() =>
                          window.open(`https://wa.me/55${cleanPhoneNumber(foundDriver.driverPhone)}`, "_blank")
                        }
                        disabled={!foundDriver.driverPhone}
                        aria-label="Enviar WhatsApp"
                      >
                        <MessageSquareText className="mr-2 h-5 w-5" /> WhatsApp
                      </Button>
                    </TooltipTrigger>
                    {!foundDriver.driverPhone && <TooltipContent>Telefone não informado</TooltipContent>}
                  </Tooltip>

                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-blue-500 border-blue-500 hover:bg-blue-500/10 bg-transparent"
                        onClick={() => window.open(`tel:${cleanPhoneNumber(foundDriver.driverPhone)}`, "_self")}
                        disabled={!foundDriver.driverPhone}
                        aria-label="Ligar para o motorista"
                      >
                        <PhoneCall className="mr-2 h-5 w-5" /> Ligar
                      </Button>
                    </TooltipTrigger>
                    {!foundDriver.driverPhone && <TooltipContent>Telefone não informado</TooltipContent>}
                  </Tooltip>

                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-gray-700 border-gray-700 hover:bg-gray-700/10 bg-transparent"
                        onClick={() => window.open(`sms:${cleanPhoneNumber(foundDriver.driverPhone)}`, "_self")}
                        disabled={!foundDriver.driverPhone}
                        aria-label="Enviar SMS"
                      >
                        <MessageSquareText className="mr-2 h-5 w-5" /> SMS
                      </Button>
                    </TooltipTrigger>
                    {!foundDriver.driverPhone && <TooltipContent>Telefone não informado</TooltipContent>}
                  </Tooltip>

                  <Button
                    variant="outline"
                    className="text-jbs-blue border-jbs-blue hover:bg-jbs-blue/10 bg-transparent"
                    onClick={handleCopyDetails}
                    aria-label="Copiar Detalhes"
                  >
                    <Copy className="mr-2 h-5 w-5" /> Copiar Detalhes
                  </Button>

                  <Button
                    variant="outline"
                    className="text-red-500 border-red-500 hover:bg-red-500/10 bg-transparent"
                    onClick={handleRegisterAnomaly}
                    aria-label="Registrar Anomalia"
                  >
                    <FileWarning className="mr-2 h-5 w-5" /> Registrar Anomalia
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Driver Found Message */}
          {!foundDriver && searchPlate.trim() && !isSearching && (
            <div className="mt-4 p-4 border border-red-400 bg-red-50 text-red-800 rounded-md text-center font-medium w-full max-w-lg">
              <p>Nenhum motorista encontrado para a placa "{searchPlate.toUpperCase()}".</p>
              <p className="text-sm mt-2">Verifique a placa digitada ou cadastre o motorista na página inicial.</p>
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
    </TooltipProvider>
  )
}
