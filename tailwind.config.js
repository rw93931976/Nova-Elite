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
                aqua: '#0BF9EA',
            },
            backgroundImage: {
                'aqua-gradient': 'linear-gradient(135deg, #0BF9EA 0%, #07a69c 100%)',
            }
        },
    },
    plugins: [],
}
