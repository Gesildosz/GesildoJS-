"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LoadingSplashProps {
  onAnimationEnd: () => void
}

export function LoadingSplash({ onAnimationEnd }: LoadingSplashProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-jbs-blue z-[9999]">
      <div
        className={cn(
          "relative w-[150px] h-[150px] flex items-center justify-center", // Container para o logo e efeito de brilho
          "logo-shine-container", // Aplica a classe para o efeito de brilho
        )}
        onAnimationEnd={onAnimationEnd} // Dispara o callback quando a animação CSS termina
      >
        <Image
          src="/images/jbs-logo.png"
          alt="Logotipo JBS"
          width={120}
          height={120}
          className="relative z-10" // Garante que o logo esteja acima do efeito de brilho
        />
      </div>
      <p className="mt-8 text-white text-xl font-semibold animate-pulse">Carregando sistema...</p>
    </div>
  )
}
