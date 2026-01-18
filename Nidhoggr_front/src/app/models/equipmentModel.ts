export enum StorageType {
  Single = 0,
  Multiple = 1
}

export interface Equipment {
  uuid: string;
  type?: string;
  length?: number;
  description?: string;
  storageType?: StorageType;
}