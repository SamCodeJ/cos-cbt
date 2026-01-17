// Utility function to convert [IMAGE:...] placeholders to <img> tags
export const convertImagePlaceholders = (html, apiBaseUrl = '') => {
  if (!html) return html;
  
  // Get base URL - remove /api if present
  const baseUrl = apiBaseUrl.replace('/api', '');
  
  // Convert [IMAGE:/uploads/question-images/filename.jpg] to <img> tag
  return html.replace(/\[IMAGE:([^\]]+)\]/gi, (match, imagePath) => {
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Construct full URL
    const imageUrl = baseUrl ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;
    
    return `<img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block;" alt="Question image" loading="lazy" />`;
  });
};

// For React components that use dangerouslySetInnerHTML
export const processQuestionHTML = (html, apiBaseUrl = '') => {
  return convertImagePlaceholders(html, apiBaseUrl);
};
