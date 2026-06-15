'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  Inbox, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle,
  Palette,
  Sparkles
} from 'lucide-react';
import { dataService, Student, Session, Inquiry } from '@/services/data-service';

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const [allStudents, allSessions, allInquiries] = await Promise.all([
          dataService.getStudents(),
          dataService.getSessions(),
          dataService.getInquiries(),
        ]);
        setStudents(allStudents);
        setSessions(allSessions);
        setInquiries(allInquiries);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Palette className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium text-sm">กำลังโหลดพื้นที่ทำงานสตูดิโอ...</p>
      </div>
    );
  }

  // Derived statistics
  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalSessions = sessions.length;
  const pendingInquiries = inquiries.filter(i => i.status === 'pending').length;

  // Recent 4 sessions
  const recentSessions = sessions.slice(0, 4);

  // Helper to find student name by ID
  const getStudentNickname = (id: string) => {
    const s = students.find(x => x.id === id);
    return s ? (s.nickname || s.name) : 'ไม่พบข้อมูลนักเรียน';
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header section with brand personality */}
      <div className="flex justify-between items-center border-b border-[#eae7df] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
            FlyArt Rayong
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" />
            ระบบจัดการห้องเรียนสตูดิโอศิลปะ
          </p>
        </div>
        <div className="bg-primary/10 text-primary p-2.5 rounded-full">
          <Palette className="w-6 h-6 stroke-[2px]" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Palette className="w-8 h-8 text-primary animate-pulse mb-3" />
          <p className="text-xs text-muted-foreground">กำลังสรุปผลข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Link 
              href="/students?filter=active"
              className="bg-white border border-[#eae7df] p-3.5 rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all duration-200 shadow-sm"
            >
              <div className="bg-[#fcf7f4] text-primary p-1.5 rounded-lg w-fit">
                <Users className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-foreground tracking-tight">{activeStudents}</span>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">นักเรียนกำลังเรียน</p>
              </div>
            </Link>

            <Link 
              href="/students"
              className="bg-white border border-[#eae7df] p-3.5 rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all duration-200 shadow-sm"
            >
              <div className="bg-[#f4f7f5] text-secondary p-1.5 rounded-lg w-fit">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-foreground tracking-tight">{totalSessions}</span>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">จำนวนเช็คอินรวม</p>
              </div>
            </Link>

            <Link 
              href="/inquiries"
              className="bg-white border border-[#eae7df] p-3.5 rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all duration-200 relative shadow-sm"
            >
              {pendingInquiries > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-ping" />
              )}
              <div className="bg-[#fef9f4] text-accent p-1.5 rounded-lg w-fit">
                <Inbox className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {pendingInquiries}
                </span>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">ใบสมัครใหม่</p>
              </div>
            </Link>
          </div>

          {/* Quick Action Banner */}
          <div className="bg-[#f4f2ea] border border-[#eae7df]/60 p-4 rounded-2xl flex justify-between items-center shadow-sm">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">เช็คอินเข้าเรียนด่วน</h3>
              <p className="text-xs text-muted-foreground">เลือกนักเรียนเพื่ออัปเดตงานศิลปะวันนี้</p>
            </div>
            <Link 
              href="/students" 
              className="bg-primary hover:bg-primary/95 text-white p-2.5 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
            </Link>
          </div>

          {/* Recent Artwork feed */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold tracking-wide uppercase text-muted-foreground/80 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                เช็คอินล่าสุดวันนี้
              </h2>
              <Link href="/students" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                ดูรายชื่อทั้งหมด <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentSessions.length === 0 ? (
              <div className="border-2 border-dashed border-[#eae7df] rounded-2xl py-8 px-4 text-center">
                <p className="text-xs text-muted-foreground font-medium">ยังไม่มีการบันทึกการเข้าเรียนในขณะนี้</p>
                <Link href="/students" className="text-xs text-primary font-bold mt-2 inline-block">
                  คลิกที่นี่เพื่อไปเลือกรายชื่อนักเรียนและเช็คอิน
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentSessions.map((session, index) => (
                  <Link
                    key={session.id}
                    href={`/students/${session.student_id}`}
                    className={`group bg-white border border-[#eae7df] rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm animate-slide-up delay-${(index + 1) * 100}`}
                  >
                    {/* Image frame */}
                    <div className="relative aspect-square w-full bg-slate-100 overflow-hidden border-b border-[#eae7df]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={session.artwork_url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop'} 
                        alt="ผลงานของนักเรียน" 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    {/* Info */}
                    <div className="p-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground line-clamp-1">
                          {getStudentNickname(session.student_id)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(session.date).toLocaleDateString('th-TH', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {session.notes}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
