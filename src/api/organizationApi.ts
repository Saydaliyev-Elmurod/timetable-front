import axios from '../lib/axios';
import { toast } from 'sonner';

const API_URL = '/api/v1/company';

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
    const response = await axios.get(API_URL);
    return response.data.response;
  } catch (error) {
    toast.error('Failed to fetch organization settings.');
    throw error;
  }
};

const updateOrganization = async (data: CompanyRequest): Promise<void> => {
  try {
    await axios.put(API_URL, data);
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
