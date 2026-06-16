'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Inbox, 
  ExternalLink, 
  UserPlus, 
  Archive, 
  CheckCircle,
  HelpCircle,
  X,
  Phone,
  MessageSquare,
  FileText
} from 'lucide-react';
import { dataService, Inquiry } from '@/services/data-service';

// Compliant RFC 4180 CSV parser to support commas and quotes inside fields
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      row.push(currentField.trim());
      if (row.some(field => field !== '')) {
        lines.push(row);
      }
      row = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  if (currentField !== '' || row.length > 0) {
    row.push(currentField.trim());
    if (row.some(field => field !== '')) {
      lines.push(row);
    }
  }

  return lines;
}

// Convert Google Sheet B.E. or A.D. timestamp into ISO Date string
function parseDateToISO(timestampStr: string): string {
  try {
    const parts = timestampStr.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      let year = parseInt(dateParts[2], 10);
      
      if (year > 2400) {
        year -= 543; // convert B.E. to A.D.
      }
      
      let hour = 12, minute = 0, second = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':');
        hour = parseInt(timeParts[0], 10) || 12;
        minute = parseInt(timeParts[1], 10) || 0;
        second = parseInt(timeParts[2], 10) || 0;
      }
      
      const date = new Date(year, month, day, hour, minute, second);
      return date.toISOString();
    }
    return new Date(timestampStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export default function InquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  const loadInquiries = async () => {
    try {
      setLoading(true);

      // 1. Fetch current active students to check if already imported
      const students = await dataService.getStudents();
      const studentNames = new Set(students.map(s => s.name.trim().toLowerCase()));
      const studentNicknames = new Set(students.map(s => s.nickname.trim().toLowerCase()));

      // 2. Fetch from Google Sheet "การตอบแบบฟอร์ม 2"
      const sheetUrl = "https://docs.google.com/spreadsheets/d/1Q_q-iLcVm1UrswQNtjeaDXH0ZjibcHloCba4burB7Lo/export?format=csv&sheet=" + encodeURIComponent("การตอบแบบฟอร์ม 2");
      const res = await fetch(sheetUrl);
      if (!res.ok) {
        throw new Error("ไม่สามารถดาวน์โหลดข้อมูลจาก Google Sheet ได้");
      }
      const csvText = await res.text();

      // 3. Parse CSV rows
      const rows = parseCSV(csvText);
      if (rows.length <= 1) {
        setInquiries([]);
        return;
      }

      // Map rows to Inquiries
      const parsedInquiries: Inquiry[] = rows.slice(1).map((row, index) => {
        const timestamp = row[0] || '';
        const student_name = (row[2] || '').trim();
        const nickname = (row[3] || '').trim();
        const parent_name = (row[4] || '').trim();
        const parent_phone = (row[5] || '').trim();
        const contact_info = (row[6] || '').trim();
        const preferred_schedule = (row[7] || '').trim();
        const notes = (row[8] || '').trim();

        const id = `sheet-inq-${index}-${student_name}`;

        // Check if student with same name or nickname already exists in database
        const isAlreadyImported = 
          studentNames.has(student_name.toLowerCase()) || 
          (nickname && studentNicknames.has(nickname.toLowerCase()));

        return {
          id,
          student_name,
          nickname,
          parent_name,
          parent_phone,
          contact_info,
          preferred_schedule,
          notes,
          created_at: timestamp ? parseDateToISO(timestamp) : new Date().toISOString(),
          status: isAlreadyImported ? 'imported' : 'pending'
        } as Inquiry;
      }).filter(inq => inq.student_name !== '' || inq.nickname !== '');

      // Sort inquiries by newest submission first
      parsedInquiries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setInquiries(parsedInquiries);
    } catch (err) {
      console.error("Failed to load inquiries from Google Sheet:", err);
      // Fallback to local DB inquiries if Google Sheet fetch fails
      try {
        const data = await dataService.getInquiries();
        setInquiries(data);
      } catch (dbErr) {
        console.error("Database fallback failed:", dbErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  // 1-Click Import Student
  const handleImportStudent = async (inquiry: Inquiry) => {
    try {
      // 1. Create student record
      const initialNotes = `ช่วงเวลาเรียนที่สะดวก: ${inquiry.preferred_schedule}\nบันทึกใบสมัคร: ${inquiry.notes}`;
      
      // Parse potential line ID from contact info
      let parsedLineId = '';
      if (inquiry.contact_info.toLowerCase().includes('line:')) {
        parsedLineId = inquiry.contact_info.split(/line:\s*/i)[1]?.trim() || '';
      } else if (inquiry.contact_info.toLowerCase().includes('line')) {
        parsedLineId = inquiry.contact_info.replace(/line\s*/i, '').trim();
      }

      // Parse facebook from contact info
      let parsedFb = '';
      if (inquiry.contact_info.toLowerCase().includes('facebook:') || inquiry.contact_info.toLowerCase().includes('messenger:')) {
        parsedFb = inquiry.contact_info.split(/(?:facebook|messenger):\s*/i)[1]?.trim() || '';
      }

      await dataService.addStudent({
        name: inquiry.student_name || inquiry.nickname,
        nickname: inquiry.nickname || inquiry.student_name || '',
        parent_name: inquiry.parent_name || '',
        parent_phone: inquiry.parent_phone || '',
        line_id: parsedLineId,
        facebook_username: parsedFb,
        total_lessons: 10, // Default package
        completed_lessons: 0,
        status: 'active',
        notes: initialNotes,
        course_category: 'basic',
      });

      // 2. Update Inquiry status to imported (if it is a database record)
      if (!inquiry.id.startsWith('sheet-inq-')) {
        try {
          await dataService.updateInquiryStatus(inquiry.id, 'imported');
        } catch (dbErr) {
          console.error("Failed to update status in DB:", dbErr);
        }
      }

      // 3. Reload list
      await loadInquiries();
      
      // 4. Alert user & suggest navigation
      const navigateToStudent = window.confirm(`นำเข้าข้อมูล "${inquiry.student_name || inquiry.nickname} (${inquiry.nickname || 'ไม่มีชื่อเล่น'})" เข้าสู่รายชื่อนักเรียนใหม่เรียบร้อยแล้ว! คุณต้องการเปิดไปดูหน้าโปรไฟล์นักเรียนตอนนี้เลยหรือไม่?`);
      if (navigateToStudent) {
        // Find the newly created student by name (since nickname/name matches)
        const students = await dataService.getStudents();
        const created = students.find(s => s.name === (inquiry.student_name || inquiry.nickname));
        if (created) {
          router.push(`/students/${created.id}`);
        }
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  // Archive Inquiry
  const handleArchiveInquiry = async (id: string) => {
    if (id.startsWith('sheet-inq-')) {
      alert('ข้อมูลใบสมัครสมัครนี้ดึงข้อมูลสดมาจาก Google Sheet\n\nหากคุณต้องการลบหรือเก็บถาวร กรุณาเข้าไปลบแถวข้อมูลในไฟล์สเปรดชีต Google Sheet โดยตรงครับ');
      return;
    }
    try {
      await dataService.updateInquiryStatus(id, 'archived');
      await loadInquiries();
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const pendingInquiries = inquiries.filter(i => i.status === 'pending');
  const archivedOrImported = inquiries.filter(i => i.status !== 'pending');

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#eae7df] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif flex items-center gap-2">
            กล่องใบสมัครเรียน
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ดูรายละเอียดประวัติการกรอกฟอร์มลงทะเบียนของนักเรียนใหม่
          </p>
        </div>
        <button
          onClick={() => setShowGuide(true)}
          className="text-primary hover:text-primary/95 flex items-center gap-1 text-xs font-semibold py-1.5 px-3 bg-primary/10 rounded-xl"
        >
          <HelpCircle className="w-4 h-4" /> คู่มือเชื่อมฟอร์ม
        </button>
      </div>

      {/* Google Sheets / Responses Action buttons */}
      <div className="bg-white border border-[#eae7df] rounded-2xl p-4 space-y-3.5 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ระบบรับสมัครออนไลน์</h3>
          <p className="text-xs text-foreground/80 leading-relaxed">
            ผู้ปกครองกรอกสมัครผ่านฟอร์ม คุณสามารถคลิกด้านล่างเพื่อเปิดแบบฟอร์มหรือเปิดสเปรดชีตแสดงข้อมูลดิบต้นฉบับได้ทันที
          </p>
        </div>
        
        <div className="flex gap-2">
          <a
            href="https://docs.google.com/forms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border border-[#eae7df] hover:border-[#8e8a80] text-foreground py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            กูเกิลฟอร์ม <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
          <a
            href="https://docs.google.com/spreadsheets/d/1Q_q-iLcVm1UrswQNtjeaDXH0ZjibcHloCba4burB7Lo/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#107c41]/10 text-[#107c41] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            กูเกิลชีต <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Course Templates (PDF) */}
        <div className="border-t border-[#eae7df]/60 pt-3.5 space-y-2">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">เทมเพลตแผนการเรียน (PDF)</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <a
              href="/data/flyart1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#eae7df] hover:border-primary/45 hover:bg-primary/5 text-foreground hover:text-primary py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs text-center"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium">Level 1 (20 ชม.)</span>
            </a>
            <a
              href="/data/flyart2.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#eae7df] hover:border-primary/45 hover:bg-primary/5 text-foreground hover:text-primary py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs text-center"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium">Level 2 (40 ชม.)</span>
            </a>
            <a
              href="/data/flyart3.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#eae7df] hover:border-primary/45 hover:bg-primary/5 text-foreground hover:text-primary py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs text-center"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium">Level 3 (60 ชม.)</span>
            </a>
            <a
              href="/data/flyart4.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#eae7df] hover:border-primary/45 hover:bg-primary/5 text-foreground hover:text-primary py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs text-center"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium">Level 4 (80 ชม.)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Inbox */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-muted-foreground">กำลังตรวจสอบรายการใบสมัครใหม่...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Inquiries Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Inbox className="w-4 h-4" />
              รายการใบสมัครใหม่รอการตรวจสอบ ({pendingInquiries.length})
            </h2>

            {pendingInquiries.length === 0 ? (
              <div className="bg-white border border-dashed border-[#eae7df] rounded-2xl py-8 px-4 text-center">
                <p className="text-xs text-muted-foreground font-medium">กล่องจดหมายว่าง! ยังไม่มีใบสมัครค้างอยู่ขณะนี้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="bg-white border border-[#eae7df] rounded-2xl p-4.5 space-y-3 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Header info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          {inquiry.nickname ? (
                            <>
                              น้อง{inquiry.nickname}
                              <span className="text-xs font-normal text-muted-foreground bg-muted py-0.5 px-2 rounded-md font-sans">
                                ({inquiry.student_name})
                              </span>
                            </>
                          ) : (
                            inquiry.student_name
                          )}
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          ส่งเมื่อ: {new Date(inquiry.created_at).toLocaleString('th-TH', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent uppercase tracking-wider">
                        รอดำเนินการ
                      </span>
                    </div>

                    {/* Registration details */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-muted/30 p-2.5 rounded-xl border border-[#eae7df]/40 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold">ผู้ปกครอง</span>
                        <p className="font-semibold text-foreground truncate">{inquiry.parent_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold">เบอร์โทร</span>
                        <p className="font-semibold text-foreground truncate font-sans">{inquiry.parent_phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">เวลาเรียนที่สนใจ</span>
                        <p className="font-semibold text-foreground">{inquiry.preferred_schedule || 'ระบุภายหลัง'}</p>
                      </div>
                    </div>

                    {/* Inquiry Notes */}
                    {inquiry.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed italic bg-amber-50/25 border-l-2 border-accent/40 pl-2.5 py-1">
                        &ldquo;{inquiry.notes}&rdquo;
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center border-t border-[#eae7df]/50 pt-3">
                      <div className="flex gap-2">
                        {inquiry.parent_phone && (
                          <a
                            href={`tel:${inquiry.parent_phone}`}
                            className="bg-secondary/10 text-secondary p-2 rounded-xl hover:scale-105 active:scale-95 transition-all"
                            title="โทรด่วนหาผู้ปกครอง"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {inquiry.contact_info && (
                          <div
                            className="bg-muted text-muted-foreground p-2 rounded-xl text-[10px] font-medium flex items-center gap-1"
                            title={inquiry.contact_info}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="max-w-[80px] truncate">{inquiry.contact_info}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleArchiveInquiry(inquiry.id)}
                          className="bg-muted hover:bg-muted/80 text-muted-foreground p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                          title="เก็บถาวรใบสมัครนี้"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleImportStudent(inquiry)}
                          className="bg-primary hover:bg-primary/95 text-white py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> นำเข้ารายชื่อนักเรียน
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed/Imported Inquiries Section */}
          {archivedOrImported.length > 0 && (
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                รายการสมัครเรียนที่ดำเนินแล้ว ({archivedOrImported.length})
              </h2>
              <div className="space-y-2">
                {archivedOrImported.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="bg-white/60 border border-[#eae7df]/60 rounded-xl p-3 flex justify-between items-center text-xs shadow-xs"
                  >
                    <div>
                      <h4 className="font-bold text-foreground/80">
                        {inquiry.nickname ? `น้อง${inquiry.nickname} (${inquiry.student_name})` : inquiry.student_name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {inquiry.status === 'imported' ? 'นำเข้ารายชื่อนักเรียนสำเร็จแล้ว' : 'เก็บถาวรประวัติสมัคร'}
                      </p>
                    </div>
                    <div>
                      {inquiry.status === 'imported' ? (
                        <span className="bg-secondary/10 text-secondary flex items-center gap-1 py-1 px-2.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" /> นำเข้าสำเร็จ
                        </span>
                      ) : (
                        <span className="bg-muted text-muted-foreground py-1 px-2.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                          เก็บถาวร
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONNECTION GUIDE MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setShowGuide(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-[#eae7df] animate-slide-up z-10 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 border-b border-[#eae7df] pb-3">
              <div>
                <h3 className="text-base font-bold font-serif text-foreground">การตั้งเชื่อมต่อ Google Forms</h3>
                <p className="text-[10px] text-muted-foreground">วิธีให้ฟอร์มสมัครเรียนส่งข้อมูลเข้าหน้านี้โดยอัตโนมัติ</p>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <p>
                ผู้ดูแลระบบสามารถเขียนสคริปต์สั้นๆ ใน Google Apps Script ของ Sheets เพื่อสั่งให้ทุกครั้งที่มีเด็กมาสมัครเรียนข้อมูลจะถูกส่งมาแสดงในกล่องข้อมูลนี้ได้ทันที:
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">ขั้นตอนที่ 1: รับ URL Webhook สำหรับอินพุตข้อมูล</h4>
                <p>
                  สร้าง Supabase Webhook หรือจัดตั้ง Next.js API Route ในระบบ เช่น `/api/inquiries` เพื่อเตรียมรับข้อมูลดิบ
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">ขั้นตอนที่ 2: ผูกสคริปต์ Apps Script ในสเปรดชีตของฟอร์ม</h4>
                <p>
                  ไปที่หน้าสเปรดชีตที่ผูกกับ Google Form แล้วคลิกเมนู <strong>ส่วนขยาย &gt; Apps Script</strong> จากนั้นลบโค้ดเดิมแล้ววางสคริปต์นี้ลงไป:
                </p>
                <pre className="bg-slate-50 border border-[#eae7df] p-2 rounded-xl text-[10px] overflow-x-auto text-foreground font-mono">
{`function onSubmit(e) {
  var response = e.values;
  var payload = {
    student_name: response[1],
    nickname: response[2],
    parent_name: response[3],
    parent_phone: response[4],
    contact_info: response[5],
    preferred_schedule: response[6],
    notes: response[7]
  };
  
  UrlFetchApp.fetch("วาง_URL_สำหรับเชื่อมต่อ_ที่นี่", {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">ขั้นตอนที่ 3: ตั้งตัวทริกเกอร์ (Trigger)</h4>
                <p>
                  กดไอคอน **นาฬิกาปลุก (ตัวกระตุ้น/Triggers)** ในเมนูด้านซ้ายของ Apps Script จากนั้นกดปุ่มเพิ่มเพื่อสั่งให้ฟังก์ชัน `onSubmit` ทำงานแบบ **&ldquo;เมื่อส่งแบบฟอร์ม (On form submit)&rdquo;**
                </p>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl font-semibold text-xs transition-all mt-2"
              >
                เข้าใจวิธีทำแล้ว ปิดหน้านี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
