import { prisma } from "./prisma";
import { TemplateId, AVAILABLE_TEMPLATES } from "./template-constants";

export { AVAILABLE_TEMPLATES, type TemplateId, type Template } from "./template-constants";

export async function getActiveTemplate(): Promise<TemplateId> {
  try {
    const settings = await prisma.siteSettings.findFirst();
    const template = settings?.template as TemplateId;
    
    // Validate template exists
    if (template && AVAILABLE_TEMPLATES.some(t => t.id === template)) {
      return template;
    }
    
    return 'beach'; // Default template
  } catch (error) {
    console.error('Error getting active template:', error);
    return 'beach'; // Default template
  }
}

export function getTemplateStylesPath(templateId: TemplateId): string {
  return `/templates/${templateId}/styles.css`;
}

