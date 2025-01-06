"use client"

import { useState } from "react"
import Header from "@/components/Header"
import ImageGenerator from "@/components/ImageGenerator"

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto my-auto">
        <ImageGenerator />
      </main>
    </div>
  )
}