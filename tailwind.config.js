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
                sovereign: '#0BF90A',
            },
            backgroundImage: {
                'sovereign-gradient': 'linear-gradient(135deg, #0BF90A 0%, #05a006 100%)',
            }

        },
    },
    plugins: [],
}
