const path = require("path");
const fs = require("fs");

module.exports = function setupImages() {
  const publicDir = process.env.PUBLIC_DIR || "public";
  const imagesSubDir = process.env.IMAGES_DIR || "images";
  const imagesDir = path.join(__dirname, "..", publicDir, imagesSubDir);

  // Create images directory if it doesn't exist.
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log("Created images directory at", imagesDir);
  }

  // Setup logo.
  const logoPath = path.join(imagesDir, "logo.png");
  if (!fs.existsSync(logoPath)) {
    const https = require("https");
    const logoUrl = process.env.LOGO_URL || "https://placehold.co/150x40/5ecce0/3a2d5b?text=ilo";
    const logoFile = fs.createWriteStream(logoPath);
    https.get(logoUrl, (response) => {
      response.pipe(logoFile);
      logoFile.on("finish", () => {
        logoFile.close();
        console.log("Created placeholder logo at", logoPath);
      });
    });
  }

  // Setup avatar.
  const avatarPath = path.join(imagesDir, "avatar.png");
  if (!fs.existsSync(avatarPath)) {
    const https = require("https");
    const avatarUrl = process.env.AVATAR_URL || "https://placehold.co/32x32/3a2d5b/ffffff?text=A";
    const avatarFile = fs.createWriteStream(avatarPath);
    https.get(avatarUrl, (response) => {
      response.pipe(avatarFile);
      avatarFile.on("finish", () => {
        avatarFile.close();
        console.log("Created placeholder avatar at", avatarPath);
      });
    });
  }
};
