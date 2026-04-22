export const getSafeImageUrl = async (url) => {
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching safe image:", error);
    return url; // fallback to original
  }
};
