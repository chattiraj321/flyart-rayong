'use client';

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Camera, 
  Check, 
  Trash2, 
  X, 
  Edit, 
  MessageSquare, 
  Phone, 
  Sparkles,
  Info
} from 'lucide-react';
import { dataService, Student, Session } from '@/services/data-service';

export default function StudentDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;
  const router = useRouter();

  // Data State
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Check-In Form State
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInFile, setCheckInFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Student Form State
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editLineId, setEditLineId] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editTotalLessons, setEditTotalLessons] = useState(10);
  const [editCompletedLessons, setEditCompletedLessons] = useState(0);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editNotes, setEditNotes] = useState('');

  // Fetch student info & sessions
  const loadData = async () => {
    try {
      const s = await dataService.getStudentById(studentId);
      if (!s) {
        // Redirect if student not found
        router.push('/students');
        return;
      }
      setStudent(s);
      
      // Populate edit form defaults
      setEditName(s.name);
      setEditNickname(s.nickname);
      setEditParentName(s.parent_name);
      setEditParentPhone(s.parent_phone);
      setEditLineId(s.line_id);
      setEditFacebook(s.facebook_username);
      setEditTotalLessons(s.total_lessons);
      setEditCompletedLessons(s.completed_lessons);
      setEditStatus(s.status);
      setEditNotes(s.notes);

      // Load sessions
      const studentSessions = await dataService.getSessions(studentId);
      setSessions(studentSessions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  // Image Selection Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCheckInFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Submit Check-In
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    try {
      setUploading(true);
      let imageUrl = '';
      
      if (checkInFile) {
        imageUrl = await dataService.uploadArtwork(checkInFile);
      }

      await dataService.addSession({
        student_id: studentId,
        date: checkInDate,
        notes: checkInNotes.trim(),
        artwork_url: imageUrl,
      });

      // Clear Form & Close
      setCheckInNotes('');
      setCheckInFile(null);
      setPreviewImage(null);
      setShowCheckInModal(false);
      
      // Refresh Data
      await loadData();
    } catch (err) {
      console.error('Check-in failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // Update Student Info
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    try {
      await dataService.updateStudent(studentId, {
        name: editName,
        nickname: editNickname.trim(),
        parent_name: editParentName.trim(),
        parent_phone: editParentPhone.trim(),
        line_id: editLineId.trim(),
        facebook_username: editFacebook.trim(),
        total_lessons: Number(editTotalLessons) || 10,
        completed_lessons: Number(editCompletedLessons) || 0,
        status: editStatus,
        notes: editNotes.trim(),
      });

      setShowEditModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to update student:', err);
    }
  };

  // Delete Session
  const handleDeleteSession = async (sessionId: string) => {
    if (!student) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this session check-in? This will also decrement the student\'s completed lessons.');
    if (!confirmDelete) return;

    try {
      await dataService.deleteSession(sessionId, studentId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-muted-foreground">Retrieving student records...</p>
      </div>
    );
  }

  if (!student) return null;

  const completionRate = student.total_lessons > 0 
    ? Math.round((student.completed_lessons / student.total_lessons) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Navigation & Header */}
      <div className="flex justify-between items-center">
        <Link 
          href="/students" 
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-semibold py-1 px-2.5 bg-white border border-[#border] rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Directory
        </Link>
        <button
          onClick={() => setShowEditModal(true)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 bg-white border border-[#border] rounded-xl shadow-xs"
        >
          <Edit className="w-3.5 h-3.5" /> Edit Profile
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white border border-[#border] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground font-serif flex items-center gap-2">
              {student.name}
              {student.nickname && (
                <span className="text-sm font-medium text-muted-foreground bg-muted py-0.5 px-2.5 rounded-lg">
                  {student.nickname}
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Member since {new Date(student.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            student.status === 'active' 
              ? 'bg-secondary/15 text-secondary' 
              : 'bg-primary/15 text-primary'
          }`}>
            {student.status === 'active' ? 'Active Package' : 'Package Inactive'}
          </span>
        </div>

        {/* Notes if present */}
        {student.notes && (
          <div className="bg-muted/40 p-3 rounded-xl border border-[#border]/50 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{student.notes}</p>
          </div>
        )}

        {/* Contacts Deep Links */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-muted">
          {student.line_id && (
            <a
              href={`https://line.me/ti/p/~${student.line_id}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#06C755]/10 text-[#06C755] py-2 px-3 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 font-bold text-xs"
            >
              <MessageSquare className="w-4 h-4 fill-current" /> Line Chat
            </a>
          )}
          {student.facebook_username && (
            <a
              href={`https://m.me/${student.facebook_username}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#0084FF]/10 text-[#0084FF] py-2 px-3 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 font-bold text-xs"
            >
              <MessageSquare className="w-4 h-4" /> Messenger
            </a>
          )}
          {student.parent_phone && (
            <a
              href={`tel:${student.parent_phone}`}
              className="bg-secondary/10 text-secondary p-2 rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Progress & Check-in Card */}
      <div className="bg-white border border-[#border] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
          <span>Lessons Completed</span>
          <span className="text-foreground">
            {student.completed_lessons} / {student.total_lessons} Lessons ({completionRate}%)
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-muted h-3.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              completionRate >= 100 ? 'bg-secondary' : 'bg-primary'
            }`}
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* Bottom statistics detail */}
        <div className="flex justify-between text-xs text-muted-foreground font-medium pt-1">
          <span>Remaining: {Math.max(0, student.total_lessons - student.completed_lessons)} lessons</span>
          {completionRate >= 100 && (
            <span className="text-secondary font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Package Completed!
            </span>
          )}
        </div>

        {/* Check-In Button */}
        <button
          onClick={() => setShowCheckInModal(true)}
          className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-2xl font-semibold text-sm shadow-md shadow-primary/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
        >
          <Camera className="w-4.5 h-4.5" /> Check-in Today&apos;s Lesson
        </button>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-wide uppercase text-muted-foreground/80 flex items-center gap-1.5">
          <Calendar className="w-4.5 h-4.5" />
          Artwork Timeline ({sessions.length})
        </h3>

        {sessions.length === 0 ? (
          <div className="border-2 border-dashed border-[#border] rounded-2xl py-12 px-4 text-center">
            <p className="text-sm font-semibold text-foreground">No sessions logged</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap the button above to log their very first lesson drawing.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-[#eae7df] ml-4.5 pl-6 space-y-6">
            {sessions.map((session) => (
              <div key={session.id} className="relative group animate-slide-up">
                {/* Timeline Circle Bullet */}
                <span className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-primary border-4 border-[#fbfaf7] shadow-sm" />

                <div className="bg-white border border-[#border] rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200">
                  {/* Image Frame */}
                  {session.artwork_url && (
                    <div className="relative w-full aspect-video bg-muted border-b border-[#border] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={session.artwork_url}
                        alt="Drawing Log"
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">
                        {new Date(session.date).toLocaleDateString('th-TH', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-muted/60 transition-all"
                        title="Delete session record"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground/60 hover:text-primary" />
                      </button>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {session.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1. CHECK-IN BOTTOM DRAWER MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            onClick={() => setShowCheckInModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 border-t border-[#border] animate-slide-up z-10 max-h-[85vh] overflow-y-auto pb-12">
            <div className="flex justify-between items-center mb-5 border-b border-[#border] pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-foreground">Lesson Check-In</h2>
                <p className="text-xs text-muted-foreground">Log today&apos;s progress & snap drawing photo</p>
              </div>
              <button 
                onClick={() => {
                  setShowCheckInModal(false);
                  setPreviewImage(null);
                  setCheckInFile(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Attendance Date</label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Drawing Photo Uploader */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Snap Drawing / Photo</label>
                
                {previewImage ? (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#border] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewImage} alt="Preview Upload" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setCheckInFile(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#border] hover:border-primary/50 py-8 rounded-xl flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all text-muted-foreground hover:text-primary"
                  >
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">Upload/Snap Artwork Image</span>
                    <span className="text-[10px] text-muted-foreground/75 mt-0.5">Accesses camera on mobile</span>
                  </button>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment" // Forces back-camera on mobile devices!
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Progress Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Lesson Progress Notes</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What drawing techniques were practiced? e.g. Watercolor color blending, sky sketches..."
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-xl font-semibold text-sm active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading Artwork & Checking In...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4.5 h-4.5" /> Confirm Check-In Lesson
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT STUDENT PROFILE DRAWER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            onClick={() => setShowEditModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 border-t border-[#border] animate-slide-up z-10 max-h-[85vh] overflow-y-auto pb-12">
            <div className="flex justify-between items-center mb-5 border-b border-[#border] pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-foreground">Edit Student Record</h2>
                <p className="text-xs text-muted-foreground">Modify lessons packages & contact details</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Student Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                />
              </div>

              {/* Nickname & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Nickname</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Complete</option>
                  </select>
                </div>
              </div>

              {/* Completed / Total Lessons */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Completed Lessons</label>
                  <input
                    type="number"
                    min="0"
                    max={editTotalLessons}
                    value={editCompletedLessons}
                    onChange={(e) => setEditCompletedLessons(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Total Lessons Package</label>
                  <input
                    type="number"
                    min="1"
                    value={editTotalLessons}
                    onChange={(e) => setEditTotalLessons(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Parent Phone & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Parent Name</label>
                  <input
                    type="text"
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Parent Phone</label>
                  <input
                    type="tel"
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Social Channels */}
              <div className="space-y-3 bg-muted/50 p-3.5 rounded-2xl border border-[#border]/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8a80]">Direct Contact IDs</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Line ID (without @)</label>
                    <input
                      type="text"
                      value={editLineId}
                      onChange={(e) => setEditLineId(e.target.value)}
                      className="w-full bg-white border border-[#border] rounded-xl py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Facebook Username</label>
                    <input
                      type="text"
                      value={editFacebook}
                      onChange={(e) => setEditFacebook(e.target.value)}
                      className="w-full bg-white border border-[#border] rounded-xl py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Studio Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Studio Notes / Interests</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-semibold text-sm active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 mt-2"
              >
                <Check className="w-4.5 h-4.5" /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
