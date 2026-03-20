import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: './',
    server: {
        port: 3000
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
