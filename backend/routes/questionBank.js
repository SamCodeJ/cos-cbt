const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireTeacher, logActivity } = require('../middleware/auth');
const { wordUpload, cleanupTempFile } = require('../middleware/wordUpload');
const { parseWordDocument, validateQuestions } = require('../utils/wordParser');
const { generateQuestionTemplate } = require('../utils/wordTemplateGenerator');

const router = express.Router();

// All routes require authentication and teacher role
router.use(authenticateToken);
router.use(requireTeacher);

// GET /api/question-bank/template - Download Word template for questions
router.get('/template', async (req, res) => {
  try {
    const buffer = await generateQuestionTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=questions_template.docx');
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// GET /api/question-bank - List questions from question bank
router.get('/', async (req, res) => {
  try {
    const { subject, difficulty } = req.query;
    
    let query = `
      SELECT q.*, e.title as exam_title
      FROM questions q
      LEFT JOIN exams e ON q.exam_id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Teachers only see questions from their exams
    if (req.user.role === 'teacher') {
      params.push(req.user.id);
      query += ` AND e.teacher_id = $${params.length}`;
    }

    if (subject) {
      params.push(subject);
      query += ` AND q.subject = $${params.length}`;
    }

    if (difficulty) {
      params.push(difficulty);
      query += ` AND q.difficulty = $${params.length}`;
    }

    query += ' ORDER BY q.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get question bank error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/question-bank/:id - Get single question
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT q.*, e.title as exam_title, e.teacher_id
      FROM questions q
      LEFT JOIN exams e ON q.exam_id = e.id
      WHERE q.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = result.rows[0];

    // Check permission
    if (req.user.role === 'teacher' && question.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// POST /api/question-bank - Create question
router.post('/',
  body('question_text').trim().notEmpty().withMessage('Question text is required'),
  body('option_a').trim().notEmpty().withMessage('Option A is required'),
  body('option_b').trim().notEmpty().withMessage('Option B is required'),
  body('correct_answer').custom((value) => {
    // Validate format: single letter or comma-separated letters (A,B,D)
    if (!/^[A-D](,[A-D])*$/.test(value)) {
      throw new Error('Valid correct answer required (e.g., "A" or "A,B,D")');
    }
    return true;
  }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        exam_id,
        subject,
        difficulty,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        points,
        is_multi_answer
      } = req.body;

      // If exam_id provided, check permission
      if (exam_id) {
        const examResult = await db.query(
          'SELECT teacher_id FROM exams WHERE id = $1',
          [exam_id]
        );

        if (examResult.rows.length === 0) {
          return res.status(404).json({ error: 'Exam not found' });
        }

        if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // Determine if multi-answer based on correct_answer format or explicit flag
      const isMulti = is_multi_answer !== undefined ? is_multi_answer : correct_answer.includes(',');

      const result = await db.query(`
        INSERT INTO questions (
          exam_id, subject, difficulty, question_text, option_a, option_b,
          option_c, option_d, correct_answer, points, is_multi_answer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        exam_id || null,
        subject,
        difficulty || 'medium',
        question_text,
        option_a,
        option_b,
        option_c || null,
        option_d || null,
        correct_answer,
        points || 1,
        isMulti
      ]);

      await logActivity(
        req.user.id,
        req.user.name,
        'question.create',
        `Created question: ${question_text.substring(0, 50)}...`,
        req.ip
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({ error: 'Failed to create question' });
    }
  }
);

// PUT /api/question-bank/:id - Update question
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    const checkResult = await db.query(`
      SELECT q.*, e.teacher_id
      FROM questions q
      LEFT JOIN exams e ON q.exam_id = e.id
      WHERE q.id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (req.user.role === 'teacher' && checkResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      subject,
      difficulty,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      points,
      is_multi_answer
    } = req.body;

    // Validate correct_answer format if provided
    if (correct_answer && !/^[A-D](,[A-D])*$/.test(correct_answer)) {
      return res.status(400).json({ error: 'Invalid correct_answer format (e.g., "A" or "A,B,D")' });
    }

    // Determine if multi-answer
    let isMulti = is_multi_answer;
    if (isMulti === undefined && correct_answer) {
      isMulti = correct_answer.includes(',');
    }

    const result = await db.query(`
      UPDATE questions SET
        subject = COALESCE($1, subject),
        difficulty = COALESCE($2, difficulty),
        question_text = COALESCE($3, question_text),
        option_a = COALESCE($4, option_a),
        option_b = COALESCE($5, option_b),
        option_c = COALESCE($6, option_c),
        option_d = COALESCE($7, option_d),
        correct_answer = COALESCE($8, correct_answer),
        points = COALESCE($9, points),
        is_multi_answer = COALESCE($10, is_multi_answer),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      subject, difficulty, question_text, option_a, option_b,
      option_c, option_d, correct_answer, points, isMulti, id
    ]);

    await logActivity(
      req.user.id,
      req.user.name,
      'question.update',
      `Updated question ID: ${id}`,
      req.ip
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /api/question-bank/:id - Delete question
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    const checkResult = await db.query(`
      SELECT q.*, e.teacher_id
      FROM questions q
      LEFT JOIN exams e ON q.exam_id = e.id
      WHERE q.id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (req.user.role === 'teacher' && checkResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.query('DELETE FROM questions WHERE id = $1', [id]);

    await logActivity(
      req.user.id,
      req.user.name,
      'question.delete',
      `Deleted question ID: ${id}`,
      req.ip
    );

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// POST /api/question-bank/bulk-delete - Bulk delete questions
router.post('/bulk-delete', async (req, res) => {
  const client = await db.getClient();
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Question IDs array is required' });
    }

    await client.query('BEGIN');

    // Check permissions for all questions
    if (req.user.role === 'teacher') {
      const checkResult = await client.query(`
        SELECT q.id
        FROM questions q
        LEFT JOIN exams e ON q.exam_id = e.id
        WHERE q.id = ANY($1::int[]) AND e.teacher_id != $2
      `, [questionIds, req.user.id]);

      if (checkResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Access denied for one or more questions' });
      }
    }

    await client.query('DELETE FROM questions WHERE id = ANY($1::int[])', [questionIds]);
    await client.query('COMMIT');

    await logActivity(
      req.user.id,
      req.user.name,
      'question.bulk_delete',
      `Deleted ${questionIds.length} questions`,
      req.ip
    );

    res.json({ message: 'Questions deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk delete question error:', error);
    res.status(500).json({ error: 'Failed to delete questions' });
  } finally {
    client.release();
  }
});

// POST /api/question-bank/bulk-import - Bulk import questions
router.post('/bulk-import', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Questions array is required' });
    }

    let imported = 0;

    for (const question of questions) {
      try {
        // Determine if multi-answer
        const isMulti = question.is_multi_answer !== undefined 
          ? question.is_multi_answer 
          : question.correct_answer.includes(',');

        await client.query(`
          INSERT INTO questions (
            exam_id, subject, difficulty, question_text, option_a, option_b,
            option_c, option_d, correct_answer, points, is_multi_answer
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          question.exam_id || null,
          question.subject,
          question.difficulty || 'medium',
          question.question_text,
          question.option_a,
          question.option_b,
          question.option_c || null,
          question.option_d || null,
          question.correct_answer,
          question.points || 1,
          isMulti
        ]);
        imported++;
      } catch (err) {
        console.log('Failed to import question:', err.message);
      }
    }

    await client.query('COMMIT');

    await logActivity(
      req.user.id,
      req.user.name,
      'question.bulk_import',
      `Imported ${imported} questions`,
      req.ip
    );

    res.status(201).json({
      message: 'Questions imported successfully',
      imported,
      total: questions.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import questions' });
  } finally {
    client.release();
  }
});

