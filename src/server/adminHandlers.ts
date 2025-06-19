import { Server, Socket } from 'socket.io';
import { Question } from './models/Question';
import { Question as QuestionType } from './types';

export const setupAdminHandlers = (io: Server, socket: Socket) => {
  // Get all questions
  socket.on('getQuestions', async () => {
    try {
      const questions = await Question.find().sort({ createdAt: -1 });
      socket.emit('questionsList', questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      socket.emit('error', 'Failed to fetch questions');
    }
  });

  // Add new question
  socket.on('addQuestion', async (questionData: Omit<QuestionType, '_id'>) => {
    try {
      const question = new Question(questionData);
      await question.save();
      socket.emit('questionAdded', question);
    } catch (error) {
      console.error('Error adding question:', error);
      socket.emit('error', 'Failed to add question');
    }
  });

  // Update question
  socket.on('updateQuestion', async ({ id, updates }: { id: string, updates: Partial<QuestionType> }) => {
    try {
      const question = await Question.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      if (!question) {
        throw new Error('Question not found');
      }
      socket.emit('questionUpdated', question);
    } catch (error) {
      console.error('Error updating question:', error);
      socket.emit('error', 'Failed to update question');
    }
  });

  // Delete question
  socket.on('deleteQuestion', async (id: string) => {
    try {
      const question = await Question.findByIdAndDelete(id);
      if (!question) {
        throw new Error('Question not found');
      }
      socket.emit('questionDeleted', id);
    } catch (error) {
      console.error('Error deleting question:', error);
      socket.emit('error', 'Failed to delete question');
    }
  });
}; 