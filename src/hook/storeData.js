// @ts-nocheck
import { supabase } from "../services/supabase"

const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'avatars'

/**
 * Upload image file to Supabase storage (public bucket, no auth required)
 * @param {File} file - Image file from input
 * @param {string} userId - User ID for folder structure
 * @returns {Promise<{ url: string; error?: string }>}
 */
export async function uploadAvatarToStorage(file, userId) {
    try {
        // Validate file
        if (!file || !(file instanceof File)) {
            throw new Error('Invalid file object')
        }

        if (!userId || typeof userId !== 'string') {
            throw new Error('User ID is required')
        }

        // Validate file type
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!validMimeTypes.includes(file.type)) {
            throw new Error('Only JPEG, PNG, and WebP images are supported')
        }

        // Validate file size (max 5MB)
        const maxSizeBytes = 5 * 1024 * 1024
        if (file.size > maxSizeBytes) {
            throw new Error('Image must be smaller than 5MB')
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const extension = file.name.split('.').pop()
        const filename = `${userId}/avatar-${timestamp}-${randomSuffix}.${extension}`

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (error) {
            console.error('[Storage] Upload error:', error.message)
            throw new Error(error.message || 'Upload failed')
        }

        if (!data || !data.path) {
            throw new Error('Invalid upload response')
        }

        // Generate public URL
        const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path)

        const publicUrl = publicData?.publicUrl

        if (!publicUrl) {
            throw new Error('Failed to generate public URL')
        }


        return { url: publicUrl, error: null }
    } catch (error) {
        console.error('[Storage] Upload failed:', error.message)
        return { url: null, error: error.message }
    }
}

/**
 * Delete avatar from storage (public bucket)
 * @param {string} avatarUrl - Full public URL of avatar to delete
 * @param {string} userId - User ID (optional, for logging)
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
export async function deleteAvatarFromStorage(avatarUrl, userId) {
    try {
        if (!avatarUrl) {
            return { success: false, error: 'Avatar URL is required' }
        }

        const urlParts = avatarUrl.split('/')
        const bucketIndex = urlParts.indexOf('public')

        if (bucketIndex === -1) {
            throw new Error('Invalid avatar URL format')
        }

        const pathSegment = urlParts.slice(bucketIndex + 2).join('/')

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([pathSegment])

        if (error) {
            console.warn('[Storage] Delete warning:', error.message)
            return { success: false, error: error.message }
        }

        return { success: true, error: null }
    } catch (error) {
        console.warn('[Storage] Delete failed (non-critical):', error.message)
        return { success: false, error: error.message }
    }
}

/**
 * Convert file to base64 (for preview before upload)
 * @param {File} file - Image file
 * @returns {Promise<string>} - Base64 data URL
 */
export async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Compress image before upload (optional)
 * @param {File} file - Image file
 * @param {number} maxWidth - Max width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} - Compressed blob
 */
export async function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(resolve, 'image/jpeg', quality)
            }
            img.onerror = reject
            img.src = e.target.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}