// POST /api/question-bank/import-word - Import questions from Word document
router.post('/import-word', wordUpload.single('file'), async (req, res) => {
  const client = await db.getClient();
  let tempFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Word document uploaded' });
    }
    
    tempFilePath = req.file.path;
    const { exam_id, subject, difficulty } = req.body;
    
    // Parse the Word document
    console.log('Parsing Word document:', req.file.originalname);
    const parseResult = await parseWordDocument(tempFilePath);
    
    if (parseResult.questions.length === 0) {
      return res.status(400).json({
        error: 'No questions found in the document',
        parseErrors: parseResult.errors
      });
    }
    
    // Validate parsed questions
    const { validQuestions, invalidQuestions } = validateQuestions(parseResult.questions);
    
    if (validQuestions.length === 0) {
      return res.status(400).json({
        error: 'No valid questions found in the document',
        invalidQuestions,
        parseErrors: parseResult.errors
      });
    }
    
    // If exam_id provided, check permission
    if (exam_id) {
      const examResult = await client.query(
        'SELECT teacher_id FROM exams WHERE id = $1',
        [exam_id]
      );

      if (examResult.rows.length === 0) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    await client.query('BEGIN');
    
    let imported = 0;
    const importedQuestions = [];
    const importErrors = [];
    
    for (const question of validQuestions) {
      try {
        // Build question text with passage/instruction if present
        let fullQuestionText = '';
        
        if (question.passage) {
          fullQuestionText += `[Passage]\n${question.passage}\n\n`;
        }
        
        if (question.instruction) {
          fullQuestionText += `[Instruction]\n${question.instruction}\n\n`;
        }
        
        fullQuestionText += question.question_text;
        
        const result = await client.query(`
          INSERT INTO questions (
            exam_id, subject, difficulty, question_text, option_a, option_b,
            option_c, option_d, correct_answer, points, is_multi_answer
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [
          exam_id || null,
          subject || question.section_id || 'General',
          difficulty || 'medium',
          fullQuestionText,
          question.option_a,
          question.option_b,
          question.option_c || null,
          question.option_d || null,
          question.correct_answer,
          1, // default points
          question.is_multi_answer
        ]);
        
        importedQuestions.push(result.rows[0]);
        imported++;
        
        // Log warning if question had extra options
        if (question._warning) {
          importErrors.push({
            question: question.question_text.substring(0, 50) + '...',
            warning: question._warning
          });
        }
      } catch (err) {
        importErrors.push({
          question: question.question_text?.substring(0, 50) + '...',
          error: err.message
        });
      }
    }
    
    await client.query('COMMIT');
    
    // Log activity
    await logActivity(
      req.user.id,
      req.user.name,
      'question.word_import',
      `Imported ${imported} questions from Word document: ${req.file.originalname}`,
      req.ip
    );
    
    res.status(201).json({
      message: 'Word document processed successfully',
      imported,
      totalParsed: parseResult.questions.length,
      validQuestions: validQuestions.length,
      invalidQuestions: invalidQuestions.length,
      sectionsFound: parseResult.totalSections,
      imagesExtracted: parseResult.extractedImages.length,
      parseErrors: parseResult.errors,
      importErrors: importErrors.length > 0 ? importErrors : undefined,
      invalidDetails: invalidQuestions.length > 0 ? invalidQuestions : undefined
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Word import error:', error);
    res.status(500).json({ error: 'Failed to import questions from Word document' });
  } finally {
    client.release();
    // Cleanup temporary file
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

// POST /api/question-bank/preview-word - Preview questions from Word document without importing
router.post('/preview-word', wordUpload.single('file'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Word document uploaded' });
    }
    
    tempFilePath = req.file.path;
    
    // Parse the Word document
    console.log('Previewing Word document:', req.file.originalname);
    const parseResult = await parseWordDocument(tempFilePath);
    
    // Validate parsed questions
    const { validQuestions, invalidQuestions } = validateQuestions(parseResult.questions);
    
    res.json({
      message: 'Word document parsed successfully',
      totalParsed: parseResult.questions.length,
      validQuestions: validQuestions.length,
      invalidQuestions: invalidQuestions.length,
      sectionsFound: parseResult.totalSections,
      imagesExtracted: parseResult.extractedImages.length,
      questions: parseResult.questions.map((q, index) => ({
        index: index + 1,
        section_id: q.section_id,
        instruction: q.instruction,
        passage: q.passage,
        question_text: q.question_text,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
          ...q.extra_options
        },
        correct_answer: q.correct_answer,
        is_multi_answer: q.is_multi_answer,
        warning: q._warning
      })),
      parseErrors: parseResult.errors,
      invalidDetails: invalidQuestions
    });
    
  } catch (error) {
    console.error('Word preview error:', error);
    res.status(500).json({ error: 'Failed to preview Word document' });
  } finally {
    // Cleanup temporary file
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

module.exports = router;

