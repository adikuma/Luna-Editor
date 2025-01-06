"use client"

import Header from "@/components/Header"
import ImageEditor from "@/components/ImageEditor"

export default function EditPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto my-auto pt-20">
        <ImageEditor />
      </main>
    </div>
  )
}