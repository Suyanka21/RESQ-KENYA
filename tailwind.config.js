/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                charcoal: {
                    900: '#0F0F0F',
                    800: '#1A1A1A',
                    700: '#252525',
                    600: '#2E2E2E'
                },
                voltage: '#FFD60A',
                'voltage-bright': '#FFF455',
                'voltage-deep': '#E6B800',
                emergency: '#FF3D3D',
                success: '#00E676',
                warning: '#FF9800',
                medical: '#DC143C'
            },
            fontFamily: {
                sans: ['Inter'],
                mono: ['JetBrains Mono']
            }
        },
    },
    plugins: [],
}
