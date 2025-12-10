import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    appTitle: 'My Sections',
    addLecture: 'إضافة محاضرة/سيكشن',
    settings: 'الإعدادات',
    schedule: 'الجدول الأسبوعي',
    lectureName: 'اسم المادة',
    lectureType: 'نوع الحصة',
    lecture: 'محاضرة',
    section: 'سيكشن',
    day: 'اليوم',
    startTime: 'وقت البدء',
    endTime: 'وقت الإنتهاء',
    color: 'اللون',
    notification: 'تفعيل التنبيه',
    notifyBefore: 'التنبيه قبل',
    minutes: 'دقيقة',
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    sun: 'أحد',
    mon: 'إثنين',
    tue: 'ثلاثاء',
    wed: 'أربعاء',
    thu: 'خميس',
    fri: 'جمعة',
    sat: 'سبت',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    themeSettings: 'إعدادات الواجهة',
    darkMode: 'الوضع الداكن',
    notificationSettings: 'إعدادات التنبيهات',
    alarmSound: 'صوت المنبه',
    madeBy: 'صُنع بواسطة',
    amrAbdelHadi: 'عمرو عبد الهادي',
    confirmDeleteBackupFirst: 'هل أنت متأكد من حذف النسخة الاحتياطية "{name}"؟',
    confirmDeleteBackupSecond: 'هذا الإجراء لا يمكن التراجع عنه. هل تريد حذف النسخة الاحتياطية؟',
    lectureDetails: 'تفاصيل المحاضرة',
    installApp: 'تثبيت التطبيق',
    attachments: 'المرفقات',
    addAttachment: 'إضافة مرفق',
    exportData: 'تصدير البيانات',
    importData: 'استيراد البيانات',
    importWarning: 'سيتم حذف جميع البيانات الحالية!',
    confirmImport: 'هل أنت متأكد؟',
    backups: 'النسخ الاحتياطية',
    createBackup: 'إنشاء نسخة احتياطية',
    applyBackup: 'تطبيق النسخة',
    shareBackup: 'مشاركة النسخة',
    renameBackup: 'إعادة تسمية',
    deleteBackup: 'حذف النسخة',
    backupName: 'اسم النسخة',
    backupWarning: 'سيتم استبدال جدولك الحالي بهذه النسخة الاحتياطية!',
    confirmBackupApply: 'هل أنت متأكد من التطبيق؟',
    maxBackupsReached: 'وصلت للحد الأقصى (3 نسخ)',
    exportWithAttachments: 'تصدير مع المرفقات',
    exportWithoutAttachments: 'تصدير بدون المرفقات',
    confirmDelete: 'تأكيد الحذف',
    deleteWarning: 'هل أنت متأكد من حذف هذه المحاضرة؟',
    exportSingleLecture: 'تصدير هذه المحاضرة',
    openWithOtherApp: 'فتح بتطبيق آخر',
    conflictDetected: 'تعارض موجود',
    conflictMessage: 'هذه المحاضرة تتعارض مع محاضرة أخرى. هل تريد استبدالها؟',
    replace: 'استبدال',
    importSingleLecture: 'استيراد محاضرة واحدة',
    // New translations
    exportFullSchedule: 'تصدير الجدول بالكامل',
    exportSingleLectureOption: 'تصدير محاضرة/سيكشن معين',
    importFullSchedule: 'استيراد جدول كامل',
    importSingleLectureOption: 'استيراد محاضرة/سيكشن',
    selectLectureToExport: 'اختر المحاضرة للتصدير',
    selectImportType: 'اختر نوع الاستيراد',
    selectExportType: 'اختر نوع التصدير',
    multipleConflictsDetected: 'تم اكتشاف تعارضات متعددة',
    conflictsDetails: 'المحاضرات التالية متعارضة:',
    conflictsWith: 'تتعارض مع',
    replaceAll: 'استبدال الكل',
    skipConflicts: 'تخطي المتعارضة',
    noLecturesToExport: 'لا توجد محاضرات للتصدير',
    lecturesImported: 'تم استيراد المحاضرات',
    selectFiles: 'يمكنك اختيار ملفات متعددة',
  },
  en: {
    appTitle: 'My Sections',
    addLecture: 'Add Lecture/Section',
    settings: 'Settings',
    schedule: 'Weekly Schedule',
    lectureName: 'Subject Name',
    lectureType: 'Type',
    lecture: 'Lecture',
    section: 'Section',
    day: 'Day',
    startTime: 'Start Time',
    endTime: 'End Time',
    color: 'Color',
    notification: 'Enable Notification',
    notifyBefore: 'Notify Before',
    minutes: 'Minutes',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    themeSettings: 'Theme Settings',
    darkMode: 'Dark Mode',
    notificationSettings: 'Notification Settings',
    alarmSound: 'Alarm Sound',
    madeBy: 'Made by',
    amrAbdelHadi: 'Amr Abdelhady',
    confirmDeleteBackupFirst: 'Are you sure you want to delete the backup "{name}"?',
    confirmDeleteBackupSecond: 'This action cannot be undone. Delete backup?',
    lectureDetails: 'Lecture Details',
    installApp: 'Install App',
    attachments: 'Attachments',
    addAttachment: 'Add Attachment',
    exportData: 'Export Data',
    importData: 'Import Data',
    importWarning: 'All current data will be deleted!',
    confirmImport: 'Are you sure?',
    backups: 'Backups',
    createBackup: 'Create Backup',
    applyBackup: 'Apply Backup',
    shareBackup: 'Share Backup',
    renameBackup: 'Rename',
    deleteBackup: 'Delete Backup',
    backupName: 'Backup Name',
    backupWarning: 'Your current schedule will be replaced with this backup!',
    confirmBackupApply: 'Are you sure you want to apply?',
    maxBackupsReached: 'Maximum backups reached (3)',
    exportWithAttachments: 'Export with Attachments',
    exportWithoutAttachments: 'Export without Attachments',
    confirmDelete: 'Confirm Deletion',
    deleteWarning: 'Are you sure you want to delete this lecture?',
    exportSingleLecture: 'Export this Lecture',
    openWithOtherApp: 'Open with Other App',
    conflictDetected: 'Conflict Detected',
    conflictMessage: 'This lecture conflicts with an existing one. Do you want to replace it?',
    replace: 'Replace',
    importSingleLecture: 'Import Single Lecture',
    // New translations
    exportFullSchedule: 'Export Full Schedule',
    exportSingleLectureOption: 'Export Single Lecture/Section',
    importFullSchedule: 'Import Full Schedule',
    importSingleLectureOption: 'Import Lecture/Section',
    selectLectureToExport: 'Select Lecture to Export',
    selectImportType: 'Select Import Type',
    selectExportType: 'Select Export Type',
    multipleConflictsDetected: 'Multiple Conflicts Detected',
    conflictsDetails: 'The following lectures conflict:',
    conflictsWith: 'conflicts with',
    replaceAll: 'Replace All',
    skipConflicts: 'Skip Conflicts',
    noLecturesToExport: 'No lectures to export',
    lecturesImported: 'Lectures imported',
    selectFiles: 'You can select multiple files',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.ar] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
