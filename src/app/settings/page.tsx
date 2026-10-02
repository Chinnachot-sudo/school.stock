'use client';

import React, { useState, useEffect, Suspense, FormEvent, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppUser, UserRole, Customer, IBProgramme, IB_PROGRAMMES, ALL_IB_GRADES, FamilyMember, GuardianRelationship } from '@/types/inventory';

const GUARDIAN_RELATIONSHIPS: GuardianRelationship[] = [
  'Mother',
  'Father',
  'Stepmother',
  'Stepfather',
  'Legal Guardian',
  'Grandmother',
  'Grandfather',
  'Sister',
  'Brother',
  'Other'
];

const STUDENT_GRADE_OPTIONS = [
  {
    group: 'MYP (Middle Years Programme)',
    programme: 'MYP' as IBProgramme,
    grades: [
      'Grade 6 (MYP 1)',
      'Grade 7 (MYP 2)',
      'Grade 8 (MYP 3)',
      'Grade 9 (MYP 4)',
      'Grade 10 (MYP 5)'
    ]
  },
  {
    group: 'DP (Diploma Programme)',
    programme: 'DP' as IBProgramme,
    grades: [
      'Grade 11 (DP 1)',
      'Grade 12 (DP 2)'
    ]
  },
  {
    group: 'CP (Career-related Programme)',
    programme: 'CP' as IBProgramme,
    grades: [
      'Grade 11 (CP 1)',
      'Grade 12 (CP 2)'
    ]
  }
];

import {
  ShieldCheck,
  ShieldAlert,
  Database,
  Sliders,
  School,
  UserCheck,
  CheckCircle2,
  Users,
  Copy,
  ExternalLink,
  QrCode,
  KeyRound,
  Server,
  Building2,
  Layers,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  X,
  Lock,
  User,
  Mail,
  AlertCircle,
  Tag,
  GitPullRequest,
  Hash,
  Bell,
  HardDriveDownload,
  MapPin,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Phone,
  Upload,
  Download,
  FileSpreadsheet,
  FileUp
} from 'lucide-react';

import {
  DepartmentsView,
  PricingPromotionsView,
  ApprovalWorkflowView,
  DocumentNumberingView,
  NotificationsSettingsView,
  BackupMaintenanceView,
  StorageLocationsView,
  UnitsOfMeasureView,
  CategoriesView,
  SystemIntegrationsView
} from '@/components/settings/SettingsSubViews';

import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { SettingsSubTabs, SettingsTabItem } from '@/components/settings/SettingsSubTabs';
import { UserTable, DirectoryItem } from '@/components/settings/UserTable';

type PageKey = 'staff' | 'departments' | 'master_data' | 'commerce' | 'system';

const LEGACY_TAB_MAP: Record<string, { page: PageKey; tab: string }> = {
  users: { page: 'staff', tab: 'all' },
  staff: { page: 'staff', tab: 'all' },
  teachers: { page: 'staff', tab: 'teachers' },
  students: { page: 'staff', tab: 'students' },
  parents: { page: 'staff', tab: 'parents' },
  parents_students: { page: 'staff', tab: 'students' },
  departments: { page: 'departments', tab: 'departments' },
  master: { page: 'master_data', tab: 'categories' },
  categories: { page: 'master_data', tab: 'categories' },
  locations: { page: 'master_data', tab: 'locations' },
  uom: { page: 'master_data', tab: 'uom' },
  pricing: { page: 'commerce', tab: 'pricing' },
  workflow: { page: 'commerce', tab: 'workflow' },
  numbering: { page: 'commerce', tab: 'numbering' },
  notifications: { page: 'system', tab: 'notifications' },
  backup: { page: 'system', tab: 'backup' },
  integrations: { page: 'system', tab: 'integrations' }
};

const MASTER_DATA_TABS: SettingsTabItem[] = [
  { id: 'categories', label: 'Categories', icon: Database },
  { id: 'locations', label: 'Storage Locations', icon: MapPin },
  { id: 'uom', label: 'Units of Measure', icon: Hash }
];

const COMMERCE_TABS: SettingsTabItem[] = [
  { id: 'pricing', label: 'Pricing & Promotions', icon: Tag },
  { id: 'workflow', label: 'Approval Workflow', icon: GitPullRequest },
  { id: 'numbering', label: 'Document Numbering', icon: Hash }
];

