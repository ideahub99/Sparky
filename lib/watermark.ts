/**
 * This function takes an image URL, loads it onto a canvas,
 * adds a semi-transparent watermark of the app logo to the bottom-right corner,
 * and returns the new image as a base64 PNG data URL.
 *
 * @param originalImageUrl The URL of the image to watermark (can be a blob URL).
 * @returns A Promise that resolves with the data URL of the watermarked image.
 */
export const addWatermark = (originalImageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Could not get canvas context'));
        }

        const mainImage = new Image();
        mainImage.crossOrigin = "anonymous"; // Handle potential CORS issues
        mainImage.onload = () => {
            canvas.width = mainImage.width;
            canvas.height = mainImage.height;

            // Draw the main image
            ctx.drawImage(mainImage, 0, 0);

            const logoImage = new Image();
            logoImage.onload = () => {
                const padding = mainImage.width * 0.04; // 4% padding from edges
                const logoScaleFactor = 0.18; // Logo width will be 18% of the image width
                
                let logoWidth = mainImage.width * logoScaleFactor;
                // Ensure logo is not excessively large on small images
                if (logoWidth > 150) logoWidth = 150;

                const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

                const x = mainImage.width - logoWidth - padding;
                const y = mainImage.height - logoHeight - padding;

                ctx.globalAlpha = 0.75; // Set watermark transparency
                ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
                ctx.globalAlpha = 1.0; // Reset alpha

                resolve(canvas.toDataURL('image/png'));
            };
            logoImage.onerror = reject;
            logoImage.src = getLogoDataUrl();
        };
        mainImage.onerror = reject;
        mainImage.src = originalImageUrl;
    });
};

/**
 * Creates a base64 data URL for a monochrome white SVG version of the app logo.
 * This is used for the watermark to ensure it looks clean on any image.
 */
const getLogoDataUrl = (): string => {
    // A simplified, monochrome white version of the new app logo for watermarking.
    const svgXml = `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
        <path fill="white" d="M 9.1,5.5 C 8.4245,5.95 8.2,6.85 8.275,7.45 7.15,6.325 10,3.175 6.775,1 8.575,3.7 4,5.875 4,9.7 4,11.2 4.975,12.5505 7,13 9.025,12.551 10,11.2 10,9.7 10,7.45 8.65,6.7 9.1,5.5 Z M 7,11.426 c -0.9,0 -1.725,-0.75 -1.725,-1.7255 0,-0.9005 0.75,-1.725 1.725,-1.725 0.9,0 1.725,0.75 1.725,1.725 C 8.65,10.676 7.9,11.426 7,11.426 Z"/>
    </svg>`;
    
    // btoa is a global function in browsers for base64 encoding.
    return `data:image/svg+xml;base64,${btoa(svgXml)}`;
}