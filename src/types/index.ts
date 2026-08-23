export type ToolCategory = 'image' | 'pdf' | 'video' | 'text' | 'developer' | 'calculator';

export type ToolType = 'browser';

export type ProcessingMode = 'client';

export interface ToolDefinition {
  slug: string;
  name: string;
  category: ToolCategory;
  icon: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  type: ToolType;
  processingMode: ProcessingMode;
  relatedTools: string[];
}

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  icon: string;
}

export type AnalyticsEventType =
  | 'tool_view'
  | 'tool_started'
  | 'tool_completed'
  | 'tool_error'
  | 'download_clicked'
  | 'copy_clicked'
  | 'share_clicked';

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  properties?: Record<string, unknown>;
}
