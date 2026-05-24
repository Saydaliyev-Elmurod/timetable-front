import { apiCall } from '../lib/api';
import type { AppLanguage } from '../lib/lang';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api/v1/company`;

export interface LessonPeriod {
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  isBreak: boolean;
}

export interface CompanyRequest {
  name: string;
  description: string;
  daysOfWeek: string[];
  periods: LessonPeriod[];
  /** Preferred UI language; persisted to DB and echoed back on every fetch. */
  lang?: AppLanguage;
}

export interface CompanyResponse extends CompanyRequest {
  id: number;
  createdDate: string;
  lastModifiedDate: string;
}

const getOrganization = async (): Promise<CompanyResponse> => {
  try {
    const response = await apiCall<any>(API_URL);
    if (response.error) {
      throw new Error('Failed to fetch organization settings');
    }
    return response.data?.response || response.data;
  } catch (error) {
    toast.error('Failed to fetch organization settings.');
    throw error;
  }
};

const updateOrganization = async (data: CompanyRequest): Promise<void> => {
  try {
    const response = await apiCall(API_URL, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (response.error) {
      throw new Error('Failed to update organization settings');
    }
    toast.success('Organization settings updated successfully!');
  } catch (error) {
    toast.error('Failed to update organization settings.');
    throw error;
  }
};

// Persist only the language preference. Fire-and-forget: runs in the background
// when the user switches language, so failures stay silent (no toast spam while
// the backend endpoint is still being added).
const updateLang = async (lang: AppLanguage): Promise<void> => {
  try {
    await apiCall(`${API_URL}/lang`, {
      method: 'PUT',
      body: JSON.stringify({ lang }),
    });
  } catch {
    // ignore — language is also kept in localStorage as the source of truth
  }
};

export const organizationApi = {
  get: getOrganization,
  update: updateOrganization,
  updateLang,
};
