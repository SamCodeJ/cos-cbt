const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType } = require('docx');

/**
 * Generate a Word document template for question import
 * @returns {Promise<Buffer>} - Word document buffer
 */
const generateQuestionTemplate = async () => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: "Question Import Template",
              bold: true,
              size: 36,
            }),
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Instructions Header
        new Paragraph({
          children: [
            new TextRun({
              text: "How to Use This Template",
              bold: true,
              size: 28,
              color: "2563EB",
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        // Instructions
        new Paragraph({
          children: [
            new TextRun({
              text: "1. Each question must follow the exact format shown in the examples below.",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "2. Use '---' (three dashes) to separate sections.",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "3. For multi-answer questions, separate answers with commas (e.g., Answer: A,C).",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "4. Section, Instruction, and Passage fields are optional.",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "5. You can insert images in questions by using Insert > Pictures in Word. Images will be automatically extracted when you upload the document.",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "6. Delete these instructions and example questions before uploading the document.",
            }),
          ],
          spacing: { after: 400 },
        }),

        // Format Guide Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Required Format",
              bold: true,
              size: 28,
              color: "2563EB",
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        // Format example
        new Paragraph({
          children: [
            new TextRun({ text: "Section: ", bold: true }),
            new TextRun({ text: "[Section Name - Optional]", italics: true, color: "666666" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Instruction: ", bold: true }),
            new TextRun({ text: "[Instructions for this section - Optional]", italics: true, color: "666666" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Passage: ", bold: true }),
            new TextRun({ text: "[Reading passage text - Optional]", italics: true, color: "666666" }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Question: ", bold: true }),
            new TextRun({ text: "[Your question text here]", italics: true, color: "666666" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "A: ", bold: true }),
            new TextRun({ text: "[Option A]", italics: true, color: "666666" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "B: ", bold: true }),
            new TextRun({ text: "[Option B]", italics: true, color: "666666" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "C: ", bold: true }),
            new TextRun({ text: "[Option C - Optional]", italics: true, color: "666666" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "D: ", bold: true }),
            new TextRun({ text: "[Option D - Optional]", italics: true, color: "666666" }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Answer: ", bold: true }),
            new TextRun({ text: "[Correct answer letter(s): A, B, C, D, or A,C for multiple]", italics: true, color: "666666" }),
          ],
          spacing: { after: 400 },
        }),

        // Section Separator
        new Paragraph({
          children: [
            new TextRun({
              text: "═══════════════════════════════════════════════════════",
              color: "CCCCCC",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        }),

        // Example Section 1 Header
        new Paragraph({
          children: [
            new TextRun({
              text: "EXAMPLE QUESTIONS (Delete before uploading)",
              bold: true,
              size: 28,
              color: "DC2626",
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 300 },
        }),

        // Section 1: Mathematics
        new Paragraph({
          children: [
            new TextRun({ text: "Section: Mathematics", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Instruction: Choose the best answer for each question." }),
          ],
          spacing: { after: 200 },
        }),

        // Question 1
        new Paragraph({
          children: [
            new TextRun({ text: "Question: What is 15 + 27?", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "A: 32" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "B: 42" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "C: 52" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "D: 62" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Answer: B", bold: true, color: "16A34A" }),
          ],
          spacing: { after: 300 },
        }),

        // Question 2 - Multi-answer
        new Paragraph({
          children: [
            new TextRun({ text: "Question: Which of the following are even numbers? (Select all that apply)", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "A: 2" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "B: 5" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "C: 8" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "D: 11" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Answer: A,C", bold: true, color: "16A34A" }),
            new TextRun({ text: "  (Multi-answer example)", italics: true, color: "666666" }),
          ],
          spacing: { after: 300 },
        }),

        // Section separator
        new Paragraph({
          children: [new TextRun({ text: "---" })],
          spacing: { before: 200, after: 200 },
        }),

        // Section 2: Reading Comprehension with Passage
        new Paragraph({
          children: [
            new TextRun({ text: "Section: Reading Comprehension", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Instruction: Read the passage carefully and answer the questions." }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Passage: The water cycle is a continuous process by which water circulates through the Earth's systems. Water evaporates from oceans, lakes, and rivers, rises into the atmosphere where it condenses into clouds, and eventually falls back to Earth as precipitation." }),
          ],
          spacing: { after: 200 },
        }),

        // Question 3 with passage
        new Paragraph({
          children: [
            new TextRun({ text: "Question: According to the passage, what happens after water evaporates?", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "A: It falls as rain immediately" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "B: It rises and condenses into clouds" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "C: It freezes in the atmosphere" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "D: It flows into rivers" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Answer: B", bold: true, color: "16A34A" }),
          ],
          spacing: { after: 300 },
        }),

        // Section separator
        new Paragraph({
          children: [new TextRun({ text: "---" })],
          spacing: { before: 200, after: 200 },
        }),

        // Section 3: Science
        new Paragraph({
          children: [
            new TextRun({ text: "Section: Science", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Instruction: Select the correct answer." }),
          ],
          spacing: { after: 200 },
        }),

        // Question 4
        new Paragraph({
          children: [
            new TextRun({ text: "Question: What is the chemical symbol for water?", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "A: CO2" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "B: H2O" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "C: NaCl" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "D: O2" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Answer: B", bold: true, color: "16A34A" }),
          ],
          spacing: { after: 300 },
        }),

        // Question 5 - Multi-answer
        new Paragraph({
          children: [
            new TextRun({ text: "Question: Which of the following are noble gases? (Select all that apply)", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "A: Helium" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "B: Oxygen" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "C: Neon" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "D: Nitrogen" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Answer: A,C", bold: true, color: "16A34A" }),
          ],
          spacing: { after: 300 },
        }),

        // Section separator
        new Paragraph({
          children: [new TextRun({ text: "---" })],
          spacing: { before: 200, after: 200 },
        }),

        // Section 4: Question with Image Example
        new Paragraph({
          children: [
            new TextRun({ text: "Section: Biology", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Instruction: Look at the diagram and answer the question." }),
          ],
          spacing: { after: 200 },
        }),

        // Question 6 - With Image
        new Paragraph({
          children: [
            new TextRun({ text: "Question: What is shown in the diagram below?", bold: true }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "[INSERT YOUR IMAGE HERE]", 
              bold: true, 
              color: "DC2626",
              italics: true 
            }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Instructions for adding images:", 
              bold: true,
              color: "2563EB"
            }),
          ],
          spacing: { after: 20 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "1. Click where you want to insert the image (replace the text above)", 
            }),
          ],
          spacing: { after: 10 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "2. Go to Insert > Pictures > This Device (or Picture from File)", 
            }),
          ],
          spacing: { after: 10 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "3. Select your image file (JPG, PNG, GIF supported)", 
            }),
          ],
          spacing: { after: 10 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "4. The image will be automatically extracted when you upload the document", 
            }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "A: Plant cell" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "B: Animal cell" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "C: Bacterial cell" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "D: Fungal cell" })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Answer: A", bold: true, color: "16A34A" }),
            new TextRun({ text: "  (Image example - replace with your actual image)", italics: true, color: "666666" }),
          ],
          spacing: { after: 400 },
        }),

        // Final Note
        new Paragraph({
          children: [
            new TextRun({
              text: "═══════════════════════════════════════════════════════",
              color: "CCCCCC",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "YOUR QUESTIONS START HERE",
              bold: true,
              size: 28,
              color: "2563EB",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 300 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "(Delete the examples above and add your questions following the same format)",
              italics: true,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Starter section
        new Paragraph({
          children: [
            new TextRun({ text: "Section: " }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Instruction: " }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Question: " }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "A: " })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "B: " })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "C: " })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "D: " })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Answer: " })],
          spacing: { after: 200 },
        }),
      ],
    }],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
};

module.exports = {
  generateQuestionTemplate,
};

