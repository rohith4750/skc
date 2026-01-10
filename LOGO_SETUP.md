# Logo Setup Instructions

## Adding Your SKC CATERERS Logo

To use your logo image throughout the website, please follow these steps:

### Step 1: Prepare Your Logo Image

1. Save your SKC CATERERS logo image file
2. Recommended formats: PNG (with transparent background), JPG, or SVG
3. Recommended sizes:
   - **For website logo**: 200x200 pixels or larger (square format works best)
   - **For favicon/tab icon**: 256x256 pixels (or at least 32x32)

### Step 2: Place the Image File

1. Place your logo image file in the `public` directory
2. Name it exactly: `logo.png` (or `logo.jpg` if using JPG format)

   **File path should be:** `public/logo.png`

### Step 3: Verify

Once you've placed the logo file in the `public` directory:

1. The logo will automatically appear in:
   - ✅ Website header/navigation (Sidebar)
   - ✅ Login page
   - ✅ Browser tab icon (favicon)
   - ✅ All pages using the Logo component

2. If the image doesn't appear, the system will fall back to the default SVG logo

### Alternative: Using Different File Names

If your logo file has a different name, you can:

1. Rename it to `logo.png` (recommended), OR
2. Update the file path in `components/Logo.tsx`:
   - Change `/logo.png` to `/your-filename.png`

### Supported File Formats

- **PNG** (recommended) - Best quality with transparency support
- **JPG/JPEG** - Good for photos, no transparency
- **SVG** - Vector format, scales perfectly (best for favicon)

### Notes

- The logo image should have a transparent or white background for best appearance
- For the favicon, a square image works best (equal width and height)
- The system will automatically resize the logo based on the size prop ('sm', 'md', 'lg')

## Current Status

✅ Logo component is ready to use images
✅ Favicon configuration is set up
✅ Fallback SVG logo is available if image is not found

**Next Step:** Place your `logo.png` file in the `public` directory!
