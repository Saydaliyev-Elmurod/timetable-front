export interface EtSubject {
  id: string;
  name: string;
  short: string;
  /** Packed "bg,fg,bar" hex values */
  ck: string;
}

export interface EtTeacher {
  id: string;
  name: string;
  avatar: string;
  tone: string;
  subs: string[];
  cap: number;
  load: number;
}

export interface EtRoom {
  id: string;
  no: string;
  type: string;
  label: string;
  fits: string | string[];
}

export interface EtClassGroup {
  id: number;
  name: string;
}

export interface EtClass {
  id?: number;
  name: string;
  groups?: EtClassGroup[];
}

export interface EtGroupAssignment {
  label: string;
  tid: string;
  room: string;
}

export type EtTeacherValue = string | { groups: EtGroupAssignment[] };

export interface EtLessonRow {
  id: string;
  classes: string[];
  subjectId: string;
  teacher: EtTeacherValue;
  room: string;
  hours: number;
  dur: number;
  block?: string;
}
