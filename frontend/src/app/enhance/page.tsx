"use client"

import { useState } from "react"
import Header from "@/components/Header"
import ImageEnhancer from "@/components/ImageEnhancer"

export default function EnhancePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto my-auto">
        <ImageEnhancer />
      </main>
    </div>
  )
}