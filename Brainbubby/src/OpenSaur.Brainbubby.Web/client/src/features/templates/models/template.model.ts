export interface InstructionTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  content: string;
  isActive: boolean;
  createdOn: string;
  updatedOn: string | null;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string | null;
  content?: string | null;
}

export interface UpdateTemplateRequest {
  name: string;
  description?: string | null;
  content?: string | null;
}

