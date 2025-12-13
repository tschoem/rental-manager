'use client';

import { useEffect } from 'react';

interface TemplateLoaderProps {
  templateId: string;
}

export default function TemplateLoader({ templateId }: TemplateLoaderProps) {
  useEffect(() => {
    // Check if the correct stylesheet is already loaded (from server-side injection)
    const existingLink = document.querySelector(`link[data-template-stylesheet][href="/templates/${templateId}/styles.css"]`);
    
    if (existingLink) {
      // Stylesheet already loaded by server-side script, just ensure it's correct
      return;
    }

    // Remove any existing template stylesheets (in case template changed)
    const existingLinks = document.querySelectorAll('link[data-template-stylesheet]');
    existingLinks.forEach(link => link.remove());

    // Add the new template stylesheet (fallback if server-side injection didn't work)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/templates/${templateId}/styles.css`;
    link.setAttribute('data-template-stylesheet', 'true');
    document.head.appendChild(link);

    return () => {
      // Cleanup on unmount (only if we added it client-side)
      const links = document.querySelectorAll('link[data-template-stylesheet]');
      links.forEach(l => {
        // Only remove if it's not the one we want to keep
        if (l.getAttribute('href') !== `/templates/${templateId}/styles.css`) {
          l.remove();
        }
      });
    };
  }, [templateId]);

  return null;
}

