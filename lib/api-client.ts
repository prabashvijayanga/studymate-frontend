// The base URL of our FastAPI backend
const rawBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
const BACKEND_BASE_URL = rawBaseUrl.replace(/\/$/, "");

export async function uploadPdfToBackend(file: File) {
  // Create a FormData object to send the file as a multipart/form-data request
  const formData = new FormData();
  formData.append("file", file);

  try {
    // Send a POST request to the FastAPI /api/upload endpoint (Fixed Variable Name & Path)
    const response = await fetch(`${BACKEND_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    // If the response is not OK (e.g., 500 error), throw an error
    if (!response.ok) {
      throw new Error("Failed to upload PDF");
    }

    // Parse and return the JSON response from the backend
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
}