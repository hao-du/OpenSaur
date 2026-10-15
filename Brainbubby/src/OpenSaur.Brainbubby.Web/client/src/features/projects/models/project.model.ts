export interface ProjectListItem {
  id: string;
  name: string;
  description?: string | null;
  creatorId: string;
  creatorName: string;
  instructionTemplateNodeId?: string | null;
  instructionTemplateName?: string | null;
  isActive: boolean;
  createdOn: string;
  currentUserRole: string; // 'Creator' | 'CanEdit' | 'CanView' | 'None'
}

export interface ProjectDetail {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  creatorId: string;
  creatorName: string;
  instructionTemplateNodeId?: string | null;
  instructionTemplateName?: string | null;
  isActive: boolean;
  createdOn: string;
  updatedOn?: string | null;
  currentUserRole: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
  instructionTemplateNodeId?: string | null;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string | null;
  instructionTemplateNodeId?: string | null;
}

export interface TemplateItem {
  id: string;
  name: string;
  description?: string | null;
  content: string;
}
