'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  MessageSquare, 
  Phone, 
  Plus, 
  X, 
  Check, 
  ChevronRight, 
  SlidersHorizontal,
  PlusCircle
} from 'lucide-react';
import { dataService, Student } from '@/services/data-service';

// Inner component that uses searchParams
function StudentDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [facebookUsername, setFacebookUsername] = useState('');
  const [totalLessons, setTotalLessons] = useState(10);
  const [notes, setNotes] = useState('');

  // Load students
  const loadStudents = async () => {
    try {
      const allStudents = await dataService.getStudents();
      setStudents(allStudents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    
    // Check if URL contains query parameter to add a student
    if (searchParams.get('add') === 'true') {
      setShowAddForm(true);
    }
    
    // Check filter parameter if coming from dashboard
    const filterParam = searchParams.get('filter');
    if (filterParam === 'active' || filterParam === 'inactive') {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  // Handle Close Modal
  const handleCloseForm = () => {
    setShowAddForm(false);
    // Remove query params from URL
    router.replace('/students');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await dataService.addStudent({
        name,
        nickname: nickname.trim(),
        parent_name: parentName.trim(),
        parent_phone: parentPhone.trim(),
        line_id: lineId.trim(),
        facebook_username: facebookUsername.trim(),
        total_lessons: Number(totalLessons) || 10,
        completed_lessons: 0,
        status: 'active',
        notes: notes.trim(),
      });

      // Reset Form
      setName('');
      setNickname('');
      setParentName('');
      setParentPhone('');
      setLineId('');
      setFacebookUsername('');
      setTotalLessons(10);
      setNotes('');

      handleCloseForm();
      loadStudents();
    } catch (err) {
      console.error('Failed to add student:', err);
    }
  };

  // Filter and search computation
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.nickname.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-slide-up relative min-h-[80vh]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
            Student Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage student course plans & contacts
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or nickname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#border] rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/70 transition-all shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="text-[#8e8a80] mr-1">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-xs font-semibold py-1.5 px-3.5 rounded-full capitalize border transition-all ${
                statusFilter === status
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-muted-foreground border-[#border] hover:border-[#8e8a80]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-muted-foreground">Loading directory...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="border-2 border-dashed border-[#border] rounded-2xl py-12 px-4 text-center">
          <p className="text-sm font-semibold text-foreground">No students found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or add a new student above.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {filteredStudents.map((student) => {
            const completionRate = student.total_lessons > 0 
              ? Math.round((student.completed_lessons / student.total_lessons) * 100)
              : 0;

            return (
              <div
                key={student.id}
                className="bg-white border border-[#border] rounded-2xl p-4 space-y-3.5 hover:shadow-sm transition-all duration-200 shadow-sm"
              >
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <Link href={`/students/${student.id}`} className="group space-y-0.5 flex-1">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {student.name}
                      {student.nickname && (
                        <span className="text-xs font-medium text-muted-foreground bg-muted py-0.5 px-2 rounded-md">
                          {student.nickname}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      Added: {new Date(student.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </Link>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    student.status === 'active' 
                      ? 'bg-secondary/15 text-secondary' 
                      : 'bg-primary/15 text-primary'
                  }`}>
                    {student.status === 'active' ? 'Active' : 'Completed/Inactive'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-muted-foreground">Course Progress</span>
                    <span className="text-foreground">
                      {student.completed_lessons} / {student.total_lessons} lessons ({completionRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        completionRate >= 100 ? 'bg-secondary' : 'bg-primary'
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Contacts & Direct Action Link */}
                <div className="flex items-center justify-between border-t border-[#border]/50 pt-3">
                  <div className="flex items-center gap-2">
                    {/* Line Link */}
                    {student.line_id ? (
                      <a
                        href={`https://line.me/ti/p/~${student.line_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#06C755]/10 text-[#06C755] p-2 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-bold text-xs"
                        title="Chat on Line"
                      >
                        <span className="mr-1 text-[10px] font-semibold">Line</span>
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      </a>
                    ) : (
                      <button 
                        disabled 
                        className="bg-muted text-muted-foreground/45 p-2 rounded-xl cursor-not-allowed flex items-center justify-center text-[10px] font-semibold"
                        title="No Line ID added"
                      >
                        Line (N/A)
                      </button>
                    )}

                    {/* Facebook Link */}
                    {student.facebook_username ? (
                      <a
                        href={`https://m.me/${student.facebook_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#0084FF]/10 text-[#0084FF] p-2 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-bold text-xs"
                        title="Messenger"
                      >
                        <span className="mr-1 text-[10px] font-semibold">Messenger</span>
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button 
                        disabled 
                        className="bg-muted text-muted-foreground/45 p-2 rounded-xl cursor-not-allowed flex items-center justify-center text-[10px] font-semibold"
                        title="No FB username"
                      >
                        Chat (N/A)
                      </button>
                    )}

                    {/* Phone Link */}
                    {student.parent_phone ? (
                      <a
                        href={`tel:${student.parent_phone}`}
                        className="bg-secondary/10 text-secondary p-2 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                        title="Call Parent"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>

                  <Link 
                    href={`/students/${student.id}`}
                    className="text-xs font-bold text-primary flex items-center hover:underline gap-0.5"
                  >
                    Details <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Student Slide-up Drawer Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            onClick={handleCloseForm}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />
          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 border-t border-[#border] animate-slide-up z-10 max-h-[85vh] overflow-y-auto pb-12">
            <div className="flex justify-between items-center mb-5 border-b border-[#border] pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-foreground">Add New Student</h2>
                <p className="text-xs text-muted-foreground">Register student and setup course package</p>
              </div>
              <button 
                onClick={handleCloseForm}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pitchaya Rakdee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Nickname & Lessons */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Nickname</label>
                  <input
                    type="text"
                    placeholder="e.g. Mini"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-slate-50/50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Total Lessons</label>
                  <input
                    type="number"
                    min="1"
                    value={totalLessons}
                    onChange={(e) => setTotalLessons(Number(e.target.value))}
                    className="w-full bg-slate-50/50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Parent Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Parent Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Somsak"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Parent Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0812345678"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full bg-slate-50/50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Chat Deep Links */}
              <div className="space-y-3 bg-muted/50 p-3.5 rounded-2xl border border-[#border]/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e8a80]">Direct Contact IDs</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Line ID (without @)</label>
                    <input
                      type="text"
                      placeholder="e.g. mini_mom"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      className="w-full bg-white border border-[#border] rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Facebook Username (for Messenger)</label>
                    <input
                      type="text"
                      placeholder="e.g. somsak.rakdee"
                      value={facebookUsername}
                      onChange={(e) => setFacebookUsername(e.target.value)}
                      className="w-full bg-white border border-[#border] rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Studio Notes / Focus Areas</label>
                <textarea
                  placeholder="e.g. Enjoys painting with bright water colors. Needs basic shapes help..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50/50 border border-[#border] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-primary/15 active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <Check className="w-4.5 h-4.5" /> Save Registration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDirectory() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <PlusCircle className="w-10 h-10 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium text-sm">Loading Student Directory...</p>
      </div>
    }>
      <StudentDirectoryContent />
    </Suspense>
  );
}