const SYSTEM_TABS: SettingsTabItem[] = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'backup', label: 'Backup & Restore', icon: HardDriveDownload },
  { id: 'integrations', label: 'Integrations', icon: Server }
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve initial page & tab with backward compatibility
  const initialResolved = useMemo(() => {
    const pageParam = searchParams.get('page') as PageKey | null;
    const tabParam = searchParams.get('tab');

    if (pageParam && ['staff', 'departments', 'master_data', 'commerce', 'system'].includes(pageParam)) {
      return {
        page: pageParam,
        tab: tabParam || (pageParam === 'staff' ? 'all' : pageParam === 'master_data' ? 'categories' : pageParam === 'commerce' ? 'pricing' : pageParam === 'system' ? 'notifications' : 'departments')
      };
    }

    if (tabParam && LEGACY_TAB_MAP[tabParam]) {
      return LEGACY_TAB_MAP[tabParam];
    }

    return { page: 'staff' as PageKey, tab: 'all' };
  }, [searchParams]);

  const [activePage, setActivePage] = useState<PageKey>(initialResolved.page);
  const [activeTab, setActiveTab] = useState<string>(initialResolved.tab);

  const { user, can } = useAuth();

  // Directory state: both AppUsers and Customers (Students & Parents)
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DirectoryItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states for Add User
  const [addMode, setAddMode] = useState<'single' | 'batch'>('single');
  const [addCategory, setAddCategory] = useState<'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT'>('STAFF');

  // Common & Staff/Teacher fields
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ADMIN');

  // Student specific fields (First Name, Last Name, Nickname separated)
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newProgramme, setNewProgramme] = useState<IBProgramme>('MYP');
  const [newGrade, setNewGrade] = useState('Grade 7 (MYP 2)');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newNote, setNewNote] = useState('');

  // Parent specific fields
  const [newPhone, setNewPhone] = useState('');

  // Family Details State (Add Student)
  const [guardiansList, setGuardiansList] = useState<FamilyMember[]>([
    { id: '1', name: '', relationship: 'Father', phone: '', email: '' },
    { id: '2', name: '', relationship: 'Mother', phone: '', email: '' }
  ]);

  // Family Details State (Edit Student)
  const [editGuardiansList, setEditGuardiansList] = useState<FamilyMember[]>([]);

  const handleAddGuardianRow = () => {
    setGuardiansList((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: '',
        relationship: prev.some((g) => g.relationship === 'Father') ? 'Mother' : 'Father',
        phone: '',
        email: ''
      }
    ]);
  };

  const handleRemoveGuardianRow = (id: string) => {
    setGuardiansList((prev) => (prev.length > 1 ? prev.filter((g) => g.id !== id) : prev.map(g => ({ ...g, name: '', phone: '', email: '' }))));
  };

  const handleUpdateGuardianRow = (id: string, field: keyof FamilyMember, value: string) => {
    setGuardiansList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const handleAddEditGuardianRow = () => {
    setEditGuardiansList((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: '',
        relationship: prev.some((g) => g.relationship === 'Father') ? 'Mother' : 'Father',
        phone: '',
        email: ''
      }
    ]);
  };

  const handleRemoveEditGuardianRow = (id: string) => {
    setEditGuardiansList((prev) => (prev.length > 1 ? prev.filter((g) => g.id !== id) : prev.map(g => ({ ...g, name: '', phone: '', email: '' }))));
  };

  const handleUpdateEditGuardianRow = (id: string, field: keyof FamilyMember, value: string) => {
    setEditGuardiansList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  // Batch Users State (Staff / Teachers)
  interface BatchUserRow {
    id: string;
    name: string;
    username: string;
    password: string;
    email: string;
    role: UserRole;
  }
  const [batchRows, setBatchRows] = useState<BatchUserRow[]>([
    { id: '1', name: '', username: '', password: '', email: '', role: 'ADMIN' },
    { id: '2', name: '', username: '', password: '', email: '', role: 'ADMIN' }
  ]);

  // Batch Students CSV State
  interface CsvStudentRow {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string;
    studentId: string;
    programme: string;
    grade: string;
    fatherName: string;
    fatherPhone: string;
    fatherEmail: string;
    motherName: string;
    motherPhone: string;
    motherEmail: string;
  }
  const [csvStudents, setCsvStudents] = useState<CsvStudentRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvError, setCsvError] = useState<string | null>(null);

  // Batch Staff / Teachers CSV State
  interface CsvStaffRow {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string;
    username: string;
    password: string;
    email: string;
    role: UserRole;
  }
  const [csvStaff, setCsvStaff] = useState<CsvStaffRow[]>([]);
  const [csvStaffFileName, setCsvStaffFileName] = useState('');
  const [csvStaffError, setCsvStaffError] = useState<string | null>(null);

  const handleDownloadStudentTemplate = () => {
    const headers = [
      'first_name',
      'last_name',
      'nickname',
      'student_id',
      'programme',
      'grade',
      'father_name',
      'father_phone',
      'father_email',
      'mother_name',
      'mother_phone',
      'mother_email'
    ];

    const sampleRows = [
      [
        'Sarah',
        'Jenkins',
        'Sarah',
        'STD-2024-001',
        'MYP',
        'Grade 7 (MYP 2)',
        'David Jenkins',
        '081-234-5678',
        'david.j@example.com',
        'Mary Jenkins',
        '082-345-6789',
        'mary.j@example.com'
      ],
      [
        'Alexander',
        'Smith',
        'Alex',
        'STD-2024-002',
        'DP',
        'Grade 11 (DP 1)',
        'John Smith',
        '089-111-2222',
        'john.s@example.com',
        'Elena Smith',
        '089-333-4444',
        'elena.s@example.com'
      ],
      [
        'Somchai',
        'Prasert',
        'Chai',
        'STD-2024-003',
        'CP',
        'Grade 11 (CP 1)',
        'Vichai Prasert',
        '086-555-6677',
        'vichai@example.com',
        'Anong Prasert',
        '086-777-8899',
        'anong@example.com'
      ]
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = (file: File) => {
    if (!file) return;
    setCsvError(null);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setCsvError('Uploaded file is empty.');
          return;
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvError('CSV file has no data rows. Please use the template.');
          return;
        }

        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
              if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (c === ',' && !inQuotes) {
              result.push(cur.trim());
              cur = '';
            } else {
              cur += c;
            }
          }
          result.push(cur.trim());
          return result;
        };

        const rawHeaders = parseLine(lines[0]).map((h) =>
          h.toLowerCase().replace(/[\s_"-]+/g, '')
        );

        const findIdx = (keywords: string[]) =>
          rawHeaders.findIndex((h) => keywords.some((k) => h.includes(k)));

        const idxFirst = findIdx(['firstname', 'first', 'givenname', 'ชื่อจริง', 'ชื่อ']);
        const idxLast = findIdx(['lastname', 'last', 'surname', 'นามสกุล']);
        const idxFull = findIdx(['fullname', 'name', 'studentname', 'ชื่อสกุล']);
        const idxNick = findIdx(['nickname', 'nick', 'ชื่อเล่น']);
        const idxStdId = findIdx(['studentid', 'stdid', 'id', 'รหัส']);
        const idxProg = findIdx(['programme', 'program', 'หลักสูตร']);
        const idxGrade = findIdx(['grade', 'class', 'ชั้น']);
        const idxFName = findIdx(['fathername', 'father', 'พ่อ', 'บิดา']);
        const idxFPhone = findIdx(['fatherphone', 'fphone', 'เบอร์พ่อ']);
        const idxFEmail = findIdx(['fatheremail', 'femail', 'อีเมลพ่อ']);
        const idxMName = findIdx(['mothername', 'mother', 'แม่', 'มารดา']);
        const idxMPhone = findIdx(['motherphone', 'mphone', 'เบอร์แม่']);
        const idxMEmail = findIdx(['motheremail', 'memail', 'อีเมลแม่']);

        const parsed: CsvStudentRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseLine(lines[i]);
          if (cols.every((c) => !c)) continue;

          let fName = idxFirst !== -1 ? cols[idxFirst] || '' : '';
          let lName = idxLast !== -1 ? cols[idxLast] || '' : '';

          if (!fName && idxFull !== -1 && cols[idxFull]) {
            const parts = cols[idxFull].split(/\s+/);
            fName = parts[0] || '';
            lName = parts.slice(1).join(' ') || '';
          }

          if (!fName && !lName) continue;

          let gradeVal = idxGrade !== -1 ? cols[idxGrade] || '' : '';
          let progVal = idxProg !== -1 ? cols[idxProg] || '' : '';

          if (!progVal) {
            if (gradeVal.includes('DP')) progVal = 'DP';
            else if (gradeVal.includes('CP')) progVal = 'CP';
            else progVal = 'MYP';
          }

          if (!gradeVal) {
            if (progVal.toUpperCase().includes('DP')) gradeVal = 'Grade 11 (DP 1)';
            else if (progVal.toUpperCase().includes('CP')) gradeVal = 'Grade 11 (CP 1)';
            else gradeVal = 'Grade 7 (MYP 2)';
          }

          parsed.push({
            id: `csv-${Date.now()}-${i}`,
            firstName: fName,
            lastName: lName,
            nickname: idxNick !== -1 ? cols[idxNick] || '' : '',
            studentId: idxStdId !== -1 ? cols[idxStdId] || '' : '',
            programme: progVal.toUpperCase(),
            grade: gradeVal,
            fatherName: idxFName !== -1 ? cols[idxFName] || '' : '',
            fatherPhone: idxFPhone !== -1 ? cols[idxFPhone] || '' : '',
            fatherEmail: idxFEmail !== -1 ? cols[idxFEmail] || '' : '',
            motherName: idxMName !== -1 ? cols[idxMName] || '' : '',
            motherPhone: idxMPhone !== -1 ? cols[idxMPhone] || '' : '',
            motherEmail: idxMEmail !== -1 ? cols[idxMEmail] || '' : ''
          });
        }

        if (parsed.length === 0) {
          setCsvError('No valid student records found in the CSV. Please check column headers.');
        } else {
          setCsvStudents(parsed);
        }
      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => {
      setCsvError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDownloadStaffTemplate = () => {
    const headers = [
      'first_name',
      'last_name',
      'nickname',
      'username',
      'password',
      'email',
      'role'
    ];

    const sampleRows = [
      ['Somchai', 'Sukjai', 'Chai', 'somchai.s', 'Password123!', 'somchai@roong-aroon.ac.th', 'ADMIN'],
      ['Malee', 'Rakdee', 'Lee', 'malee.r', 'Password123!', 'malee@roong-aroon.ac.th', 'TEACHER'],
      ['Wichai', 'Klangkaew', 'Klang', 'wichai.k', 'Password123!', 'wichai@roong-aroon.ac.th', 'WAREHOUSE'],
      ['Narumon', 'Srichai', 'Mon', 'narumon.s', 'Password123!', 'narumon@roong-aroon.ac.th', 'CASHIER'],
      ['Prasert', 'Panyasart', 'Sert', 'prasert.p', 'Password123!', 'prasert@roong-aroon.ac.th', 'ACCOUNTANT']
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'staff_teacher_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvStaffFileChange = (file: File) => {
    if (!file) return;
    setCsvStaffError(null);
    setCsvStaffFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setCsvStaffError('Uploaded file is empty.');
          return;
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvStaffError('CSV file has no data rows. Please use the template.');
          return;
        }

        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
              if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (c === ',' && !inQuotes) {
              result.push(cur.trim());
              cur = '';
            } else {
              cur += c;
            }
          }
          result.push(cur.trim());
          return result;
        };

        const rawHeaders = parseLine(lines[0]).map((h) =>
          h.toLowerCase().replace(/[\s_"-]+/g, '')
        );

        const findIdx = (keywords: string[]) =>
          rawHeaders.findIndex((h) => keywords.some((k) => h.includes(k)));

        const idxFirst = findIdx(['firstname', 'first', 'givenname', 'ชื่อจริง', 'ชื่อ']);
        const idxLast = findIdx(['lastname', 'last', 'surname', 'นามสกุล']);
        const idxFull = findIdx(['fullname', 'name', 'ชื่อสกุล']);
        const idxNick = findIdx(['nickname', 'nick', 'ชื่อเล่น']);
        const idxUser = findIdx(['username', 'user', 'ชื่อผู้ใช้']);
        const idxPass = findIdx(['password', 'pass', 'รหัสผ่าน']);
        const idxEmail = findIdx(['email', 'mail', 'อีเมล']);
        const idxRole = findIdx(['role', 'systemrole', 'ตำแหน่ง', 'บทบาท']);

        const parsed: CsvStaffRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseLine(lines[i]);
          if (cols.every((c) => !c)) continue;

          let fName = idxFirst !== -1 ? cols[idxFirst] || '' : '';
          let lName = idxLast !== -1 ? cols[idxLast] || '' : '';

          if (!fName && idxFull !== -1 && cols[idxFull]) {
            const parts = cols[idxFull].split(/\s+/);
            fName = parts[0] || '';
            lName = parts.slice(1).join(' ') || '';
          }

          if (!fName && !lName) continue;

          const username = idxUser !== -1 ? cols[idxUser] || '' : '';
          const password = idxPass !== -1 ? cols[idxPass] || '' : 'Password123!';
          const email = idxEmail !== -1 ? cols[idxEmail] || '' : '';
          const rawRole = (idxRole !== -1 ? cols[idxRole] || '' : '').toUpperCase();

          let role: UserRole = addCategory === 'TEACHER' ? 'TEACHER' : 'ADMIN';
          if (rawRole.includes('SUPER')) role = 'SUPER_ADMIN';
          else if (rawRole.includes('WAREHOUSE') || rawRole.includes('คลัง')) role = 'WAREHOUSE';
          else if (rawRole.includes('CASHIER') || rawRole.includes('แคช')) role = 'CASHIER';
          else if (rawRole.includes('ACCOUNT') || rawRole.includes('บัญชี')) role = 'ACCOUNTANT';
          else if (rawRole.includes('TEACH') || rawRole.includes('ครู')) role = 'TEACHER';
          else if (rawRole.includes('ADMIN')) role = 'ADMIN';

          parsed.push({
            id: `csv-staff-${Date.now()}-${i}`,
            firstName: fName,
            lastName: lName,
            nickname: idxNick !== -1 ? cols[idxNick] || '' : '',
            username: username || `${fName.toLowerCase()}.${lName.toLowerCase()}`.replace(/[^a-z0-9_.-]/g, ''),
            password: password,
            email: email || `${username || fName.toLowerCase()}@roong-aroon.ac.th`,
            role
          });
        }

        if (parsed.length === 0) {
          setCsvStaffError('No valid staff/teacher records found in the CSV. Please check column headers.');
        } else {
          setCsvStaff(parsed);
        }
      } catch (err: any) {
        setCsvStaffError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => {
      setCsvStaffError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  // Form states for Edit Modal
  const [editName, setEditName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('ADMIN');
  const [editPassword, setEditPassword] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editProgramme, setEditProgramme] = useState<IBProgramme>('MYP');
  const [editParentName, setEditParentName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNote, setEditNote] = useState('');

  const fetchDirectory = async () => {
    try {
      setLoadingDirectory(true);
      const headers: Record<string, string> = {};
      const localUser = typeof localStorage !== 'undefined' ? localStorage.getItem('school_auth_user') : null;
      if (localUser) {
        headers['x-user'] = encodeURIComponent(localUser);
      }

      const [usersRes, custRes] = await Promise.all([
        fetch('/api/users', { headers }),
        fetch('/api/customers', { headers })
      ]);

      const [usersData, custData] = await Promise.all([
        usersRes.json(),
        custRes.json()
      ]);

      if (usersData.users) {
        setUsersList(usersData.users);
      }
      if (custData.customers) {
        setCustomersList(custData.customers);
      }
    } catch (err) {
      console.error('Failed to fetch directory data:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => {
    if (activePage === 'staff') {
      fetchDirectory();
    }
  }, [activePage]);

  // Sync state if query params change externally
  useEffect(() => {
    const pageParam = searchParams.get('page') as PageKey | null;
    const tabParam = searchParams.get('tab');

    if (pageParam && ['staff', 'departments', 'master_data', 'commerce', 'system'].includes(pageParam)) {
      setActivePage(pageParam);
      if (tabParam) setActiveTab(tabParam);
    } else if (tabParam && LEGACY_TAB_MAP[tabParam]) {
      const mapped = LEGACY_TAB_MAP[tabParam];
      setActivePage(mapped.page);
      setActiveTab(mapped.tab);
    }
  }, [searchParams]);

  // Combine AppUsers and Customers into a single DirectoryItem[]
  const directoryItems: DirectoryItem[] = useMemo(() => {
    const list: DirectoryItem[] = [];

    // 1. Staff and Teachers
    usersList.forEach((u) => {
      const isTeacher = u.role === 'TEACHER';
      list.push({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email || undefined,
        role: u.role,
        category: isTeacher ? 'TEACHER' : 'STAFF',
        status: (u as any).isActive === false ? 'INACTIVE' : 'ACTIVE',
        createdAt: u.createdAt,
        rawItem: u
      });
    });

    // 2. Students and Parents
    customersList.forEach((c) => {
      if (c.type === 'STUDENT') {
        list.push({
          id: c.id,
          name: c.name,
          nickname: c.nickname,
          email: c.email,
          role: 'Student',
          category: 'STUDENT',
          studentId: c.studentId,
          grade: c.grade,
          programme: c.programme,
          parentName: c.parentName,
          guardians: c.guardians,
          phone: c.phone,
          status: 'ACTIVE',
          createdAt: c.createdAt,
          rawItem: c
        });
      } else if (c.type === 'PARENT') {
        list.push({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: 'Parent / Guardian',
          category: 'PARENT',
          parentName: c.parentName, // student in care
          status: 'ACTIVE',
          createdAt: c.createdAt,
          rawItem: c
        });
      }
    });

    return list;
  }, [usersList, customersList]);

  // Navigation handler
  const handleNavigate = (pageId: string, tabId: string) => {
    const p = pageId as PageKey;
    setActivePage(p);
    setActiveTab(tabId);
    router.replace(`/settings?page=${p}&tab=${tabId}`, { scroll: false });
  };

  const handleSubTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/settings?page=${activePage}&tab=${tabId}`, { scroll: false });
  };

  // User management action handlers
  const handleOpenAddModal = (
    mode: 'single' | 'batch',
    defaultCategory?: 'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT'
  ) => {
    setAddMode(mode);
    const cat =
      defaultCategory ||
      (activeTab === 'students'
        ? 'STUDENT'
        : activeTab === 'parents'
        ? 'PARENT'
        : activeTab === 'teachers'
        ? 'TEACHER'
        : 'STAFF');
    setAddCategory(cat);

    // Reset fields
    setNewName('');
    setNewFirstName('');
    setNewLastName('');
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');
    setNewRole(cat === 'TEACHER' ? 'TEACHER' : 'ADMIN');
    setNewNickname('');
    setNewStudentId('');
    setNewProgramme('MYP');
    setNewGrade('Grade 7 (MYP 2)');
    setNewParentName('');
    setNewParentPhone('');
    setNewParentEmail('');
    setNewPhone('');
    setNewNote('');

    // Reset CSV batch state
    setCsvStudents([]);
    setCsvFileName('');
    setCsvError(null);
    setCsvStaff([]);
    setCsvStaffFileName('');
    setCsvStaffError(null);

    // Default 2 guardian rows (Father & Mother) like ManageBac
    setGuardiansList([
      { id: '1', name: '', relationship: 'Father', phone: '', email: '' },
      { id: '2', name: '', relationship: 'Mother', phone: '', email: '' }
    ]);

    setBatchRows([
      { id: '1', name: '', username: '', password: '', email: '', role: cat === 'TEACHER' ? 'TEACHER' : 'ADMIN' },
      { id: '2', name: '', username: '', password: '', email: '', role: cat === 'TEACHER' ? 'TEACHER' : 'ADMIN' }
    ]);

    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleAddBatchRow = () => {
    setBatchRows((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', username: '', password: '', email: '', role: addCategory === 'TEACHER' ? 'TEACHER' : 'ADMIN' }
    ]);
  };

  const handleRemoveBatchRow = (id: string) => {
    setBatchRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateBatchRow = (id: string, field: keyof BatchUserRow, value: any) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Submit Handler for Add User
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setModalLoading(true);
      setModalError(null);

      // CASE 1: STUDENT (No username or password required!)
      if (addCategory === 'STUDENT') {
        if (addMode === 'single') {
          if (!newFirstName.trim() || !newLastName.trim()) {
            setModalError('Both First Name and Last Name are required for student.');
            return;
          }

          const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();
          const activeGuardians = guardiansList.filter((g) => g.name && g.name.trim());
          const primaryPhone = activeGuardians.find((g) => g.phone)?.phone || newParentPhone.trim() || undefined;
          const primaryEmail = activeGuardians.find((g) => g.email)?.email || newParentEmail.trim() || undefined;
          const formattedParentName = activeGuardians.length > 0
            ? activeGuardians.map((g) => `${g.name.trim()} (${g.relationship})`).join(', ')
            : newParentName.trim() || undefined;

          const res = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: fullName,
              nickname: newNickname.trim() || undefined,
              type: 'STUDENT',
              programme: newProgramme,
              grade: newGrade.trim(),
              studentId: newStudentId.trim() || undefined,
              parentName: formattedParentName,
              phone: primaryPhone,
              email: primaryEmail,
              guardians: activeGuardians,
              note: newNote.trim() || undefined
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to create student');

          setIsAddModalOpen(false);
          await fetchDirectory();
        } else {
          // Batch Students from CSV
          if (csvStudents.length === 0) {
            setModalError('Please upload a valid CSV file with student data, or download the template first.');
            return;
          }

          const payload = csvStudents.map((s) => {
            const activeGuardians: FamilyMember[] = [];
            if (s.fatherName.trim()) {
              activeGuardians.push({
                id: '1',
                name: s.fatherName.trim(),
                relationship: 'Father',
                phone: s.fatherPhone.trim() || undefined,
                email: s.fatherEmail.trim() || undefined
              });
            }
            if (s.motherName.trim()) {
              activeGuardians.push({
                id: '2',
                name: s.motherName.trim(),
                relationship: 'Mother',
                phone: s.motherPhone.trim() || undefined,
                email: s.motherEmail.trim() || undefined
              });
            }

            const formattedParentName =
              activeGuardians.length > 0
                ? activeGuardians.map((g) => `${g.name.trim()} (${g.relationship})`).join(', ')
                : undefined;

            let prog: IBProgramme = 'MYP';
            const cleanProg = (s.programme || '').toUpperCase();
            if (cleanProg === 'DP') prog = 'DP';
            else if (cleanProg === 'CP') prog = 'CP';
            else if (cleanProg === 'GENERAL') prog = 'GENERAL';
            else if (s.grade.includes('DP')) prog = 'DP';
            else if (s.grade.includes('CP')) prog = 'CP';

            return {
              name: `${s.firstName.trim()} ${s.lastName.trim()}`.trim(),
              nickname: s.nickname.trim() || undefined,
              type: 'STUDENT',
              programme: prog,
              grade: s.grade.trim() || 'Grade 7 (MYP 2)',
              studentId: s.studentId.trim() || undefined,
              parentName: formattedParentName,
              phone: activeGuardians.find((g) => g.phone)?.phone || undefined,
              email: activeGuardians.find((g) => g.email)?.email || undefined,
              guardians: activeGuardians
            };
          });

          const res = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customers: payload })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to upload students CSV');

          setIsAddModalOpen(false);
          setCsvStudents([]);
          setCsvFileName('');
          await fetchDirectory();
        }
        return;
      }

      // CASE 2: PARENT (No username or password required!)
      if (addCategory === 'PARENT') {
        if (!newName.trim()) {
          setModalError('Parent full name is required.');
          return;
        }

        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName.trim(),
            type: 'PARENT',
            programme: 'GENERAL',
            phone: newPhone.trim() || undefined,
            email: newEmail.trim() || undefined,
            parentName: newParentName.trim() || undefined, // Student in care
            note: newNote.trim() || undefined
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create parent');

        setIsAddModalOpen(false);
        await fetchDirectory();
        return;
      }

      // CASE 3: STAFF & TEACHER (Login credentials required!)
      if (addMode === 'single') {
        if (!newFirstName.trim() || !newLastName.trim()) {
          setModalError('Both First Name and Last Name are required.');
          return;
        }

        if (!newUsername.trim() || !newPassword) {
          setModalError('Username and Initial Password are required.');
          return;
        }

        if (newPassword.length < 8) {
          setModalError('Password must be at least 8 characters long.');
          return;
        }

        const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            nickname: newNickname.trim() || undefined,
            username: newUsername.trim(),
            password: newPassword,
            email: newEmail.trim() || undefined,
            role: addCategory === 'TEACHER' ? 'TEACHER' : newRole
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create user');
        }

        setIsAddModalOpen(false);
        await fetchDirectory();
      } else {
        // Batch Staff / Teachers CSV upload
        if (csvStaff.length === 0) {
          setModalError('Please upload a valid CSV file with staff/teacher data, or download the template first.');
          return;
        }

        for (let i = 0; i < csvStaff.length; i++) {
          const row = csvStaff[i];
          if (!row.firstName.trim() || !row.lastName.trim() || !row.username.trim() || !row.password) {
            setModalError(`Row #${i + 1} (${row.firstName || 'User'}) is missing required fields (First Name, Last Name, Username, or Password).`);
            return;
          }
          if (row.password.length < 8) {
            setModalError(`Row #${i + 1} (${row.username}): Password must be at least 8 characters long.`);
            return;
          }
        }

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            users: csvStaff.map((r) => ({
              name: `${r.firstName.trim()} ${r.lastName.trim()}`.trim(),
              nickname: r.nickname.trim() || undefined,
              username: r.username.trim(),
              password: r.password,
              email: r.email.trim() || undefined,
              role: addCategory === 'TEACHER' ? 'TEACHER' : (r.role || 'ADMIN')
            }))
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create batch users');
        }

        setIsAddModalOpen(false);
        setCsvStaff([]);
        setCsvStaffFileName('');
        await fetchDirectory();
      }
    } catch (err: any) {
      setModalError(err.message || 'Error creating directory item');
    } finally {
      setModalLoading(false);
    }
  };

  // Open Edit Modal for a Directory Item
  const handleOpenEditModal = (item: DirectoryItem) => {
    setEditingItem(item);
    setEditName(item.name);
    // Split full name into first and last name for student
    const parts = (item.name || '').trim().split(/\s+/);
    setEditFirstName(parts[0] || '');
    setEditLastName(parts.slice(1).join(' ') || '');
    setEditEmail(item.email || '');
    setEditRole((item.role as UserRole) || 'ADMIN');
    setEditPassword('');

    // Student & Parent specific fields
    setEditNickname(item.nickname || '');
    setEditStudentId(item.studentId || '');
    setEditGrade(item.grade || 'Grade 7 (MYP 2)');
    let prog = (item.programme as IBProgramme) || 'MYP';
    if ((prog as string) === 'PYP') prog = 'MYP';
    setEditProgramme(prog);
    setEditParentName(item.parentName || '');
    setEditPhone(item.phone || '');
    setEditNote(item.rawItem?.note || '');

    if (item.category === 'STUDENT') {
      if (item.guardians && item.guardians.length > 0) {
        setEditGuardiansList(item.guardians.map((g) => ({ ...g })));
      } else if (item.parentName) {
        const parts = item.parentName.split(',').map((s) => s.trim()).filter(Boolean);
        const parsed: FamilyMember[] = parts.map((p, idx) => {
          const match = p.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            return {
              id: String(idx + 1),
              name: match[1].trim(),
              relationship: (match[2].trim() as GuardianRelationship) || 'Other',
              phone: idx === 0 ? item.phone : undefined,
              email: idx === 0 ? item.email : undefined
            };
          }
          return {
            id: String(idx + 1),
            name: p,
            relationship: idx === 0 ? 'Father' : 'Mother',
            phone: idx === 0 ? item.phone : undefined,
            email: idx === 0 ? item.email : undefined
          };
        });
        setEditGuardiansList(
          parsed.length > 0
            ? parsed
            : [
                {
                  id: '1',
                  name: item.parentName,
                  relationship: 'Father',
                  phone: item.phone || '',
                  email: item.email || ''
                }
              ]
        );
      } else {
        setEditGuardiansList([
          { id: '1', name: '', relationship: 'Father', phone: '', email: '' },
          { id: '2', name: '', relationship: 'Mother', phone: '', email: '' }
        ]);
      }
    }

    setModalError(null);
    setIsEditModalOpen(true);
  };

  // Submit Handler for Update Item
  const handleUpdateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setModalLoading(true);
      setModalError(null);

      if (editingItem.category === 'STUDENT') {
        if (!editFirstName.trim() || !editLastName.trim()) {
          setModalError('Both First Name and Last Name are required for student.');
          return;
        }

        const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
        const activeGuardians = editGuardiansList.filter((g) => g.name && g.name.trim());
        const primaryPhone = activeGuardians.find((g) => g.phone)?.phone || editPhone.trim() || undefined;
        const primaryEmail = activeGuardians.find((g) => g.email)?.email || editEmail.trim() || undefined;
        const formattedParentName =
          activeGuardians.length > 0
            ? activeGuardians.map((g) => `${g.name.trim()} (${g.relationship})`).join(', ')
            : editParentName.trim() || undefined;

        const res = await fetch(`/api/customers/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            nickname: editNickname.trim() || undefined,
            grade: editGrade.trim(),
            programme: editProgramme,
            studentId: editStudentId.trim() || undefined,
            parentName: formattedParentName,
            phone: primaryPhone,
            email: primaryEmail,
            guardians: activeGuardians,
            note: editNote.trim() || undefined
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update student');
      } else if (editingItem.category === 'PARENT') {
        const res = await fetch(`/api/customers/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName.trim(),
            phone: editPhone.trim() || undefined,
            email: editEmail.trim() || undefined,
            parentName: editParentName.trim() || undefined,
            note: editNote.trim() || undefined
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update parent');
      } else {
        // STAFF & TEACHER
        if (!editFirstName.trim() || !editLastName.trim()) {
          setModalError('Both First Name and Last Name are required.');
          return;
        }

        if (editPassword && editPassword.length < 8) {
          setModalError('Password must be at least 8 characters long.');
          return;
        }

        const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
        const res = await fetch(`/api/users/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            nickname: editNickname.trim() || undefined,
            email: editEmail.trim(),
            role: editRole,
            password: editPassword || undefined
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update user');
      }

      setIsEditModalOpen(false);
      await fetchDirectory();
    } catch (err: any) {
      setModalError(err.message || 'Error updating item');
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Handler for Directory Item
  const handleDeleteItem = async (
    id: string,
    name: string,
    category: 'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT'
  ) => {
    const isCustomer = category === 'STUDENT' || category === 'PARENT';
    const label =
      category === 'STUDENT'
        ? 'student record'
        : category === 'PARENT'
        ? 'parent record'
        : 'user account';

    if (!confirm(`Are you sure you want to delete ${label} "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const endpoint = isCustomer ? `/api/customers/${id}` : `/api/users/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || `Failed to delete ${label}`);
        return;
      }
      await fetchDirectory();
    } catch (err: any) {
      alert(err.message || `Error deleting ${label}`);
    }
  };

  // Breadcrumb names
  const pageTitles: Record<PageKey, string> = {
    staff: 'Staff Directory',
    departments: 'Departments',
    master_data: 'Master Data',
    commerce: 'Commerce',
    system: 'System'
  };

  const subTabTitles: Record<string, string> = {
    all: 'Staff',
    teachers: 'Teachers',
    students: 'Students',
    parents: 'Parents & Guardians',
    inactive: 'Inactive Accounts',
    categories: 'Categories',
    locations: 'Storage Locations',
    uom: 'Units of Measure',
    pricing: 'Pricing & Promotions',
    workflow: 'Approval Workflow',
    numbering: 'Document Numbering',
    notifications: 'Notifications',
    backup: 'Backup & Restore',
    integrations: 'Cloud Integrations',
    departments: 'Academic Departments'
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          {/* Breadcrumb: Settings > <page> > <sub-tab> */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium" aria-label="Breadcrumb">
            <span className="text-slate-400">Settings</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 font-semibold">{pageTitles[activePage]}</span>
            {subTabTitles[activeTab] && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0B6B4F] font-bold">{subTabTitles[activeTab]}</span>
              </>
            )}
          </nav>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {pageTitles[activePage]}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-emerald-50 text-[#0B6B4F] font-bold rounded-xl border border-emerald-200">
            ERP Operational
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout (Sidebar + Content) */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Sub-Menu (240px Desktop, Sticky) */}
        <SettingsSidebar
          activePage={activePage}
          activeTab={activeTab}
          onNavigate={handleNavigate}
        />

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 w-full space-y-4">
          {/* 1. STAFF DIRECTORY */}
          {activePage === 'staff' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <UserTable
                items={directoryItems}
                loading={loadingDirectory}
                canCreate={can('iam:user:create') || can('customer:create')}
                canUpdate={can('iam:user:update') || can('customer:update')}
                canDisable={can('iam:user:disable') || can('customer:delete')}
                activeFilterTab={activeTab}
                onFilterTabChange={handleSubTabChange}
                onOpenAddModal={handleOpenAddModal}
                onOpenEditModal={handleOpenEditModal}
                onDeleteItem={handleDeleteItem}
              />
            </div>
          )}

          {/* 2. DEPARTMENTS */}
          {activePage === 'departments' && (
            <div className="animate-in fade-in duration-150">
              <DepartmentsView />
            </div>
          )}

          {/* 3. MASTER DATA */}
          {activePage === 'master_data' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <SettingsSubTabs
                tabs={MASTER_DATA_TABS}
                activeTab={activeTab}
                onChange={handleSubTabChange}
              />
              <div className="pt-1">
                {activeTab === 'categories' && <CategoriesView />}
                {activeTab === 'locations' && <StorageLocationsView />}
                {activeTab === 'uom' && <UnitsOfMeasureView />}
              </div>
            </div>
          )}

          {/* 4. COMMERCE */}
          {activePage === 'commerce' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <SettingsSubTabs
                tabs={COMMERCE_TABS}
                activeTab={activeTab}
                onChange={handleSubTabChange}
              />
              <div className="pt-1">
                {activeTab === 'pricing' && <PricingPromotionsView />}
                {activeTab === 'workflow' && <ApprovalWorkflowView />}
                {activeTab === 'numbering' && <DocumentNumberingView />}
              </div>
            </div>
          )}

          {/* 5. SYSTEM */}
          {activePage === 'system' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <SettingsSubTabs
                tabs={SYSTEM_TABS}
                activeTab={activeTab}
                onChange={handleSubTabChange}
              />
              <div className="pt-1">
                {activeTab === 'notifications' && <NotificationsSettingsView />}
                {activeTab === 'backup' && <BackupMaintenanceView />}
                {activeTab === 'integrations' && <SystemIntegrationsView />}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADD USER MODAL (Single / Batch) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {addCategory === 'STUDENT' ? (
                  <Users className="w-5 h-5 text-sky-600" />
                ) : addCategory === 'PARENT' ? (
                  <HeartHandshake className="w-5 h-5 text-amber-600" />
                ) : addCategory === 'TEACHER' ? (
                  <GraduationCap className="w-5 h-5 text-[#0B6B4F]" />
                ) : (
                  <User className="w-5 h-5 text-[#0B6B4F]" />
                )}
                <h3 className="font-bold text-sm text-slate-900">
                  {addMode === 'single'
                    ? addCategory === 'STUDENT'
                      ? 'Add New Student'
                      : addCategory === 'PARENT'
                      ? 'Add New Parent / Guardian'
                      : addCategory === 'TEACHER'
                      ? 'Add New Teacher'
                      : 'Add New Staff Member'
                    : `Bulk Import ${
                        addCategory === 'STUDENT'
                          ? 'Students'
                          : addCategory === 'PARENT'
                          ? 'Parents'
                          : addCategory === 'TEACHER'
                          ? 'Teachers'
                          : 'Staff'
                      }`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Selector Tabs */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Select User Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAddCategory('STAFF')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    addCategory === 'STAFF'
                      ? 'border-[#0B6B4F] bg-emerald-50/50 text-[#0B6B4F] font-bold ring-1 ring-[#0B6B4F]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-xs">Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddCategory('TEACHER')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    addCategory === 'TEACHER'
                      ? 'border-[#0B6B4F] bg-emerald-50/50 text-[#0B6B4F] font-bold ring-1 ring-[#0B6B4F]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs">Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddCategory('STUDENT')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    addCategory === 'STUDENT'
                      ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold ring-1 ring-sky-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-sky-600" />
                  <span className="text-xs">Student</span>
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 mt-3">
              <button
                type="button"
                onClick={() => setAddMode('single')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  addMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Single Entry
              </button>
              <button
                type="button"
                onClick={() => setAddMode('batch')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  addMode === 'batch' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Batch Upload (Spreadsheet)
              </button>
            </div>

            {/* Contextual Notice (Staff/Teacher only) */}
            {addCategory !== 'STUDENT' && addCategory !== 'PARENT' && (
              <div className="mt-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <span className="text-sm">🔐</span>
                  <span>
                    <strong>Staff and Teachers have system login access.</strong> A unique username and initial password (min. 8 characters) are required.
                  </span>
                </div>
              </div>
            )}

            {modalError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {/* FORM BODY */}
            {addMode === 'single' ? (
              <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5 text-left text-xs">
                {/* 1. STUDENT FORM */}
                {addCategory === 'STUDENT' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newFirstName}
                          onChange={(e) => setNewFirstName(e.target.value)}
                          placeholder="e.g. Sarah"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newLastName}
                          onChange={(e) => setNewLastName(e.target.value)}
                          placeholder="e.g. Jenkins"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nickname
                        </label>
                        <input
                          type="text"
                          value={newNickname}
                          onChange={(e) => setNewNickname(e.target.value)}
                          placeholder="e.g. Sarah"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Student ID
                        </label>
                        <input
                          type="text"
                          value={newStudentId}
                          onChange={(e) => setNewStudentId(e.target.value)}
                          placeholder="e.g. STD-2024-001"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Programme
                        </label>
                        <select
                          value={newProgramme}
                          onChange={(e) => {
                            const p = e.target.value as IBProgramme;
                            setNewProgramme(p);
                            if (p === 'MYP' && !newGrade.includes('MYP')) setNewGrade('Grade 7 (MYP 2)');
                            else if (p === 'DP' && !newGrade.includes('DP')) setNewGrade('Grade 11 (DP 1)');
                            else if (p === 'CP' && !newGrade.includes('CP')) setNewGrade('Grade 11 (CP 1)');
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 cursor-pointer"
                        >
                          <option value="MYP">MYP (Middle Years Programme)</option>
                          <option value="DP">DP (Diploma Programme)</option>
                          <option value="CP">CP (Career-related Programme)</option>
                          <option value="GENERAL">General</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Grade / Class <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newGrade}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewGrade(val);
                            if (val.includes('MYP')) setNewProgramme('MYP');
                            else if (val.includes('DP')) setNewProgramme('DP');
                            else if (val.includes('CP')) setNewProgramme('CP');
                          }}
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 cursor-pointer"
                        >
                          {STUDENT_GRADE_OPTIONS.map((grp) => (
                            <optgroup key={grp.group} label={grp.group}>
                              {grp.grades.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* FAMILY DETAILS SECTION (ManageBac Style) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      {/* Section Title */}
                      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-600" />
                          <h4 className="font-bold text-slate-800 text-xs">Family Details</h4>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {guardiansList.filter((g) => g.name.trim()).length} linked
                        </span>
                      </div>

                      {/* Family Members Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-600 bg-slate-50/40">
                              <th className="py-2.5 px-4 w-[50%]">Name</th>
                              <th className="py-2.5 px-3 w-[40%]">Relationship</th>
                              <th className="py-2.5 px-3 w-[10%] text-center text-rose-600 font-semibold">
                                Remove?
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {guardiansList.map((g) => {
                              return (
                                <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                  {/* Name & Contact */}
                                  <td className="py-2.5 px-4 align-top">
                                    <div className="space-y-1.5">
                                      <input
                                        type="text"
                                        list="registered-parents-list"
                                        value={g.name}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          handleUpdateGuardianRow(g.id, 'name', val);
                                          // Auto-fill phone/email if matches registered parent
                                          const match = customersList.find(
                                            (c) =>
                                              c.type === 'PARENT' &&
                                              c.name.toLowerCase() === val.toLowerCase()
                                          );
                                          if (match) {
                                            if (match.phone && !g.phone)
                                              handleUpdateGuardianRow(g.id, 'phone', match.phone);
                                            if (match.email && !g.email)
                                              handleUpdateGuardianRow(g.id, 'email', match.email);
                                          }
                                        }}
                                        placeholder="Parent Name (e.g. David Jenkins)"
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B6B4F] focus:border-[#0B6B4F]"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="tel"
                                          value={g.phone || ''}
                                          onChange={(e) =>
                                            handleUpdateGuardianRow(g.id, 'phone', e.target.value)
                                          }
                                          placeholder="Phone: 081-xxx-xxxx"
                                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-800 focus:bg-white"
                                        />
                                        <input
                                          type="email"
                                          value={g.email || ''}
                                          onChange={(e) =>
                                            handleUpdateGuardianRow(g.id, 'email', e.target.value)
                                          }
                                          placeholder="Email address"
                                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-800 focus:bg-white"
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Relationship Select */}
                                  <td className="py-2.5 px-3 align-top pt-3">
                                    <select
                                      value={g.relationship}
                                      onChange={(e) =>
                                        handleUpdateGuardianRow(
                                          g.id,
                                          'relationship',
                                          e.target.value as GuardianRelationship
                                        )
                                      }
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B6B4F] focus:border-[#0B6B4F] cursor-pointer"
                                    >
                                      {GUARDIAN_RELATIONSHIPS.map((rel) => (
                                        <option key={rel} value={rel}>
                                          ✕ {rel}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Remove Action */}
                                  <td className="py-2.5 px-3 align-top pt-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGuardianRow(g.id)}
                                      title="Remove this parent/guardian"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Parent/Guardian Button matching ManageBac */}
                      <div className="p-3 bg-slate-50/50 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={handleAddGuardianRow}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Add Parent/Guardian</span>
                        </button>
                      </div>
                    </div>

                    <datalist id="registered-parents-list">
                      {customersList
                        .filter((c) => c.type === 'PARENT')
                        .map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                    </datalist>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Notes / Remarks
                      </label>
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Optional notes, allergy info, or boarding status"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                      />
                    </div>
                  </>
                )}

                {/* 2. PARENT FORM */}
                {addCategory === 'PARENT' && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Parent Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. David Jenkins"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="e.g. 081-234-5678"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="e.g. david.j@example.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Child / Student in Care
                      </label>
                      <input
                        type="text"
                        value={newParentName}
                        onChange={(e) => setNewParentName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins (Grade 7)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Notes / Remarks
                      </label>
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Optional remarks"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                      />
                    </div>
                  </>
                )}

                {/* 3. STAFF & TEACHER FORM */}
                {(addCategory === 'STAFF' || addCategory === 'TEACHER') && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newFirstName}
                          onChange={(e) => setNewFirstName(e.target.value)}
                          placeholder="e.g. Somchai"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newLastName}
                          onChange={(e) => setNewLastName(e.target.value)}
                          placeholder="e.g. Sukjai"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nickname
                        </label>
                        <input
                          type="text"
                          value={newNickname}
                          onChange={(e) => setNewNickname(e.target.value)}
                          placeholder="e.g. Chai"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="e.g. somchai.s"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Initial Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="min. 8 chars"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="e.g. somchai@roong-aroon.ac.th"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                      />
                    </div>

                    {addCategory === 'STAFF' && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          System Role
                        </label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                        >
                          <option value="ADMIN">Admin (Full inventory, POS cashier, deduct & restock)</option>
                          <option value="WAREHOUSE">Warehouse (Inventory In/Out, Stock adjustments, Item Master)</option>
                          <option value="CASHIER">Cashier (POS cashier, payments, billing & receipts)</option>
                          <option value="ACCOUNTANT">Accountant (Invoices, receivables, finance & reports)</option>
                          <option value="TEACHER">Staff / Teacher (Borrow & request supplies, view stock)</option>
                          {can('iam:role:assign') && (
                            <option value="SUPER_ADMIN">Super Admin (System configuration & all privileges)</option>
                          )}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 bg-[#0B6B4F] hover:bg-[#084D39] text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {addCategory === 'STUDENT'
                        ? 'Create Student'
                        : addCategory === 'PARENT'
                        ? 'Create Parent'
                        : 'Create User'}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              /* BATCH MODE */
              <form onSubmit={handleCreateUser} className="mt-4 space-y-4 text-left text-xs">
                {addCategory === 'STUDENT' ? (
                  <>
                    <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50/50 border border-sky-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sky-950 text-xs">
                          <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                          <span>Bulk Student Upload (.csv)</span>
                        </div>
                        <p className="text-[11px] text-sky-700/80 mt-0.5">
                          Download the official CSV template, fill in student and parent details, and upload in one click.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadStudentTemplate}
                        className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-sky-700 text-xs font-semibold rounded-xl border border-sky-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Template (.csv)</span>
                      </button>
                    </div>

                    {/* CSV File Upload Dropzone */}
                    {!csvFileName ? (
                      <label className="border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer bg-sky-50/20 hover:bg-sky-50/50 transition-colors flex flex-col items-center justify-center gap-2 group">
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCsvFileChange(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="w-10 h-10 rounded-full bg-sky-100 group-hover:bg-sky-200 flex items-center justify-center text-sky-600 transition">
                          <FileUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Click to browse or drag & drop CSV file
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Standard CSV format with UTF-8 encoding (Max 500 students per batch)
                          </p>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900">{csvFileName}</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                {csvStudents.length} Students Detected
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">Ready for instant batch database import</p>
                          </div>
                        </div>
                        <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition">
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleCsvFileChange(e.target.files[0]);
                              }
                            }}
                          />
                          Change File
                        </label>
                      </div>
                    )}

                    {csvError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{csvError}</span>
                      </div>
                    )}

                    {/* PREVIEW TABLE */}
                    {csvStudents.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="font-bold text-slate-700">Import Preview</span>
                          <span className="text-slate-500 font-mono text-[11px]">{csvStudents.length} entries</span>
                        </div>
                        <div className="max-h-[42vh] overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                              <tr>
                                <th className="py-2.5 px-3">#</th>
                                <th className="py-2.5 px-3">Student Name</th>
                                <th className="py-2.5 px-3">Nickname</th>
                                <th className="py-2.5 px-3">Student ID</th>
                                <th className="py-2.5 px-3">Grade</th>
                                <th className="py-2.5 px-3">Father</th>
                                <th className="py-2.5 px-3">Mother</th>
                                <th className="py-2.5 px-2 text-center w-8"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {csvStudents.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-mono text-slate-400 text-center">{idx + 1}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900">
                                    {s.firstName} {s.lastName}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">{s.nickname || '-'}</td>
                                  <td className="py-2 px-3 font-mono text-slate-600">{s.studentId || '-'}</td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[11px] font-medium border border-sky-200">
                                      {s.grade}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-700">
                                    {s.fatherName ? (
                                      <div>
                                        <div className="font-medium">{s.fatherName}</div>
                                        {s.fatherPhone && <div className="text-[10px] text-slate-400">{s.fatherPhone}</div>}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-slate-700">
                                    {s.motherName ? (
                                      <div>
                                        <div className="font-medium">{s.motherName}</div>
                                        {s.motherPhone && <div className="text-[10px] text-slate-400">{s.motherPhone}</div>}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setCsvStudents((prev) => prev.filter((item) => item.id !== s.id))}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                      title="Exclude student"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading || csvStudents.length === 0}
                        className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer shadow-sm"
                      >
                        {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Upload className="w-4 h-4" />
                        <span>Upload CSV ({csvStudents.length} Students)</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* BATCH STAFF & TEACHER CSV UPLOAD */
                  <>
                    <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                          <FileSpreadsheet className="w-4 h-4 text-[#0B6B4F]" />
                          <span>Bulk Staff & Teacher Upload (.csv)</span>
                        </div>
                        <p className="text-[11px] text-emerald-800/80 mt-0.5">
                          Download the official CSV template, fill in first name, last name, nickname, username, and role, and upload in one click.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadStaffTemplate}
                        className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-[#0B6B4F] text-xs font-semibold rounded-xl border border-emerald-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Template (.csv)</span>
                      </button>
                    </div>

                    {/* Drag & Drop File Zone */}
                    <div className="relative border-2 border-dashed border-emerald-300/80 hover:border-[#0B6B4F] bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-6 text-center transition cursor-pointer group">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCsvStaffFileChange(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-emerald-200 flex items-center justify-center text-[#0B6B4F] group-hover:scale-105 transition">
                          <FileUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {csvStaffFileName ? (
                              <span className="text-[#0B6B4F] font-mono">{csvStaffFileName}</span>
                            ) : (
                              <span>Click to choose file or drag & drop CSV here</span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Standard CSV format with columns: first_name, last_name, nickname, username, password, email, role
                          </p>
                        </div>
                      </div>
                    </div>

                    {csvStaffError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{csvStaffError}</span>
                      </div>
                    )}

                    {/* Preview Table if file parsed */}
                    {csvStaff.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="font-bold text-slate-700">Import Preview</span>
                          <span className="text-slate-500 font-mono text-[11px]">{csvStaff.length} entries</span>
                        </div>
                        <div className="max-h-[42vh] overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                              <tr>
                                <th className="py-2.5 px-3">#</th>
                                <th className="py-2.5 px-3">Full Name</th>
                                <th className="py-2.5 px-3">Nickname</th>
                                <th className="py-2.5 px-3">Username</th>
                                <th className="py-2.5 px-3">Email</th>
                                <th className="py-2.5 px-3">Role</th>
                                <th className="py-2.5 px-2 text-center w-8"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {csvStaff.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-mono text-slate-400 text-center">{idx + 1}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900">
                                    {s.firstName} {s.lastName}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">{s.nickname || '-'}</td>
                                  <td className="py-2 px-3 font-mono text-slate-600">{s.username}</td>
                                  <td className="py-2 px-3 text-slate-600">{s.email || '-'}</td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-medium border border-emerald-200 font-mono">
                                      {s.role}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setCsvStaff((prev) => prev.filter((item) => item.id !== s.id))}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                      title="Exclude user"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading || csvStaff.length === 0}
                        className="px-5 py-2 bg-[#0B6B4F] hover:bg-[#084D39] text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer shadow-sm"
                      >
                        {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Upload className="w-4 h-4" />
                        <span>Upload CSV ({csvStaff.length} Users)</span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingItem.category === 'STUDENT'
                      ? 'Edit Student Profile'
                      : editingItem.category === 'PARENT'
                      ? 'Edit Parent / Guardian Profile'
                      : 'Edit User Account'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {editingItem.category === 'STUDENT'
                      ? `Student ID: ${editingItem.studentId || 'N/A'}`
                      : editingItem.category === 'PARENT'
                      ? 'Parent Record'
                      : `@${editingItem.username}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateItem} className="mt-4 space-y-3.5 text-left text-xs">
              {/* EDIT STUDENT */}
              {editingItem.category === 'STUDENT' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="e.g. Sarah"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="e.g. Jenkins"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="e.g. Sarah"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={editStudentId}
                        onChange={(e) => setEditStudentId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Programme
                      </label>
                      <select
                        value={editProgramme}
                        onChange={(e) => {
                          const p = e.target.value as IBProgramme;
                          setEditProgramme(p);
                          if (p === 'MYP' && !editGrade.includes('MYP')) setEditGrade('Grade 7 (MYP 2)');
                          else if (p === 'DP' && !editGrade.includes('DP')) setEditGrade('Grade 11 (DP 1)');
                          else if (p === 'CP' && !editGrade.includes('CP')) setEditGrade('Grade 11 (CP 1)');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 cursor-pointer"
                      >
                        <option value="MYP">MYP (Middle Years Programme)</option>
                        <option value="DP">DP (Diploma Programme)</option>
                        <option value="CP">CP (Career-related Programme)</option>
                        <option value="GENERAL">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Grade / Class <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editGrade}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditGrade(val);
                          if (val.includes('MYP')) setEditProgramme('MYP');
                          else if (val.includes('DP')) setEditProgramme('DP');
                          else if (val.includes('CP')) setEditProgramme('CP');
                        }}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 cursor-pointer"
                      >
                        {STUDENT_GRADE_OPTIONS.map((grp) => (
                          <optgroup key={grp.group} label={grp.group}>
                            {grp.grades.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        {editGrade && !STUDENT_GRADE_OPTIONS.some((grp) => grp.grades.includes(editGrade)) && (
                          <option value={editGrade}>{editGrade} (Custom)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* FAMILY DETAILS SECTION (ManageBac Style) */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {/* Section Title */}
                    <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-600" />
                        <h4 className="font-bold text-slate-800 text-xs">Family Details</h4>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {editGuardiansList.filter((g) => g.name.trim()).length} linked
                      </span>
                    </div>

                    {/* Family Members Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-600 bg-slate-50/40">
                            <th className="py-2.5 px-4 w-[50%]">Name</th>
                            <th className="py-2.5 px-3 w-[40%]">Relationship</th>
                            <th className="py-2.5 px-3 w-[10%] text-center text-rose-600 font-semibold">
                              Remove?
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {editGuardiansList.map((g) => {
                            return (
                              <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                {/* Name & Contact */}
                                <td className="py-2.5 px-4 align-top">
                                  <div className="space-y-1.5">
                                    <input
                                      type="text"
                                      list="registered-parents-list"
                                      value={g.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        handleUpdateEditGuardianRow(g.id, 'name', val);
                                        const match = customersList.find(
                                          (c) =>
                                            c.type === 'PARENT' &&
                                            c.name.toLowerCase() === val.toLowerCase()
                                        );
                                        if (match) {
                                          if (match.phone && !g.phone)
                                            handleUpdateEditGuardianRow(g.id, 'phone', match.phone);
                                          if (match.email && !g.email)
                                            handleUpdateEditGuardianRow(g.id, 'email', match.email);
                                        }
                                      }}
                                      placeholder="Parent Name (e.g. David Jenkins)"
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B6B4F] focus:border-[#0B6B4F]"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="tel"
                                        value={g.phone || ''}
                                        onChange={(e) =>
                                          handleUpdateEditGuardianRow(g.id, 'phone', e.target.value)
                                        }
                                        placeholder="Phone: 081-xxx-xxxx"
                                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-800 focus:bg-white"
                                      />
                                      <input
                                        type="email"
                                        value={g.email || ''}
                                        onChange={(e) =>
                                          handleUpdateEditGuardianRow(g.id, 'email', e.target.value)
                                        }
                                        placeholder="Email address"
                                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-800 focus:bg-white"
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* Relationship Select */}
                                <td className="py-2.5 px-3 align-top pt-3">
                                  <select
                                    value={g.relationship}
                                    onChange={(e) =>
                                      handleUpdateEditGuardianRow(
                                        g.id,
                                        'relationship',
                                        e.target.value as GuardianRelationship
                                      )
                                    }
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B6B4F] focus:border-[#0B6B4F] cursor-pointer"
                                  >
                                    {GUARDIAN_RELATIONSHIPS.map((rel) => (
                                      <option key={rel} value={rel}>
                                        ✕ {rel}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Remove Action */}
                                <td className="py-2.5 px-3 align-top pt-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditGuardianRow(g.id)}
                                    title="Remove this parent/guardian"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Parent/Guardian Button matching ManageBac */}
                    <div className="p-3 bg-slate-50/50 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleAddEditGuardianRow}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add Parent/Guardian</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                    />
                  </div>
                </>
              )}

              {/* EDIT PARENT */}
              {editingItem.category === 'PARENT' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Parent Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Child / Student in Care
                    </label>
                    <input
                      type="text"
                      value={editParentName}
                      onChange={(e) => setEditParentName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                    />
                  </div>
                </>
              )}

              {/* EDIT STAFF / TEACHER */}
              {(editingItem.category === 'STAFF' || editingItem.category === 'TEACHER') && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="e.g. Somchai"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="e.g. Sukjai"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="e.g. Chai"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      System Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                    >
                      <option value="ADMIN">Admin (Full inventory, POS cashier, deduct & restock)</option>
                      <option value="WAREHOUSE">Warehouse (Inventory In/Out, Stock adjustments, Item Master)</option>
                      <option value="CASHIER">Cashier (POS cashier, payments, billing & receipts)</option>
                      <option value="ACCOUNTANT">Accountant (Invoices, receivables, finance & reports)</option>
                      <option value="TEACHER">Staff / Teacher (Borrow & request supplies, view stock)</option>
                      {can('iam:role:assign') && (
                        <option value="SUPER_ADMIN">Super Admin (System configuration & all privileges)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Reset Password (leave empty to keep unchanged)
                    </label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 chars)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900 font-mono"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B6B4F]" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
