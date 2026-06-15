'use client';

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Camera, 
  PlusCircle,
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
  // New Edit Form States
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');
  const [editCourseType, setEditCourseType] = useState<'once' | '3months' | '5months' | '1year'>('once');
  const [editStartDate, setEditStartDate] = useState('');
  const [editExpirationMonth, setEditExpirationMonth] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editCourseCategory, setEditCourseCategory] = useState<'basic' | 'ai'>('basic');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Check-In Form State
  const [isPastRecord, setIsPastRecord] = useState(false);

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
      // Populate new edit defaults
      setEditBirthDate(s.birth_date || '');
      setEditGrade(s.grade || '');
      setEditSchool(s.school || '');
      setEditAddress(s.address || '');
      setEditStudentPhone(s.student_phone || '');
      setEditCourseType(s.course_type || 'once');
      setEditStartDate(s.start_date || '');
      setEditExpirationMonth(s.expiration_month || '');
      setEditAvatarUrl(s.avatar_url || '');
      setAvatarPreview(s.avatar_url || null);
      setAvatarFile(null);
      setEditCourseCategory(s.course_category || 'basic');

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
      }, isPastRecord);

      // Reset
      setCheckInNotes('');
      setCheckInFile(null);
      setPreviewImage(null);
      setIsPastRecord(false);
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
      setUploading(true);
      let finalAvatarUrl = editAvatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await dataService.uploadArtwork(avatarFile);
      }

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
        birth_date: editBirthDate || undefined,
        grade: editGrade.trim() || undefined,
        school: editSchool.trim() || undefined,
        address: editAddress.trim() || undefined,
        student_phone: editStudentPhone.trim() || undefined,
        course_type: editCourseType,
        start_date: editStartDate || undefined,
        expiration_month: editExpirationMonth.trim() || undefined,
        avatar_url: finalAvatarUrl || undefined,
        course_category: editCourseCategory,
      });

      setAvatarFile(null);
      setShowEditModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to update student:', err);
    } finally {
      setUploading(false);
    }
  };

  // Delete Student Entire Record
  const handleDeleteStudent = async () => {
    if (!student) return;
    const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประวัติของ "น้อง${student.nickname || student.name}" ทั้งหมด? การดำเนินการนี้จะลบข้อมูลประวัติเช็คอินและรูปภาพผลงานทั้งหมดถาวรและไม่สามารถกู้คืนได้`);
    if (!confirmDelete) return;

    try {
      await dataService.deleteStudent(studentId);
      setShowEditModal(false);
      router.push('/students'); // redirect to student directory
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  // Delete Session
  const handleDeleteSession = async (sessionId: string) => {
    if (!student) return;
    const confirmDelete = window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติคลาสเรียนครั้งนี้? การลบนี้จะลดจำนวนครั้งที่เรียนเสร็จสะสมของนักเรียนลง 1 ครั้งด้วยอัตโนมัติ');
    if (!confirmDelete) return;

    try {
      await dataService.deleteSession(sessionId, studentId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Helper to calculate age
  const getAgeString = (birthDateStr?: string) => {
    if (!birthDateStr) return 'ไม่ได้ระบุ';
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 'ไม่ได้ระบุ';
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    if (years === 0) return `${months} เดือน`;
    return `${years} ปี ${months > 0 ? `${months} เดือน` : ''}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-muted-foreground">กำลังดึงข้อมูลนักเรียน...</p>
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
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-semibold py-1 px-2.5 bg-white border border-[#eae7df] rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </Link>
        <button
          onClick={() => setShowEditModal(true)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 bg-white border border-[#eae7df] rounded-xl shadow-xs"
        >
          <Edit className="w-3.5 h-3.5" /> แก้ไขโปรไฟล์
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white border border-[#eae7df] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex gap-4 items-center border-b border-[#eae7df]/40 pb-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-[#eae7df] shrink-0">
            {student.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.avatar_url} alt={student.name} className="object-cover w-full h-full" />
            ) : (
              <span className="text-xl font-bold text-primary">{student.nickname ? student.nickname[0] : student.name[0]}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-foreground font-serif flex items-center gap-2">
                  {student.name}
                  {student.nickname && (
                    <span className="text-sm font-medium text-muted-foreground bg-muted py-0.5 px-2.5 rounded-lg font-sans">
                      {student.nickname}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">
                  ลงทะเบียนเมื่อ {new Date(student.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                student.status === 'active' 
                  ? 'bg-secondary/15 text-secondary' 
                  : 'bg-primary/15 text-primary'
              }`}>
                {student.status === 'active' ? 'กำลังเรียนอยู่' : 'พักคอร์ส/จบคอร์ส'}
              </span>
            </div>
          </div>
        </div>

        {/* New Attributes Sub-grids */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-[#eae7df] pt-3 pb-1">
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">วันเกิด / อายุ</span>
            <span className="font-semibold text-foreground block">
              {student.birth_date 
                ? `${new Date(student.birth_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} (${getAgeString(student.birth_date)})` 
                : 'ไม่ได้ระบุ'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">ระดับชั้น / โรงเรียน</span>
            <span className="font-semibold text-foreground truncate block">
              {student.grade || 'ไม่ระบุ'} / {student.school || 'ไม่ระบุ'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">เบอร์โทรศัพท์นักเรียน</span>
            <span className="font-semibold text-foreground font-sans block">
              {student.student_phone ? (
                <a href={`tel:${student.student_phone}`} className="underline hover:text-primary">{student.student_phone}</a>
              ) : 'ไม่ได้ระบุ'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">ที่อยู่</span>
            <span className="font-semibold text-foreground truncate block">{student.address || 'ไม่ได้ระบุ'}</span>
          </div>
        </div>

        {/* Course Package Details Sub-grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-[#eae7df] pt-3 pb-1 bg-slate-50/50 p-3 rounded-2xl border border-[#eae7df]/40">
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">ประเภทคอร์ส/หลักสูตร</span>
            <span className="font-bold text-primary block">
              {student.course_type === 'once' ? 'รายครั้ง' :
               student.course_type === '3months' ? 'ราย 3 เดือน' :
               student.course_type === '5months' ? 'ราย 5 เดือน' :
               student.course_type === '1year' ? 'ราย 1 ปี' : 'รายครั้ง'}
              {student.course_category === 'ai' ? ' (หลักสูตรเสริม AI)' : ' (หลักสูตรพื้นฐาน)'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">เริ่มเรียน & วันหมดอายุ</span>
            <span className="font-semibold text-foreground block">
              {student.start_date ? new Date(student.start_date).toLocaleDateString('th-TH') : 'ไม่ได้ระบุ'} 
              {student.expiration_month ? ` ถึง ${student.expiration_month}` : ''}
            </span>
          </div>
        </div>

        {/* Notes if present */}
        {student.notes && (
          <div className="bg-muted/40 p-3 rounded-xl border border-[#eae7df]/50 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{student.notes}</p>
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
              <MessageSquare className="w-4 h-4 fill-current" /> ทัก Line ผู้ปกครอง
            </a>
          )}
          {student.facebook_username && (
            <a
              href={`https://m.me/${student.facebook_username}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#0084FF]/10 text-[#0084FF] py-2 px-3 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 font-bold text-xs"
            >
              <MessageSquare className="w-4 h-4" /> ทัก Messenger
            </a>
          )}
          {student.parent_phone && (
            <a
              href={`tel:${student.parent_phone}`}
              className="bg-secondary/10 text-secondary p-2 rounded-xl hover:scale-105 active:scale-95 transition-all"
              title="โทรออก"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Progress & Check-in Card */}
      <div className="bg-white border border-[#eae7df] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
          <span>ความก้าวหน้าคอร์สเรียน</span>
          <span className="text-foreground font-sans">
            {student.completed_lessons} / {student.total_lessons} ครั้ง ({completionRate}%)
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
          <span>คงเหลือ: {Math.max(0, student.total_lessons - student.completed_lessons)} ครั้ง</span>
          {completionRate >= 100 && (
            <span className="text-secondary font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> นักเรียนจบคอร์สนี้แล้ว!
            </span>
          )}
        </div>

        {/* Check-In Buttons */}
        <div className="flex flex-col gap-2.5 mt-3.5">
          <button
            onClick={() => {
              setIsPastRecord(false);
              setShowCheckInModal(true);
            }}
            className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-2xl font-semibold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/15"
          >
            <Camera className="w-4.5 h-4.5" /> เช็คอินชั่วโมงเรียนวันนี้
          </button>
          
          <button
            type="button"
            onClick={() => {
              setIsPastRecord(true);
              setShowCheckInModal(true);
            }}
            className="w-full bg-slate-50 border border-[#eae7df] hover:bg-slate-100 text-muted-foreground py-2.5 rounded-2xl font-semibold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-primary" /> เพิ่มรูปภาพ / บันทึกผลงานย้อนหลัง
          </button>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold tracking-wide uppercase text-muted-foreground/80 flex items-center gap-1.5">
          <Calendar className="w-4.5 h-4.5" />
          บันทึกและประวัติผลงานวาดเขียน ({sessions.length})
        </h3>

        {sessions.length === 0 ? (
          <div className="border-2 border-dashed border-[#eae7df] rounded-2xl py-12 px-4 text-center">
            <p className="text-sm font-semibold text-foreground">ยังไม่มีประวัติการเช็คอินคลาสเรียน</p>
            <p className="text-xs text-muted-foreground mt-1">
              แตะปุ่มเช็คอินด้านบนเพื่ออัปโหลดชิ้นงานคลาสเรียนคลาสแรกของเด็ก
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-[#eae7df] ml-4.5 pl-6 space-y-6">
            {sessions.map((session) => (
              <div key={session.id} className="relative group animate-slide-up">
                {/* Timeline Circle Bullet */}
                <span className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-primary border-4 border-[#fbfaf7] shadow-sm" />

                <div className="bg-white border border-[#eae7df] rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200">
                  {/* Image Frame */}
                  {session.artwork_url && (
                    <div className="relative w-full aspect-video bg-muted border-b border-[#eae7df] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={session.artwork_url}
                        alt="รูปภาพผลงานวาดเขียน"
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
                        title="ลบเช็คอินนี้"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground/60 hover:text-primary" />
                      </button>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
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
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 border-t border-[#eae7df] animate-slide-up z-10 max-h-[85vh] overflow-y-auto pb-12">
            <div className="flex justify-between items-center mb-5 border-b border-[#eae7df] pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-foreground">เช็คอินคลาสเรียนศิลปะ</h2>
                <p className="text-xs text-muted-foreground">บันทึกพัฒนาการของเด็กและถ่ายรูปผลงานวันนี้</p>
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
                <label className="text-xs font-bold text-muted-foreground">วันที่เข้าเรียน</label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Past Record Option Checkbox */}
              <div className="flex items-center gap-2 py-2 px-3 bg-amber-50/40 border border-amber-100/40 rounded-xl">
                <input
                  type="checkbox"
                  id="pastRecordCheckbox"
                  checked={isPastRecord}
                  onChange={(e) => setIsPastRecord(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary text-primary border-[#eae7df] cursor-pointer"
                />
                <label htmlFor="pastRecordCheckbox" className="text-xs font-bold text-foreground cursor-pointer select-none">
                  บันทึกเป็นผลงานย้อนหลัง (ไม่หักครั้งเรียนใหม่)
                </label>
              </div>

              {/* Drawing Photo Uploader */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">อัปโหลดผลงานศิลปะวันนี้</label>
                
                {previewImage ? (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#eae7df] group">
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
                    className="w-full border-2 border-dashed border-[#eae7df] hover:border-primary/50 py-8 rounded-xl flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all text-muted-foreground hover:text-primary"
                  >
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">เลือกภาพผลงานเด็ก หรือถ่ายรูป</span>
                    <span className="text-[10px] text-muted-foreground/75 mt-0.5">สามารถเลือกไฟล์จากแกลเลอรีหรือเปิดกล้องถ่ายภาพได้</span>
                  </button>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Progress Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">บันทึกพัฒนาการ / กิจกรรมคลาสเรียน</label>
                <textarea
                  required
                  rows={3}
                  placeholder="น้องได้ฝึกลงเทคนิคสีอะไร วาดอะไรเพิ่มเติม มีความก้าวหน้าส่วนใดบ้าง..."
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
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
                    <span>กำลังอัปโหลดรูปและดำเนินการเช็คอิน...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4.5 h-4.5" /> ยืนยันการเข้าเรียน (เช็คอิน)
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
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 border-t border-[#eae7df] animate-slide-up z-10 max-h-[85vh] overflow-y-auto pb-12">
            <div className="flex justify-between items-center mb-5 border-b border-[#eae7df] pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-foreground">แก้ไขข้อมูลประวัตินักเรียน</h2>
                <p className="text-xs text-muted-foreground">แก้ไขเบอร์ติดต่อผู้ปกครองและจำนวนชั่วโมงเรียน</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              {/* SECTION 1: Personal Info */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8a80] block border-b border-[#eae7df] pb-1">1. ข้อมูลส่วนตัวนักเรียน</span>
                
                {/* Face photo avatar uploader */}
                <div className="flex flex-col items-center py-2">
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full overflow-hidden bg-primary/10 border-2 border-dashed border-[#eae7df] hover:border-primary flex items-center justify-center cursor-pointer group transition-all"
                  >
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Avatar Preview" className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground text-[10px] font-bold">
                        <Camera className="w-5 h-5 mb-0.5 text-muted-foreground/60" />
                        <span>เพิ่มรูปเด็ก</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-all">
                      เปลี่ยนรูป
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        setEditAvatarUrl('');
                      }}
                      className="text-[10px] text-red-500 font-bold mt-1.5 hover:underline"
                    >
                      ลบรูปโปรไฟล์
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">ชื่อ-นามสกุล นักเรียน *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">ชื่อเล่น</label>
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">สถานะของนักเรียน</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    >
                      <option value="active">กำลังเรียนอยู่ (Active)</option>
                      <option value="inactive">พักคอร์ส/จบคอร์ส</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">วันเดือนปีเกิด</label>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">เบอร์โทรศัพท์นักเรียน</label>
                    <input
                      type="tel"
                      value={editStudentPhone}
                      onChange={(e) => setEditStudentPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">ระดับชั้น</label>
                    <input
                      type="text"
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">โรงเรียน</label>
                    <input
                      type="text"
                      value={editSchool}
                      onChange={(e) => setEditSchool(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">ที่อยู่</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 2: Parent Info */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8a80] block border-b border-[#eae7df] pb-1">2. ข้อมูลติดต่อผู้ปกครอง</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">ชื่อผู้ปกครอง</label>
                    <input
                      type="text"
                      value={editParentName}
                      onChange={(e) => setEditParentName(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">เบอร์โทรผู้ปกครอง</label>
                    <input
                      type="tel"
                      value={editParentPhone}
                      onChange={(e) => setEditParentPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Line ID (ไม่มี @)</label>
                    <input
                      type="text"
                      value={editLineId}
                      onChange={(e) => setEditLineId(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Facebook Username</label>
                    <input
                      type="text"
                      value={editFacebook}
                      onChange={(e) => setEditFacebook(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Course & Package */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8a80] block border-b border-[#eae7df] pb-1">3. ข้อมูลหลักสูตร / คลาสเรียน</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">หลักสูตรสมัครเรียน</label>
                    <select
                      value={editCourseType}
                      onChange={(e) => setEditCourseType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    >
                      <option value="once">รายครั้ง</option>
                      <option value="3months">ราย 3 เดือน</option>
                      <option value="5months">ราย 5 เดือน</option>
                      <option value="1year">ราย 1 ปี</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">คลาสที่เรียนเสร็จแล้ว (ครั้ง)</label>
                    <input
                      type="number"
                      min="0"
                      max={editTotalLessons}
                      value={editCompletedLessons}
                      onChange={(e) => setEditCompletedLessons(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">ประเภทหลักสูตรย่อย</label>
                  <select
                    value={editCourseCategory}
                    onChange={(e) => setEditCourseCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                  >
                    <option value="basic">หลักสูตรพื้นฐาน</option>
                    <option value="ai">หลักสูตรเสริม AI</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">จำนวนคลาสทั้งหมด (ครั้ง)</label>
                    <input
                      type="number"
                      min="1"
                      value={editTotalLessons}
                      onChange={(e) => setEditTotalLessons(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">วันที่เริ่มสมัคร</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">เดือนที่หมดอายุ</label>
                  <input
                    type="text"
                    placeholder="เช่น ตุลาคม 2569"
                    value={editExpirationMonth}
                    onChange={(e) => setEditExpirationMonth(e.target.value)}
                    className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2 px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 4: Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">บันทึกความสนใจหรือข้อแนะนำเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-[#eae7df] rounded-xl py-2.5 px-3 text-sm focus:outline-none resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white py-3.5 rounded-xl font-semibold text-sm active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 mt-2"
              >
                <Check className="w-4.5 h-4.5" /> บันทึกข้อมูลที่แก้ไข
              </button>

              {/* Delete Student */}
              <button
                type="button"
                onClick={handleDeleteStudent}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-xl font-semibold text-sm active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-2.5 border border-red-200"
              >
                <Trash2 className="w-4 h-4" /> ลบรายชื่อนักเรียนคนนี้ออกจากสตูดิโอ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
