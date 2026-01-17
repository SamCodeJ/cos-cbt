const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

// Directory for storing extracted question images
const IMAGES_DIR = path.join(__dirname, '../uploads/question-images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Generate unique filename for extracted images
 */
const generateImageFilename = (extension) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `q_img_${timestamp}_${random}${extension}`;
};

/**
 * Custom image handler for mammoth - extracts and saves images
 */
const createImageHandler = () => {
  const extractedImages = [];
  
  const handler = {
    images: [],
    convertImage: mammoth.images.imgElement((image) => {
      return image.read().then((imageBuffer) => {
        // Determine file extension from content type
        const contentType = image.contentType || 'image/png';
        const extension = '.' + contentType.split('/')[1].replace('jpeg', 'jpg');
        
        // Generate unique filename
        const filename = generateImageFilename(extension);
        const filepath = path.join(IMAGES_DIR, filename);
        
        // Save image to disk
        fs.writeFileSync(filepath, imageBuffer);
        
        // Store reference
        extractedImages.push({
          filename,
          filepath,
          contentType
        });
        
        // Return image tag with reference
        return {
          src: `/uploads/question-images/${filename}`
        };
      });
    }),
    getExtractedImages: () => extractedImages
  };
  
  return handler;
};

/**
 * Extract underlined text from Word document XML
 * @param {string} filePath - Path to the Word document
 * @returns {Array<string>} Array of underlined text segments
 */
const extractUnderlinedText = (filePath) => {
  try {
    const zip = new AdmZip(filePath);
    const documentXml = zip.readAsText('word/document.xml');
    
    // Find all runs with underline formatting
    const underlinedTexts = [];
    
    // Match XML patterns: <w:r><w:rPr><w:u .../></w:rPr><w:t>text</w:t></w:r>
    // This regex finds runs (<w:r>) that contain underline tags (<w:u) and extracts the text
    // Note: <w:r> tags can have attributes, so we use [^>]* to match any attributes
    const runRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g;
    let match;
    
    while ((match = runRegex.exec(documentXml)) !== null) {
      const runContent = match[1];
      
      // Check if this run has underline formatting
      if (runContent.includes('<w:u ') || runContent.includes('<w:u/>') || runContent.includes('<w:u>')) {
        // Extract text from this run
        const textRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
        let textMatch;
        
        while ((textMatch = textRegex.exec(runContent)) !== null) {
          const text = textMatch[1].trim();
          if (text) {
            underlinedTexts.push(text);
          }
        }
      }
    }
    
    console.log(`Found ${underlinedTexts.length} underlined text segment(s)`);
    
    return underlinedTexts;
  } catch (error) {
    console.error('Error extracting underlined text:', error);
    return [];
  }
};

/**
 * Apply underline formatting to HTML by wrapping specified text segments
 * @param {string} html - HTML content
 * @param {Array<string>} underlinedTexts - Array of text that should be underlined
 * @returns {string} HTML with underlines applied
 */
const applyUnderlines = (html, underlinedTexts) => {
  let modifiedHtml = html;
  
  underlinedTexts.forEach(text => {
    // Escape special regex characters in the text
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace the text with underlined version, but only if it's not already in a tag
    // Use a negative lookbehind/lookahead to avoid matching text inside existing tags
    const regex = new RegExp(`(?<!<[^>]*)\\b${escapedText}\\b(?![^<]*>)`, 'g');
    modifiedHtml = modifiedHtml.replace(regex, `<u>${text}</u>`);
  });
  
  return modifiedHtml;
};

/**
 * Parse Word document and extract questions
 * @param {string} filePath - Path to the Word document
 * @returns {Promise<{questions: Array, errors: Array, extractedImages: Array}>}
 */
