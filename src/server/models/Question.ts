import mongoose from 'mongoose';
import { Question as QuestionType } from '../types';

const questionSchema = new mongoose.Schema<QuestionType>({
  text: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (options: string[]) => options.length === 4,
      message: 'Question must have exactly 4 options'
    }
  },
  correctAnswer: {
    type: String,
    required: true,
    validate: {
      validator: function(this: QuestionType, value: string) {
        return this.options.includes(value);
      },
      message: 'Correct answer must be one of the options'
    }
  },
  category: {
    type: String,
    trim: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

export const Question = mongoose.model<QuestionType>('Question', questionSchema); 