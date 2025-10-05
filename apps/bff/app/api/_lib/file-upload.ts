import { NextRequest } from "next/server";
import { badRequest } from "./http";

export interface FileUploadValidation {
    file: File;
    data: Record<string, string>;
    error?: Response;
}

/**
 * Centralized file upload validation
 * Validates file presence, size, and required form fields
 */
export async function validateFileUpload(
    req: NextRequest,
    requiredFields: string[] = []
): Promise<FileUploadValidation> {
    try {
        const formData = await req.formData();

        // Get the file
        const file = formData.get("file") as File;
        if (!file) {
            return { file: null as any, data: {}, error: badRequest("No file provided") };
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return { file: null as any, data: {}, error: badRequest("File too large (max 10MB)") };
        }

        // Check if file is empty
        if (file.size === 0) {
            return { file: null as any, data: {}, error: badRequest("File is empty") };
        }

        // Extract form data
        const data: Record<string, string> = {};
        for (const [key, value] of formData.entries()) {
            if (key !== "file" && typeof value === "string") {
                data[key] = value;
            }
        }

        // Validate required fields
        for (const field of requiredFields) {
            if (!data[field]) {
                return { file: null as any, data: {}, error: badRequest(`Missing required field: ${field}`) };
            }
        }

        return { file, data };
    } catch (error) {
        return {
            file: null as any,
            data: {},
            error: badRequest("Invalid form data")
        };
    }
}

/**
 * Determine if a file should use streaming based on size
 */
export function shouldUseStreaming(file: File, threshold: number = 5 * 1024 * 1024): boolean {
    return file.size > threshold;
}
