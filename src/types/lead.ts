export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Status {
  _id: string;
  name: string;
  slug: string;
}

export interface Language {
  _id: string;
  name: string;
}

export interface LeadSource {
  _id: string;
  name: string;
}

export interface Centre {
  _id: string;
  name: string;
}

export interface ProjectAndHouseType {
  _id: string;
  name: string;
  type: string;
}

export interface Lead {
  _id: string;
  leadID: string;
  name?: string;
  email?: string;
  contactNumber: string;
  presalesUserId?: User;
  salesUserId?: User;
  updatedPerson?: User;
  leadStatusId?: Status;
  leadSubStatusId?: Status;
  languageId?: Language;
  sourceId: LeadSource;
  centreId?: Centre;
  projectTypeId?: ProjectAndHouseType;
  projectValue?: string;
  apartmentName?: string;
  houseTypeId?: ProjectAndHouseType;
  expectedPossessionDate?: string;
  leadValue?: 'high value' | 'low value';

  siteVisit?: boolean;
  siteVisitDate?: string;
  centerVisit?: boolean;
  centerVisitDate?: string;
  virtualMeeting?: boolean;
  virtualMeetingDate?: string;
  cifDate?: string;
  comment?: string;
  adname?: string;
  outOfStation?: boolean;
  requirementWithinTwoMonths?: boolean;
  adset?: string;
  campaign?: string;
  cpUserName?: string;
  files?: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CallLog {
  _id: string;
  userId: User;
  leadId: string;
  dateTime: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ActivityLog {
  _id: string;
  userId: User;
  leadId: string;
  type: 'call' | 'manual';
  comment: string;
  document?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface LeadResponse {
  lead: Lead;
  callLogs: CallLog[];
  activityLogs: ActivityLog[];
}