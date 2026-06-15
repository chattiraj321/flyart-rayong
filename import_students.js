const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper: Clean phone number
function cleanPhone(val) {
  if (val === null || val === undefined || val === '-') return '';
  
  let str = String(val).trim();
  
  // If it's a floating point number (e.g. 642894741.0), convert to integer
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  
  // Replace scientific notation if any
  if (str.includes('e')) {
    // Fallback if parsing goes wrong, but let's try standard float conversion
    const num = parseFloat(str);
    if (!isNaN(num)) {
      str = String(Math.floor(num));
    }
  }

  // Strip non-digit characters except commas and spaces
  str = str.replace(/[^0-9,\s]/g, '');

  // If it's a 9-digit number starting with non-zero, prepend '0'
  if (/^[1-9][0-9]{8}$/.test(str)) {
    str = '0' + str;
  }
  
  return str;
}

// Helper: Convert B.E. / Short B.E. year to Gregorian A.D. (YYYY-MM-DD)
function cleanDate(val) {
  if (val === null || val === undefined || val === '-') return null;
  
  const str = String(val).trim();
  if (!str || str === 'null') return null;

  // Pattern: YYYY-MM-DD
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    let year = parseInt(match[1], 10);
    const month = match[2];
    const day = match[3];

    // Year conversion rules
    if (year < 2000) {
      year = year + 57; // e.g. 1968 -> 2025 A.D.
    } else if (year > 2400) {
      year = year - 543; // e.g. 2568 -> 2025 A.D.
    }

    return `${year}-${month}-${day}`;
  }

  return str;
}

// Helper: Format expiration month to readable Thai B.E. format
// e.g. "8/68" -> "สิงหาคม 2568"
function formatExpirationMonth(val) {
  if (val === null || val === undefined || val === '-') return '';
  
  const str = String(val).trim();
  const match = str.match(/^(\d{1,2})\/(\d{2})$/);
  if (match) {
    const monthNum = parseInt(match[1], 10);
    const yearYY = parseInt(match[2], 10);

    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    if (monthNum >= 1 && monthNum <= 12) {
      const monthName = thaiMonths[monthNum - 1];
      const yearBE = 2500 + yearYY;
      return `${monthName} ${yearBE}`;
    }
  }

  return str;
}

// Helper: Map course types
function mapCourse(val) {
  if (val === 'รายครั้ง') return 'once';
  if (val === 'ราย 3 เดือน') return '3months';
  if (val === 'ราย 5 เดือน') return '5months';
  if (val === 'ราย 1 ปี') return '1year';
  return 'once'; // Default fallback
}

// Helper: Get default total lessons based on course
function getDefaultTotalLessons(course) {
  if (course === 'once') return 1;
  if (course === '3months') return 12;
  if (course === '5months') return 20;
  if (course === '1year') return 48;
  return 10;
}

