import { prisma } from '../../config/prisma';
import { emailService } from '../email';
import { AppError } from '../../utils/appError';

export interface CreateCampaignDTO {
  title: string;
  subject: string;
  audience: string; // 'ALL_USERS' | 'RESIDENTS' | 'OWNERS' | 'CUSTOM'
  headline: string;
  content: string;
  bannerUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  scheduledAt?: Date | string;
  recipients?: Array<{ email: string; name?: string }>;
}

export class MarketingService {
  private readonly db = prisma;

  async createCampaign(data: CreateCampaignDTO) {
    if (!data.title || !data.subject || !data.content) {
      throw new AppError('Title, subject, and campaign content are required', 400);
    }

    const campaign = await this.db.marketingCampaign.create({
      data: {
        title: data.title,
        subject: data.subject,
        audience: data.audience || 'ALL_USERS',
        html: data.content,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
    });

    return campaign;
  }

  async sendCampaign(campaignId: string) {
    const campaign = await this.db.marketingCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new AppError('Marketing campaign not found', 404);
    }

    await this.db.marketingCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    const result = await emailService.sendMarketingCampaign({
      campaignId: campaign.id,
      title: campaign.title,
      subject: campaign.subject,
      audience: campaign.audience,
      headline: campaign.title,
      content: campaign.html,
    });

    return {
      success: true,
      message: `Marketing campaign dispatched to ${result.dispatched} recipients.`,
      result,
    };
  }

  async listCampaigns() {
    return this.db.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async previewTemplate(data: CreateCampaignDTO) {
    const { emailTemplates } = await import('../email/email.templates');
    const html = emailTemplates.marketingCampaign({
      title: data.title,
      subject: data.subject,
      audience: data.audience,
      headline: data.headline || data.title,
      content: data.content,
      bannerUrl: data.bannerUrl,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
    });

    return { html, subject: data.subject };
  }
}

export const marketingService = new MarketingService();
export default marketingService;
