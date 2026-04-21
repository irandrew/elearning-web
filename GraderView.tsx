import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { X, Plus, Trash2, ClipboardCheck, FileText, HelpCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Assessment, Question } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AssessmentCreatorProps {
  courseId: string;
  onClose: () => void;
  onCreated: (assessment: Assessment) => void;
}

export default function AssessmentCreator({ courseId, onClose, onCreated }: AssessmentCreatorProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'quiz' | 'assignment'>('quiz');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Quiz specifics
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    { id: crypto.randomUUID(), type: 'multiple-choice', text: '', options: ['', '', ''], points: 5, correctAnswer: '' }
  ]);

  // Assignment specifics
  const [dueDate, setDueDate] = useState('');
  const [gradingCriteria, setGradingCriteria] = useState('');

  const addQuestion = () => {
    setQuestions([...questions, { id: crypto.randomUUID(), type: 'multiple-choice', text: '', options: ['', '', ''], points: 5, correctAnswer: '' }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: any = {
        title,
        description,
        type,
        courseId,
        lecturerId: user?.uid,
        createdAt: serverTimestamp(),
      };

      if (type === 'quiz') {
        data.timeLimit = timeLimit;
        data.questions = questions;
      } else {
        data.dueDate = new Date(dueDate);
        data.gradingCriteria = gradingCriteria;
        data.maxScore = 100;
      }

      const docRef = await addDoc(collection(db, `courses/${courseId}/assessments`), data);
      onCreated({ id: docRef.id, ...data });
      onClose();
    } catch (err) {
      console.error("Error creating assessment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-xl text-[#004A99]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New {type === 'quiz' ? 'Quiz' : 'Assignment'}</h2>
              <p className="text-xs text-gray-400">Design an assessment for your students</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left: Basic Config */}
            <div className="space-y-6">
              <div className="flex p-1 bg-gray-50 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('quiz')}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition-all",
                    type === 'quiz' ? "bg-white text-[#004A99] shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('assignment')}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition-all",
                    type === 'assignment' ? "bg-white text-orange-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span>Assignment</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-2 mb-2 block">Assessment Title</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Mid-term Exam"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#004A99]/10 focus:border-[#004A99] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-2 mb-2 block">Description / Instructions</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide clear instructions for your students..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#004A99]/10 focus:border-[#004A99] transition-all resize-none"
                  />
                </div>
              </div>

              {type === 'quiz' ? (
                <div className="p-6 bg-blue-50 rounded-3xl space-y-4">
                  <h4 className="flex items-center space-x-2 text-[#004A99] font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Time Settings</span>
                  </h4>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="5"
                      max="180"
                      step="5"
                      value={timeLimit}
                      onChange={e => setTimeLimit(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-[#004A99]"
                    />
                    <span className="font-bold text-[#004A99] w-20 text-right">{timeLimit} mins</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-2 mb-2 block">Due Date</label>
                    <input
                      required
                      type="datetime-local"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-2 mb-2 block">Grading Criteria</label>
                    <textarea
                      required
                      rows={3}
                      value={gradingCriteria}
                      onChange={e => setGradingCriteria(e.target.value)}
                      placeholder="e.g. Grammar, Content, Evidence..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Questions Builder (for Quiz) */}
            <div className="flex flex-col h-full overflow-hidden">
              <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-2 mb-4 block">
                {type === 'quiz' ? `Questions (${questions.length})` : 'Final Review'}
              </label>

              {type === 'quiz' ? (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                  {questions.map((q, qIdx) => (
                    <div key={q.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 relative group">
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id!)}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-300">#0{qIdx + 1}</span>
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(q.id!, { type: e.target.value as any })}
                            className="bg-white border-0 text-xs font-bold rounded-lg px-2 py-1 shadow-sm"
                          >
                            <option value="multiple-choice">MCQ</option>
                            <option value="short-answer">Short Answer</option>
                            <option value="essay">Essay</option>
                          </select>
                        </div>

                        <input
                          required
                          type="text"
                          value={q.text}
                          onChange={(e) => updateQuestion(q.id!, { text: e.target.value })}
                          placeholder="What is the capital of Rwanda?"
                          className="w-full bg-white border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004A99]/10"
                        />

                        {q.type === 'multiple-choice' && (
                          <div className="space-y-2">
                            {q.options?.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctAnswer === opt && opt !== ''}
                                  onChange={() => updateQuestion(q.id!, { correctAnswer: opt })}
                                  className="accent-green-500"
                                />
                                <input
                                  required
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...q.options!];
                                    newOpts[oIdx] = e.target.value;
                                    updateQuestion(q.id!, { options: newOpts });
                                  }}
                                  placeholder={`Option ${oIdx + 1}`}
                                  className="flex-1 bg-white/50 border-0 rounded-lg px-3 py-2 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 flex items-center justify-center space-x-2 hover:border-[#004A99] hover:text-[#004A99] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">Add Question</span>
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100 flex flex-col items-center justify-center text-center space-y-4">
                  <HelpCircle className="w-16 h-16 text-orange-200" />
                  <p className="text-orange-900 font-bold">Ready to publish?</p>
                  <p className="text-sm text-orange-700">Students will see the grading criteria and deadline immediately after you save.</p>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "px-10 py-4 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center space-x-2",
              type === 'quiz' ? "bg-[#004A99] hover:bg-blue-800" : "bg-orange-600 hover:bg-orange-700",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>Save & Publish</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
