export const extractS3KeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.pathname).replace(/^\/+/, "");
  } catch (err) {
    console.error("Invalid S3 URL:", url);
    return null;
  }
};
