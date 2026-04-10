import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

const isDev = process.env.NODE_ENV !== 'production';

const CSP_DIRECTIVES = [
    "default-src 'self'",
    // unsafe-eval only in dev (Vite HMR); unsafe-inline needed by React + CDNs
    isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com"
        : "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    // Inline styles + CSS CDNs
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    // External APIs + local Ollama + websocket endpoints
    "connect-src 'self' http://localhost:11434 http://localhost:* https://api.openai.com https://api.groq.com https://oauth2.googleapis.com https://www.googleapis.com https://accounts.google.com ws://localhost:* wss://localhost:*",
    // Fonts
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    // Images
    "img-src 'self' data: blob: https:",
    // Workers (WASM / transformers)
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
].join('; ');

export default defineConfig({
    plugins: [react()],
    base: './',
    server: {
        port: 3000,
        headers: { 'Content-Security-Policy': CSP_DIRECTIVES },
    },
    preview: {
        headers: { 'Content-Security-Policy': CSP_DIRECTIVES },
    },
    // Prevent Vite from trying to pre-bundle optional native Capacitor modules
    optimizeDeps: {
        exclude: [
            '@capacitor/preferences',
            '@capacitor/haptics',
            '@capacitor/local-notifications',
            '@capacitor/app',
            '@capacitor/device',
            '@capacitor/geolocation',
            '@capacitor/network',
            '@capacitor/core',
        ],
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // Redux stack
                    'vendor-redux': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
                    // Google OAuth
                    'vendor-google': ['@react-oauth/google'],
                    // ML / Transformers (ONNX — very large)
                    'vendor-ml': ['@xenova/transformers'],
                    // PDF generation / rendering
                    'vendor-pdf': ['jspdf', 'jspdf-autotable'],
                    'vendor-pdfjs': ['pdfjs-dist'],
                },
            },
        },
    },
})
