import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get("image") as File
    const mask = formData.get("mask") as File
    const prompt = formData.get("prompt") as string

    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GETIMG_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      )
    }

    // Convert files to base64
    const imageBase64 = await fileToBase64(image)
    const maskBase64 = mask ? await fileToBase64(mask) : null

    const response = await fetch("https://api.getimg.ai/v1/stable-diffusion/inpaint", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "realistic-vision-v5-1-inpainting",
        prompt,
        image: imageBase64,
        mask_image: maskBase64,
        width: 512,
        height: 512,
        strength: 0.8,
        steps: 80,
        guidance: 10,
        response_format: "url",
        output_format: "jpeg"
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Image generation failed" },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    // Fetch the generated image
    const imageResponse = await fetch(result.url)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString("base64")
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg"

    return NextResponse.json({
      success: true,
      url: result.url,
      base64: `data:${contentType};base64,${base64}`
    })

  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      { error: "Image processing failed" },
      { status: 500 }
    )
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return Buffer.from(buffer).toString("base64")
}