const parseWordDocument = async (filePath) => {
  const errors = [];
  const questions = [];
  
  try {
    // Create image handler
    const imageHandler = createImageHandler();
    
    // Extract underlined text from the Word document XML
    const underlinedTexts = extractUnderlinedText(filePath);
    console.log(`Found ${underlinedTexts.length} underlined text segment(s):`, underlinedTexts);
    
    // Convert Word document to HTML
    const result = await mammoth.convertToHtml(
      { path: filePath },
      { 
        convertImage: imageHandler.convertImage
      }
    );
    
    // Apply underlines to the HTML
    let html = result.value;
    if (underlinedTexts.length > 0) {
      html = applyUnderlines(html, underlinedTexts);
    }
    
    const warnings = result.messages;
    
    if (warnings.length > 0) {
      warnings.forEach(w => errors.push(`Warning: ${w.message}`));
    }
    
    // Convert HTML to plain text while preserving image tags
    // We'll use a simple regex approach to extract text and keep image references
    const textContent = htmlToTextWithImages(html);
    
    if (textContent.length === 0) {
      errors.push('Warning: No text content extracted from HTML');
    }
    
    // Split by section separator
    const sections = textContent.split(/^---+$/m).map(s => s.trim()).filter(Boolean);
    
    console.log(`Found ${sections.length} section(s) in document`);
    
    for (let i = 0; i < sections.length; i++) {
      try {
        const sectionQuestions = parseSection(sections[i]);
        console.log(`Section ${i + 1}: Parsed ${sectionQuestions.length} question(s)`);
        questions.push(...sectionQuestions);
      } catch (err) {
        console.error(`Section ${i + 1} parsing error:`, err);
        errors.push(`Section ${i + 1} parsing error: ${err.message}`);
      }
    }
    
    console.log(`Total questions parsed: ${questions.length}`);
    
    return {
      questions,
      errors,
      extractedImages: imageHandler.getExtractedImages(),
      totalSections: sections.length
    };
    
  } catch (error) {
    errors.push(`Document parsing error: ${error.message}`);
    return { questions: [], errors, extractedImages: [] };
  }
};

/**
 * Convert Unicode subscript/superscript characters to HTML tags
 */
const convertUnicodeSubSuperToHtml = (text) => {
  // Unicode subscript characters (₀-₉, ₊, ₋, ₌, ₍, ₎, ₐ-ₜ)
  const subscriptMap = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
    '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
    'ₐ': 'a', 'ₑ': 'e', 'ₕ': 'h', 'ᵢ': 'i', 'ⱼ': 'j',
    'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o',
    'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ᵤ': 'u',
    'ᵥ': 'v', 'ₓ': 'x'
  };
  
  // Unicode superscript characters (⁰-⁹, ⁺, ⁻, ⁼, ⁽, ⁾, ᵃ-ᵛ)
  const superscriptMap = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
    'ᵃ': 'a', 'ᵇ': 'b', 'ᶜ': 'c', 'ᵈ': 'd', 'ᵉ': 'e',
    'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h', 'ⁱ': 'i', 'ʲ': 'j',
    'ᵏ': 'k', 'ˡ': 'l', 'ᵐ': 'm', 'ⁿ': 'n', 'ᵒ': 'o',
    'ᵖ': 'p', 'ʳ': 'r', 'ˢ': 's', 'ᵗ': 't', 'ᵘ': 'u',
    'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z'
  };
  
  // Convert subscripts
  let result = text;
  for (const [unicode, normal] of Object.entries(subscriptMap)) {
    result = result.replace(new RegExp(unicode, 'g'), `<sub>${normal}</sub>`);
  }
  
  // Convert superscripts
  for (const [unicode, normal] of Object.entries(superscriptMap)) {
    result = result.replace(new RegExp(unicode, 'g'), `<sup>${normal}</sup>`);
  }
  
  return result;
};

/**
 * Convert HTML to text while preserving image references and formatting tags
 * Preserves: sub, sup, strong, em, b, i, u, span (with style attributes)
 */
const htmlToTextWithImages = (html) => {
  // Replace <img> tags with placeholder that we can identify later
  let text = html.replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, '[IMAGE:$1]');
  
  // Replace block-level tags with newlines (but preserve their content)
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  
  // Convert Unicode subscript/superscript characters to HTML tags
  text = convertUnicodeSubSuperToHtml(text);
  
  // Preserve formatting tags: sub, sup, strong, em, b, i, u, span
  // Use a negative lookahead to remove tags that are NOT in our allowed list
  // This regex matches <tag> or </tag> where tag is NOT one of: sub, sup, strong, em, b, i, u, span
  text = text.replace(/<(?!\/?(?:sub|sup|strong|em|b|i|u|span)\b)[^>]+>/gi, '');
  
  // Decode HTML entities (but preserve the ones in formatting tags)
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
};

