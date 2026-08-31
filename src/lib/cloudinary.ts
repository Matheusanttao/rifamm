type CloudinaryResponse = {
  secure_url: string
  public_id: string
}

type CloudinaryErrorResponse = {
  error?: { message?: string }
}

export async function uploadImageToCloudinary(file: File): Promise<CloudinaryResponse> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Configure VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as CloudinaryErrorResponse | null
    throw new Error(data?.error?.message || 'Não foi possível enviar a imagem.')
  }

  return response.json()
}
