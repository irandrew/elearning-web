import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { askAssistant } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  FileText, 
  MessageSquareCode,
  Save,
  CheckCircle2,
  ExternalLink,
  Video,
  FileDown,
  Plus,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Material } from '../types';

export default function LessonView() {
  const { courseId, lessonId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);

  // AI Chat State
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLecturer = profile?.role === 'lecturer' || profile?.role === 'admin';

  useEffect(() => {
    if (!courseId || !lessonId) return;

    const fetchLesson = async () => {
      try {
        const modulesSnap = await getDocs(collection(db, `courses/${courseId}/modules`));
        for (const modDoc of modulesSnap.docs) {
          const lessonDoc = await getDoc(doc(db, `courses/${courseId}/modules/${modDoc.id}/lessons`, lessonId));
          if (lessonDoc.exists()) {
            const data = lessonDoc.data();
            setLesson({ id: lessonDoc.id, moduleId: modDoc.id, ...data });
            setContent(data.content || '');
            setMaterials(data.resources || []);
            break;
          }
        }
      } catch (err) {
        console.error("Lesson fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [courseId, lessonId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSave = async () => {
    if (!courseId || !lesson) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, `courses/${courseId}/modules/${lesson.moduleId}/lessons`, lesson.id), {
        content: content,
        resources: materials
      });
      setLesson({ ...lesson, content, resources: materials });
      setEditMode(false);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMaterial = () => {
    const title = prompt("Material Title:");
    const url = prompt("Material URL:");
    const type = prompt("Type (video, document, link):") as any;
    
    if (title && url) {
      setMaterials([...materials, { id: Math.random().toString(), title, url, type, addedAt: new Date().toISOString() }]);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const response = await askAssistant(userMessage, content, messages);
      setMessages(prev => [...prev, { role: 'model', text: response || 'Sorry, I couldn\'t find an answer.' }]);
    } catch (err) {
      console.error("AI error:", err);
      setMessages(prev => [...prev, { role: 'model', text: 'An error occurred. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen animate-pulse"><Loader2 className="w-10 h-10 text-gray-200 animate-spin" /></div>;

  if (!lesson) return <div>Lesson not found</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-h-[85vh]">
      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <button 
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center space-x-2 text-gray-500 hover:text-[#004A99] transition-colors font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Syllabus</span>
          </button>
          
          <div className="flex items-center space-x-4">
            {isLecturer && (
              <button
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                disabled={isSaving}
                className={cn(
                  "flex items-center space-x-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  editMode 
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-sm" 
                    : "bg-blue-50 text-[#004A99] hover:bg-blue-100"
                )}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editMode ? <Save className="w-4 h-4" /> : <motion.span>Edit Lesson</motion.span>}
                <span>{editMode ? 'Save Changes' : 'Edit Lesson'}</span>
              </button>
            )}
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <div className="items-center space-x-2 text-xs font-bold text-gray-400 hidden sm:flex">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Identity Verified</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-12">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-8">
                {lesson.title}
              </h1>

              {editMode ? (
                <textarea
                  autoFocus
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-[500px] p-6 bg-gray-50 border border-gray-100 rounded-[2rem] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none"
                  placeholder="Write your lesson content in Markdown..."
                />
              ) : (
                <div className="markdown-body prose prose-blue max-w-none prose-h2:mt-12 prose-h2:mb-6 prose-h2:font-extrabold prose-p:text-gray-600 prose-p:leading-relaxed">
                  <ReactMarkdown>{content || '_No content yet. Click edit to add material._'}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Materials Section */}
            <div className="pt-10 border-t border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Learning Materials</h3>
                {editMode && (
                  <button
                    onClick={handleAddMaterial}
                    className="flex items-center space-x-2 text-xs font-black uppercase text-[#004A99] tracking-widest bg-blue-50 px-4 py-2 rounded-full"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Material</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((m) => (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 bg-gray-50 border border-gray-100 rounded-[2rem] flex items-center justify-between group hover:bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "p-3 rounded-xl bg-white border border-gray-100",
                        m.type === 'video' ? "text-red-500" : m.type === 'document' ? "text-blue-500" : "text-gray-500"
                      )}>
                        {m.type === 'video' ? <Video className="w-5 h-5" /> : m.type === 'document' ? <FileDown className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-[#004A99] transition-colors">{m.title}</p>
                        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{m.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-200 group-hover:translate-x-1 group-hover:text-[#004A99] transition-all" />
                  </a>
                ))}
                {materials.length === 0 && (
                  <p className="text-gray-400 italic text-sm py-4">No additional materials uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <aside className="lg:w-[400px] bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden max-h-[85vh] lg:max-h-none">
        <div className="p-6 bg-[#004A99] text-white flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold tracking-tight">AI Study Guide</h2>
            <p className="text-[10px] uppercase font-black tracking-widest text-blue-200">Powered by Gemini</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="text-center py-10 px-6 space-y-4">
              <MessageSquareCode className="w-12 h-12 text-gray-100 mx-auto" />
              <p className="text-sm text-gray-400">
                Hi! I'm your UR Study Assistant. Ask me anything about this lesson or for help with complex topics.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={i}
              className={cn(
                "flex items-start space-x-3",
                m.role === 'user' ? "flex-row-reverse space-x-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                m.role === 'user' ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-[#004A99]"
              )}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-4 rounded-3xl text-sm leading-relaxed",
                m.role === 'user' 
                  ? "bg-[#004A99] text-white rounded-tr-none" 
                  : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100 shadow-sm"
              )}>
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
          {isTyping && (
            <div className="flex items-center space-x-2 text-gray-400 p-2 ml-10">
              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-50">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#004A99] transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#004A99] text-white rounded-xl disabled:opacity-50 disabled:bg-gray-300 transition-all hover:bg-blue-800"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