// Main function
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  // Load env variables
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found at', envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });

  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  
  // Prefer service role key if provided in environment or .env.local
  const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || 
                      process.env['SUPABASE_SERVICE_ROLE_KEY'] || 
                      env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  const isServiceRole = supabaseKey === env['SUPABASE_SERVICE_ROLE_KEY'] || 
                        !!process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase config is incomplete in .env.local');
    process.exit(1);
  }

  console.log('--- FlyArt Rayong Student Importer ---');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using Key Type:', isServiceRole ? 'Service Role Key (Bypasses RLS)' : 'Anon Key (Subject to RLS)');
  console.log('Mode:', dryRun ? 'DRY RUN (No database changes will be made)' : 'LIVE IMPORT');

  // Load JSON data
  const dataPath = path.resolve('C:/Users/chatt/.gemini/antigravity-ide/brain/73f051da-3e2b-4adc-9f47-c4eb2f88f0c5/scratch/student_data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Error: student_data.json not found at', dataPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  const rawStudents = JSON.parse(rawData);

  console.log(`Loaded ${rawStudents.length} students from spreadsheet JSON.`);

  // Filter out students who do not have a name or nickname
  const validRawStudents = rawStudents.filter(s => {
    const name = s['ชื่อ-นามสกุล นักเรียน'];
    const nickname = s['ชื่อเล่น'];
    return name && String(name).trim() !== '' && String(name).trim() !== '-' &&
           nickname && String(nickname).trim() !== '' && String(nickname).trim() !== '-';
  });

  console.log(`Filtered out ${rawStudents.length - validRawStudents.length} students without names or nicknames. Remaining: ${validRawStudents.length} students to import.`);

  // Clean and transform students
  const cleanedStudents = validRawStudents.map((s, idx) => {
    const name = String(s['ชื่อ-นามสกุล นักเรียน']).trim();
    const nickname = String(s['ชื่อเล่น']).trim();
    const course = mapCourse(s['หลักสูตร']);
    
    // 2. Parse status
    let status = 'active';
    if (s['สถานะ'] === 'inactive' || s['สถานะ'] === 'ระงับ') {
      status = 'inactive';
    }

    // Combine notes and remarks
    let notesArr = [];
    if (s['รายละเอียด/บันทึกเพิ่มเติม'] && s['รายละเอียด/บันทึกเพิ่มเติม'] !== '-') {
      notesArr.push(s['รายละเอียด/บันทึกเพิ่มเติม']);
    }
    if (s['หมายเหตุ'] && s['หมายเหตุ'] !== '-') {
      notesArr.push(`หมายเหตุ: ${s['หมายเหตุ']}`);
    }
    const notes = notesArr.join(' | ');

    // 3. Determine total lessons limit: "ถ้าเป็น 3 เดือนหรือหมายเหตุวันธรรมดา แสดงผลลิมิต 5 ครั้ง"
    let totalLessons;
    if (course === '3months' || notes.includes('วันธรรมดา')) {
      totalLessons = 5;
    } else {
      totalLessons = getDefaultTotalLessons(course);
    }

    return {
      name: name,
      nickname: nickname,
      birth_date: cleanDate(s['วันเดือนปีเกิด']),
      grade: s['ระดับชั้น'] && s['ระดับชั้น'] !== '-' ? String(s['ระดับชั้น']).trim() : '',
      school: s['โรงเรียน'] && s['โรงเรียน'] !== '-' ? String(s['โรงเรียน']).trim() : '',
      address: s['ที่อยู่'] && s['ที่อยู่'] !== '-' ? String(s['ที่อยู่']).trim() : '',
      student_phone: cleanPhone(s['เบอร์โทรนักเรียน']),
      parent_name: s['ชื่อผู้ปกครอง'] && s['ชื่อผู้ปกครอง'] !== '-' ? String(s['ชื่อผู้ปกครอง']).trim() : '',
      parent_phone: cleanPhone(s['เบอร์โทรติดต่อผู้ปกครอง']),
      line_id: s['ช่องทางติดต่ออื่นๆ'] && s['ช่องทางติดต่ออื่นๆ'] !== '-' ? String(s['ช่องทางติดต่ออื่นๆ']).trim() : '',
      facebook_username: '',
      course_type: course,
      total_lessons: totalLessons,
      completed_lessons: 0,
      status: status,
      notes: notes,
      start_date: cleanDate(s['วันที่เริ่มสมัคร']),
      expiration_month: formatExpirationMonth(s['เดือนที่หมดอายุ'])
    };
  });

  // Print sample clean data
  console.log('\n--- Sample Transformed Records ---');
  for (let i = 0; i < Math.min(3, cleanedStudents.length); i++) {
    console.log(`\nRecord #${i + 1}:`);
    console.log(JSON.stringify(cleanedStudents[i], null, 2));
  }

  if (dryRun) {
    console.log('\nDry run finished. No database changes will be made.');
    return;
  }

  // Connect to Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Clear existing records first
  console.log('\nClearing existing students in database...');
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
  if (deleteError) {
    console.error('Error clearing database:', deleteError.message);
    console.log('Stopping execution.');
    process.exit(1);
  } else {
    console.log('Database table "students" cleared successfully.');
  }

  console.log('\nStarting database inserts...');

  // Let's insert in batches of 10 to keep logs clean and prevent timeout
  const batchSize = 10;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < cleanedStudents.length; i += batchSize) {
    const batch = cleanedStudents.slice(i, i + batchSize);
    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cleanedStudents.length / batchSize)} (${batch.length} records)...`);

    const { data, error } = await supabase
      .from('students')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error inserting batch starting at index ${i}:`, error.message);
      if (error.code === '42501') {
        console.error('\n⚠️ ROW LEVEL SECURITY (RLS) ERROR DETECTED.');
        console.error('Please either:');
        console.error('1. Disable Row-Level Security (RLS) or add an INSERT/UPDATE policy for the "anon" role in Supabase Dashboard -> Table Editor -> students -> RLS policies.');
        console.error('2. Add "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" to your .env.local file so this script can bypass RLS policies.');
        console.error('\nStopping execution due to permission error.');
        process.exit(1);
      }
      failCount += batch.length;
    } else {
      console.log(`Successfully inserted ${data.length} records.`);
      successCount += data.length;
    }
  }

  console.log(`\nImport complete! Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(err => {
  console.error('Unhandled script error:', err);
});
