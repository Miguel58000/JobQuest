export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected' | 'wishlist';

export interface Application {
  id: string;
  userId: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  areas: string[];
  dateApplied: Date;
  salary?: string;
  notes?: string;
  link?: string;
}
