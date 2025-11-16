import { apiCall } from '../lib/api';
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

export const organizationApi = {
  get: getOrganization,
  update: updateOrganization,
};
