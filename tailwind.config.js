/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                charcoal: '#121212',
                sovereign: '#0BF9EA',
            },
            backgroundImage: {
                'sovereign-gradient': 'linear-gradient(135deg, #0BF9EA 0%, #05a0a3 100%)',
            }

        },
    },
    plugins: [],
}
