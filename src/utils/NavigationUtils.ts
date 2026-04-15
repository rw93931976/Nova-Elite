/**
 * 🗺️ NAVIGATION UTILS: Road-Ready Intent Handling
 * ---------------------------------------------
 * Bridges Nova's reasoning to native mobile navigation intents.
 */

export const triggerNavigation = (destination: string) => {
    console.log(`🗺️ Initiating Navigation to: ${destination}`);

    // 🚦 Format for Waze / Google Maps Deep Links
    const encodedDest = encodeURIComponent(destination);

    // Try Waze first, fallback to Google Maps
    const wazeUrl = `https://waze.com/ul?q=${encodedDest}&navigate=yes`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedDest}`;

    // On mobile, these will trigger the app selection
    window.open(wazeUrl, '_blank');

    // We also return the URL in case Nova needs to display it
    return { wazeUrl, googleMapsUrl };
};

export const parseLocationRequest = (input: string): string | null => {
    const navMatch = input.match(/(navigate to|go to|get me to|directions to)\s+(.+)/i);
    return navMatch ? navMatch[2].trim() : null;
};
