import { ISearchPropertiesQuery, ICreatePropertyData } from '../repositories/IPropertyRepository';

export interface IPropertyService {
  searchPublicProperties(query: ISearchPropertiesQuery): Promise<{ properties: any[]; meta: any }>;
  getPropertyById(id: string): Promise<any>;
  createProperty(ownerId: string, data: Omit<ICreatePropertyData, 'ownerId'>): Promise<any>;
  getOwnerSummary(ownerId: string): Promise<any>;
}