/**
 * Strip HTML tags from a string (for pattern matching)
 */
const stripHtmlForMatching = (text) => {
  return text.replace(/<[^>]+>/g, '').trim();
};

/**
 * Extract content after a keyword from original line, preserving HTML
 * @param {string} originalLine - Original line with HTML
 * @param {string} keyword - Keyword to find (e.g., "Question:", "A:")
 * @returns {string} Content after keyword with HTML preserved
 */
const extractContentAfterKeyword = (originalLine, keyword) => {
  // First, find keyword position in stripped version
  const stripped = stripHtmlForMatching(originalLine);
  const keywordIndex = stripped.toLowerCase().indexOf(keyword.toLowerCase());
  
  if (keywordIndex === -1) {
    return '';
  }
  
  // Find the end position of keyword in stripped text
  const afterKeywordIndex = keywordIndex + keyword.length;
  
  // Now find equivalent position in original line (counting only non-HTML characters)
  let textCharCount = 0;
  let originalIndex = 0;
  let inTag = false;
  
  for (let i = 0; i < originalLine.length; i++) {
    if (originalLine[i] === '<') {
      inTag = true;
    } else if (originalLine[i] === '>') {
      inTag = false;
      continue;
    }
    
    if (!inTag) {
      if (textCharCount === afterKeywordIndex) {
        originalIndex = i;
        break;
      }
      textCharCount++;
    }
  }
  
  // Extract content after keyword
  return originalLine.substring(originalIndex).trim();
};

/**
 * Parse a single section and extract questions
 */
const parseSection = (sectionText) => {
  const questions = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let sectionId = '';
  let instruction = '';
  let passage = '';
  
  let currentQuestion = null;
  let currentOptions = {};
  let parsingState = 'header'; // header, passage, question, options
  let passageLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineForMatching = stripHtmlForMatching(line); // Strip HTML for pattern matching
    
    // Parse Section
    if (lineForMatching.match(/^Section:\s*/i)) {
      sectionId = lineForMatching.replace(/^Section:\s*/i, '').trim();
      continue;
    }
    
    // Parse Instruction
    if (lineForMatching.match(/^Instruction:\s*/i)) {
      instruction = lineForMatching.replace(/^Instruction:\s*/i, '').trim();
      continue;
    }
    
    // Parse Passage start
    if (lineForMatching.match(/^Passage:\s*/i)) {
      parsingState = 'passage';
      const passageContent = line.replace(/^Passage:\s*/i, '').trim();
      if (passageContent) {
        passageLines.push(passageContent);
      }
      continue;
    }
    
    // Check if we're starting a new question
    const questionMatch = lineForMatching.match(/^(?:\d+\.\s*)?Question:\s*(.+)/i);
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion) {
        questions.push(finalizeQuestion(currentQuestion, currentOptions, sectionId, instruction, passage));
      }
      
      // If we were parsing passage, finalize it
      if (parsingState === 'passage') {
        passage = passageLines.join('\n').trim();
        passageLines = [];
      }
      
      parsingState = 'question';
      // Extract question text from original line (preserving HTML)
      // Find "Question:" keyword (may have optional number prefix)
      const questionKeywordMatch = questionMatch[0].match(/(?:\d+\.\s*)?Question:\s*/i);
      const questionKeyword = questionKeywordMatch ? questionKeywordMatch[0].trim() : 'Question:';
      const questionText = extractContentAfterKeyword(line, questionKeyword);
      currentQuestion = {
        text: questionText || questionMatch[1].trim()
      };
      currentOptions = {};
      continue;
    }
    
    // If we're in passage mode and not hitting a keyword, accumulate passage text
    if (parsingState === 'passage') {
      // Check if this line is an option or answer (which would mean passage ended)
      if (!lineForMatching.match(/^[A-Z]:\s*/i) && !lineForMatching.match(/^Answer:\s*/i)) {
        passageLines.push(line); // Keep original line with HTML
        continue;
      } else {
        // Finalize passage
        passage = passageLines.join('\n').trim();
        passageLines = [];
        parsingState = 'question';
      }
    }
    
    // Parse options (A:, B:, C:, etc.)
    const optionMatch = lineForMatching.match(/^([A-Z]):\s*(.+)/i);
    if (optionMatch && currentQuestion) {
      const optionLetter = optionMatch[1].toUpperCase();
      // Extract option text from original line (preserving HTML)
      const optionText = extractContentAfterKeyword(line, `${optionLetter}:`);
      currentOptions[optionLetter] = optionText || optionMatch[2].trim();
      continue;
    }
    
    // Parse Answer
    const answerMatch = lineForMatching.match(/^Answer:\s*(.+)/i);
    if (answerMatch && currentQuestion) {
      currentQuestion.answer = answerMatch[1].trim().toUpperCase();
      
      // Save the completed question
      questions.push(finalizeQuestion(currentQuestion, currentOptions, sectionId, instruction, passage));
      currentQuestion = null;
      currentOptions = {};
      continue;
    }
    
    // If we're in question mode and this isn't a recognized pattern,
    // it might be continuation of question text
    if (parsingState === 'question' && currentQuestion && !lineForMatching.match(/^[A-Z]:\s*/i)) {
      currentQuestion.text += '\n' + line; // Keep original line with HTML
    }
  }
  
  // Don't forget the last question if it exists
  if (currentQuestion) {
    questions.push(finalizeQuestion(currentQuestion, currentOptions, sectionId, instruction, passage));
  }
  
  return questions;
};

