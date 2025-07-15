"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface DriverRegistrationDialogProps {
  isOpen: boolean
  onClose: () => void
  initialPlate: string
  onRegisterDriverDetails: (plate: string, driverName: string, driverPhone: string, carrier: string) => void
}

export function DriverRegistrationDialog({
  isOpen,
  onClose,
  initialPlate,
  onRegisterDriverDetails,
}: DriverRegistrationDialogProps) {
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [carrier, setCarrier] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reseta os campos quando o diálogo é aberto
      setDriverName("")
      setDriverPhone("")
      setCarrier("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!driverName.trim() || !driverPhone.trim() || !carrier.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos do motorista e transportadora.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Simula uma chamada de API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onRegisterDriverDetails(initialPlate, driverName, driverPhone, carrier)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Motorista e Transportadora</DialogTitle>
          <DialogDescription>
            A placa {initialPlate} é nova. Por favor, insira os dados do motorista e da transportadora.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plate" className="text-right">
              Placa
            </Label>
            <Input id="plate" value={initialPlate} readOnly className="col-span-3 bg-gray-100" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driverName" className="text-right">
              Nome Motorista
            </Label>
            <Input
              id="driverName"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driverPhone" className="text-right">
              Telefone
            </Label>
            <Input
              id="driverPhone"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              required
              className="col-span-3"
              type="tel"
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="carrier" className="text-right">
              Transportadora
            </Label>
            <Input
              id="carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              required
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button type="submit" className="bg-jbs-blue hover:bg-jbs-blue/90 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
