'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// Get or create site settings
async function getOrCreateSiteSettings() {
  let settings = await prisma.siteSettings.findFirst();

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        singlePropertyMode: false,
        siteUrl: null,
        siteIcon: "🏠",
        siteIconType: "emoji",
        siteIconImageUrl: null,
        siteName: "Rental Manager",
        template: "beach",
        seoDescription: null,
        seoKeywords: null,
        seoAuthor: null,
        currency: "EUR",
        currencySymbol: "€"
      }
    });
  }

  return settings;
}

// Update site configuration
export async function updateSiteSettings(formData: FormData) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const settings = await getOrCreateSiteSettings();

  // Only update fields that are present in the form
  const updateData: any = {};

  if (formData.has("siteUrl")) {
    updateData.siteUrl = (formData.get("siteUrl") as string)?.trim() || null;
  }
  if (formData.has("siteIcon")) {
    updateData.siteIcon = (formData.get("siteIcon") as string)?.trim() || null;
  }
  if (formData.has("siteIconImageUrl")) {
    updateData.siteIconImageUrl = (formData.get("siteIconImageUrl") as string)?.trim() || null;
  }
  if (formData.has("siteIconType")) {
    updateData.siteIconType = (formData.get("siteIconType") as string)?.trim() || "emoji";
  }
  if (formData.has("siteName")) {
    updateData.siteName = (formData.get("siteName") as string)?.trim() || null;
  }
  if (formData.has("seoDescription")) {
    updateData.seoDescription = (formData.get("seoDescription") as string)?.trim() || null;
  }
  if (formData.has("seoKeywords")) {
    updateData.seoKeywords = (formData.get("seoKeywords") as string)?.trim() || null;
  }
  if (formData.has("seoAuthor")) {
    updateData.seoAuthor = (formData.get("seoAuthor") as string)?.trim() || null;
  }
  if (formData.has("currency")) {
    updateData.currency = (formData.get("currency") as string)?.trim() || null;
  }
  if (formData.has("currencySymbol")) {
    updateData.currencySymbol = (formData.get("currencySymbol") as string)?.trim() || null;
  }
  if (formData.has("singlePropertyMode")) {
    updateData.singlePropertyMode = formData.get("singlePropertyMode") === "true";
  }
  if (formData.has("template")) {
    updateData.template = (formData.get("template") as string)?.trim() || "beach";
  }
  if (formData.has("footerText")) {
    updateData.footerText = (formData.get("footerText") as string)?.trim() || null;
  }
  if (formData.has("footerShowPoweredBy")) {
    updateData.footerShowPoweredBy = formData.get("footerShowPoweredBy") === "true";
  }
  if (formData.has("customHeadCode")) {
    updateData.customHeadCode = (formData.get("customHeadCode") as string)?.trim() || null;
  }
  if (formData.has("customBodyCode")) {
    updateData.customBodyCode = (formData.get("customBodyCode") as string)?.trim() || null;
  }

  await prisma.siteSettings.update({
    where: { id: settings.id },
    data: updateData
  });

  revalidatePath('/');
  revalidatePath('/admin/settings');
}