/**
 * Finalize a question object with all its data
 */
const finalizeQuestion = (question, options, sectionId, instruction, passage) => {
  // Build question text with passage and instruction if present
  let fullQuestionText = question.text;
  
  // Get sorted option letters
  const optionLetters = Object.keys(options).sort();
  
  // Determine if multi-answer
  const answerParts = question.answer ? question.answer.split(',').map(a => a.trim()) : [];
  const isMultiAnswer = answerParts.length > 1;
  
  // Validate answer letters are in available options
  const validAnswers = answerParts.filter(a => optionLetters.includes(a));
  const correctAnswer = validAnswers.join(',');
  
  // Build the question object matching the database schema
  const finalQuestion = {
    section_id: sectionId || null,
    instruction: instruction || null,
    passage: passage || null,
    question_text: fullQuestionText,
    correct_answer: correctAnswer,
    is_multi_answer: isMultiAnswer,
    options: {} // Store all options
  };
  
  // Map options to schema columns (option_a, option_b, etc.)
  // Note: Current schema only supports A-D
  const optionMapping = ['A', 'B', 'C', 'D'];
  optionMapping.forEach((letter, index) => {
    const key = `option_${letter.toLowerCase()}`;
    finalQuestion[key] = options[letter] || null;
    finalQuestion.options[letter] = options[letter] || null;
  });
  
  // Store extra options beyond D (for future schema updates)
  const extraOptions = {};
  optionLetters.forEach(letter => {
    if (!optionMapping.includes(letter)) {
      extraOptions[letter] = options[letter];
    }
  });
  
  if (Object.keys(extraOptions).length > 0) {
    finalQuestion.extra_options = extraOptions;
    finalQuestion._warning = `Question has options beyond D: ${Object.keys(extraOptions).join(', ')}. These are stored but may not display in current schema.`;
  }
  
  return finalQuestion;
};

/**
 * Validate parsed questions
 */
const validateQuestions = (questions) => {
  const validQuestions = [];
  const invalidQuestions = [];
  
  questions.forEach((q, index) => {
    const errors = [];
    
    if (!q.question_text || q.question_text.trim() === '') {
      errors.push('Missing question text');
    }
    
    if (!q.option_a) {
      errors.push('Missing option A');
    }
    
    if (!q.option_b) {
      errors.push('Missing option B');
    }
    
    if (!q.correct_answer) {
      errors.push('Missing correct answer');
    } else {
      // Validate answer format
      const answerPattern = /^[A-Z](,[A-Z])*$/;
      if (!answerPattern.test(q.correct_answer)) {
        errors.push(`Invalid answer format: ${q.correct_answer}`);
      }
    }
    
    if (errors.length === 0) {
      validQuestions.push(q);
    } else {
      invalidQuestions.push({
        index: index + 1,
        question: q,
        errors
      });
    }
  });
  
  return { validQuestions, invalidQuestions };
};

module.exports = {
  parseWordDocument,
  validateQuestions,
  IMAGES_DIR
};

