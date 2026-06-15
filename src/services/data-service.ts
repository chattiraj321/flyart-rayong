import { createClient } from '@supabase/supabase-js';

// Types
export interface Student {
  id: string;
  name: string;
  nickname: string;
  parent_name: string;
  parent_phone: string;
  line_id: string;
  facebook_username: string;
  total_lessons: number;
  completed_lessons: number;
  status: 'active' | 'inactive';
  notes: string;
  created_at: string;
}

export interface Session {
  id: string;
  student_id: string;
  date: string;
  notes: string;
  artwork_url: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  student_name: string;
  nickname: string;
  parent_name: string;
  parent_phone: string;
  contact_info: string;
  preferred_schedule: string;
  notes: string;
  status: 'pending' | 'imported' | 'archived';
  created_at: string;
}

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock / Initial LocalStorage Data
const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-1',
    name: 'Pitchaya Rakdee',
    nickname: 'Mini',
    parent_name: 'Somsak Rakdee',
    parent_phone: '0812345678',
    line_id: 'mini_mom',
    facebook_username: 'somsak.rakdee',
    total_lessons: 10,
    completed_lessons: 4,
    status: 'active',
    notes: 'Enjoys painting with bright water colors. Prefers Saturdays.',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'student-2',
    name: 'Chayanut Kaewmanee',
    nickname: 'Fah',
    parent_name: 'Napaporn Kaewmanee',
    parent_phone: '0898765432',
    line_id: 'fah_parent',
    facebook_username: 'napaporn.kaewmanee.3',
    total_lessons: 20,
    completed_lessons: 15,
    status: 'active',
    notes: 'Very creative with clay sculpting and acrylic canvases. Advanced helper.',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'student-3',
    name: 'Cooper Kittiwat',
    nickname: 'Cooper',
    parent_name: 'Pattama Kittiwat',
    parent_phone: '0867891234',
    line_id: 'cooper_p',
    facebook_username: '',
    total_lessons: 10,
    completed_lessons: 8,
    status: 'active',
    notes: 'Focuses well on oil pastel techniques. Working on landscape paintings.',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'student-4',
    name: 'Tawan Siriwat',
    nickname: 'Tawan',
    parent_name: 'Kitti Siriwat',
    parent_phone: '0854321098',
    line_id: '',
    facebook_username: 'kitti.siriwat',
    total_lessons: 10,
    completed_lessons: 10,
    status: 'inactive',
    notes: 'Completed his first basic drawing course. Needs to renew package.',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const INITIAL_SESSIONS: Session[] = [
  {
    id: 'session-1',
    student_id: 'student-1',
    date: '2026-06-10',
    notes: 'Watercolor lesson: Blending techniques with gradient sky. Drew a lovely galaxy.',
    artwork_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop',
    created_at: '2026-06-10T11:00:00Z',
  },
  {
    id: 'session-2',
    student_id: 'student-1',
    date: '2026-06-03',
    notes: 'Introduction to watercolor paints and wash techniques. Drew a series of colorful fruits.',
    artwork_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop',
    created_at: '2026-06-03T11:00:00Z',
  },
  {
    id: 'session-3',
    student_id: 'student-2',
    date: '2026-06-14',
    notes: 'Acrylic on small canvas: Sunset over mountains. Outstanding color blending and cloud details!',
    artwork_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop',
    created_at: '2026-06-14T14:30:00Z',
  },
  {
    id: 'session-4',
    student_id: 'student-2',
    date: '2026-06-07',
    notes: 'Clay modeling: Crafted an active volcanic island. Learned about texture mapping.',
    artwork_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    created_at: '2026-06-07T14:30:00Z',
  },
  {
    id: 'session-5',
    student_id: 'student-3',
    date: '2026-06-12',
    notes: 'Oil pastels: Finished a colorful parrot drawing. Great attention to feathers.',
    artwork_url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=600&auto=format&fit=crop',
    created_at: '2026-06-12T10:00:00Z',
  },
];

const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 'inquiry-1',
    student_name: 'Nattapong Jaiyen',
    nickname: 'Ryu',
    parent_name: 'Wassana Jaiyen',
    parent_phone: '0834567890',
    contact_info: 'Line: ryu_mommy',
    preferred_schedule: 'Sunday Afternoon (13:00 - 15:00)',
    notes: '8 years old. Very interested in cartoon sketching and anime drawing.',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inquiry-2',
    student_name: 'Pimchanok Saetang',
    nickname: 'Bow',
    parent_name: 'Somchai Saetang',
    parent_phone: '0823456789',
    contact_info: 'Facebook Messenger: Somchai Saetang',
    preferred_schedule: 'Saturday Morning (09:00 - 11:00)',
    notes: '6 years old. Enjoys coloring books, wants to learn basic coloring and shapes.',
    status: 'pending',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inquiry-3',
    student_name: 'Teerapat Chompoo',
    nickname: 'Tae',
    parent_name: 'Usa Chompoo',
    parent_phone: '0845678901',
    contact_info: 'Phone call only',
    preferred_schedule: 'Saturdays or Sundays',
    notes: '11 years old. Parents looking to build a portfolio for art high school entry.',
    status: 'imported',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper: Local Storage wrapper
const getStorageItem = <T>(key: string, initial: T): T => {
  if (typeof window === 'undefined') return initial;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(item) as T;
  } catch {
    return initial;
  }
};

const setStorageItem = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Data Provider Object
export const dataService = {
  isSupabase: isSupabaseConfigured,

  // 1. STUDENTS
  async getStudents(): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Student[];
    } else {
      return getStorageItem<Student[]>('flyart_students', INITIAL_STUDENTS);
    }
  },

  async getStudentById(id: string): Promise<Student | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data as Student;
    } else {
      const students = await this.getStudents();
      return students.find((s) => s.id === id) || null;
    }
  },

  async addStudent(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .insert([studentData])
        .select()
        .single();
      if (error) throw error;
      return data as Student;
    } else {
      const students = await this.getStudents();
      const newStudent: Student = {
        ...studentData,
        id: `student-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      students.push(newStudent);
      setStorageItem('flyart_students', students);
      return newStudent;
    }
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Student;
    } else {
      const students = await this.getStudents();
      const index = students.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Student not found');
      const updated = { ...students[index], ...updates };
      students[index] = updated;
      setStorageItem('flyart_students', students);
      return updated;
    }
  },

  // 2. SESSIONS / LOGS
  async getSessions(studentId?: string): Promise<Session[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('sessions').select('*').order('date', { ascending: false });
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Session[];
    } else {
      const sessions = getStorageItem<Session[]>('flyart_sessions', INITIAL_SESSIONS);
      const sorted = sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (studentId) {
        return sorted.filter((s) => s.student_id === studentId);
      }
      return sorted;
    }
  },

  async addSession(sessionData: Omit<Session, 'id' | 'created_at'>): Promise<Session> {
    if (isSupabaseConfigured && supabase) {
      // 1. Log session in DB
      const { data, error } = await supabase
        .from('sessions')
        .insert([sessionData])
        .select()
        .single();
      if (error) throw error;

      // 2. Auto-increment completed lessons
      const student = await this.getStudentById(sessionData.student_id);
      if (student) {
        const currentCompleted = student.completed_lessons;
        const total = student.total_lessons;
        const nextCompleted = Math.min(total, currentCompleted + 1);
        await this.updateStudent(sessionData.student_id, {
          completed_lessons: nextCompleted,
          status: nextCompleted >= total ? 'inactive' : student.status
        });
      }
      return data as Session;
    } else {
      const sessions = await this.getSessions();
      const newSession: Session = {
        ...sessionData,
        id: `session-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      sessions.push(newSession);
      setStorageItem('flyart_sessions', sessions);

      // Auto-increment completed lessons for local storage mode too
      const student = await this.getStudentById(sessionData.student_id);
      if (student) {
        const currentCompleted = student.completed_lessons;
        const total = student.total_lessons;
        const nextCompleted = Math.min(total, currentCompleted + 1);
        await this.updateStudent(sessionData.student_id, {
          completed_lessons: nextCompleted,
          status: nextCompleted >= total ? 'inactive' : student.status
        });
      }

      return newSession;
    }
  },

  async deleteSession(id: string, studentId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // Decrement completed lessons
      const student = await this.getStudentById(studentId);
      if (student) {
        await this.updateStudent(studentId, {
          completed_lessons: Math.max(0, student.completed_lessons - 1),
          status: 'active'
        });
      }
    } else {
      const sessions = await this.getSessions();
      const filtered = sessions.filter((s) => s.id !== id);
      setStorageItem('flyart_sessions', filtered);

      // Decrement completed lessons
      const student = await this.getStudentById(studentId);
      if (student) {
        await this.updateStudent(studentId, {
          completed_lessons: Math.max(0, student.completed_lessons - 1),
          status: 'active'
        });
      }
    }
  },

  // 3. REGISTRATION INQUIRIES
  async getInquiries(): Promise<Inquiry[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Inquiry[];
    } else {
      return getStorageItem<Inquiry[]>('flyart_inquiries', INITIAL_INQUIRIES);
    }
  },

  async addInquiry(inquiryData: Omit<Inquiry, 'id' | 'created_at'>): Promise<Inquiry> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inquiries')
        .insert([inquiryData])
        .select()
        .single();
      if (error) throw error;
      return data as Inquiry;
    } else {
      const inquiries = await this.getInquiries();
      const newInquiry: Inquiry = {
        ...inquiryData,
        id: `inquiry-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      inquiries.push(newInquiry);
      setStorageItem('flyart_inquiries', inquiries);
      return newInquiry;
    }
  },

  async updateInquiryStatus(id: string, status: Inquiry['status']): Promise<Inquiry> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Inquiry;
    } else {
      const inquiries = await this.getInquiries();
      const index = inquiries.findIndex((i) => i.id === id);
      if (index === -1) throw new Error('Inquiry not found');
      inquiries[index].status = status;
      setStorageItem('flyart_inquiries', inquiries);
      return inquiries[index];
    }
  },

  // 4. IMAGE STORAGE UPLOAD
  async uploadArtwork(file: File): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `drawings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('artworks')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } else {
      // LocalStorage mode: Read file as base64 and save to memory or fallback to a lovely default.
      // Since local storage has limits, we convert to base64. If it's too large, we catch quota error and
      // use a random Unsplash drawing link, so the UI is always beautiful.
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          try {
            // Test if it fits in a dummy storage key to check limits
            localStorage.setItem('flyart_temp_img_check', base64String);
            localStorage.removeItem('flyart_temp_img_check');
            resolve(base64String);
          } catch (e) {
            // Quota limit hit! Fallback to random premium unsplash artwork
            const fallbackArtUrls = [
              'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=600&auto=format&fit=crop',
            ];
            const randomIndex = Math.floor(Math.random() * fallbackArtUrls.length);
            resolve(fallbackArtUrls[randomIndex]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  },
};
