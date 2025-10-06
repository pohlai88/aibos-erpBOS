import { db } from '@/lib/db';
import { mdnaTemplate, mdnaDraft, mdnaPublish } from '@aibos/db-adapter/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { ulid } from 'ulid';
import { logLine } from '@/lib/log';
import { createHash } from 'crypto';
import type {
  MdnaTemplateUpsertType,
  MdnaTemplateQueryType,
  MdnaDraftUpsertType,
  MdnaDraftQueryType,
  MdnaPublishReqType,
  MdnaPublishQueryType,
  MdnaTemplateResponseType,
  MdnaDraftResponseType,
  MdnaPublishResponseType,
} from '@aibos/contracts';

export class MdnaService {
  /**
   * Upsert MD&A template
   */
  async upsertTemplate(
    companyId: string,
    userId: string,
    data: MdnaTemplateUpsertType
  ): Promise<MdnaTemplateResponseType> {
    const templateResult = await db
      .insert(mdnaTemplate)
      .values({
        id: ulid(),
        companyId,
        name: data.name,
        sections: data.sections,
        variables: data.variables,
        status: 'DRAFT',
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    const template = templateResult[0];
    if (!template) {
      throw new Error('Failed to create MD&A template');
    }

    logLine({
      msg: `Created MD&A template ${template.id} for ${companyId}`,
      templateId: template.id,
      companyId,
    });

    return {
      id: template.id,
      company_id: template.companyId,
      name: template.name,
      sections: template.sections,
      variables: template.variables,
      status: template.status,
      created_at: template.createdAt.toISOString(),
      created_by: template.createdBy,
      updated_at: template.updatedAt.toISOString(),
      updated_by: template.updatedBy,
    };
  }

  /**
   * Query MD&A templates
   */
  async queryTemplates(
    companyId: string,
    query: MdnaTemplateQueryType
  ): Promise<MdnaTemplateResponseType[]> {
    let whereConditions = [eq(mdnaTemplate.companyId, companyId)];

    if (query.status !== undefined) {
      whereConditions.push(eq(mdnaTemplate.status, query.status));
    }

    const templates = await db
      .select()
      .from(mdnaTemplate)
      .where(and(...whereConditions))
      .orderBy(desc(mdnaTemplate.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return templates.map(template => ({
      id: template.id,
      company_id: template.companyId,
      name: template.name,
      sections: template.sections,
      variables: template.variables,
      status: template.status,
      created_at: template.createdAt.toISOString(),
      created_by: template.createdBy,
      updated_at: template.updatedAt.toISOString(),
      updated_by: template.updatedBy,
    }));
  }

  /**
   * Approve MD&A template
   */
  async approveTemplate(
    companyId: string,
    templateId: string,
    userId: string
  ): Promise<void> {
    await db
      .update(mdnaTemplate)
      .set({
        status: 'APPROVED',
        updatedBy: userId,
      })
      .where(
        and(
          eq(mdnaTemplate.id, templateId),
          eq(mdnaTemplate.companyId, companyId)
        )
      );

    logLine({
      msg: `Approved MD&A template ${templateId} for ${companyId}`,
      templateId,
      companyId,
    });
  }

  /**
   * Create MD&A draft
   */
  async createDraft(
    companyId: string,
    userId: string,
    data: MdnaDraftUpsertType
  ): Promise<MdnaDraftResponseType> {
    const draftResult = await db
      .insert(mdnaDraft)
      .values({
        id: ulid(),
        companyId,
        runId: data.run_id,
        templateId: data.template_id,
        content: data.content,
        variables: data.variables,
        status: 'EDITING',
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    const draft = draftResult[0];
    if (!draft) {
      throw new Error('Failed to create MD&A draft');
    }

    logLine({
      msg: `Created MD&A draft ${draft.id} for ${companyId}`,
      draftId: draft.id,
      companyId,
    });

    return {
      id: draft.id,
      company_id: draft.companyId,
      run_id: draft.runId || undefined,
      template_id: draft.templateId,
      content: draft.content,
      variables: draft.variables,
      status: draft.status,
      created_at: draft.createdAt.toISOString(),
      created_by: draft.createdBy,
      updated_at: draft.updatedAt.toISOString(),
      updated_by: draft.updatedBy,
    };
  }

  /**
   * Update MD&A draft
   */
  async updateDraft(
    companyId: string,
    draftId: string,
    userId: string,
    data: Partial<MdnaDraftUpsertType>
  ): Promise<MdnaDraftResponseType> {
    const [updatedDraft] = await db
      .update(mdnaDraft)
      .set({
        content: data.content || undefined,
        variables: data.variables || undefined,
        updatedBy: userId,
      })
      .where(and(eq(mdnaDraft.id, draftId), eq(mdnaDraft.companyId, companyId)))
      .returning();

    if (!updatedDraft) {
      throw new Error(`MD&A draft ${draftId} not found`);
    }

    return {
      id: updatedDraft.id,
      company_id: updatedDraft.companyId,
      run_id: updatedDraft.runId || undefined,
      template_id: updatedDraft.templateId,
      content: updatedDraft.content,
      variables: updatedDraft.variables,
      status: updatedDraft.status,
      created_at: updatedDraft.createdAt.toISOString(),
      created_by: updatedDraft.createdBy,
      updated_at: updatedDraft.updatedAt.toISOString(),
      updated_by: updatedDraft.updatedBy,
    };
  }

  /**
   * Query MD&A drafts
   */
  async queryDrafts(
    companyId: string,
    query: MdnaDraftQueryType
  ): Promise<MdnaDraftResponseType[]> {
    let whereConditions = [eq(mdnaDraft.companyId, companyId)];

    if (query.template_id !== undefined) {
      whereConditions.push(eq(mdnaDraft.templateId, query.template_id));
    }
    if (query.run_id !== undefined) {
      whereConditions.push(eq(mdnaDraft.runId, query.run_id));
    }
    if (query.status !== undefined) {
      whereConditions.push(eq(mdnaDraft.status, query.status));
    }

    const drafts = await db
      .select()
      .from(mdnaDraft)
      .where(and(...whereConditions))
      .orderBy(desc(mdnaDraft.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return drafts.map(draft => ({
      id: draft.id,
      company_id: draft.companyId,
      run_id: draft.runId || undefined,
      template_id: draft.templateId,
      content: draft.content,
      variables: draft.variables,
      status: draft.status,
      created_at: draft.createdAt.toISOString(),
      created_by: draft.createdBy,
      updated_at: draft.updatedAt.toISOString(),
      updated_by: draft.updatedBy,
    }));
  }

  /**
   * Approve MD&A draft
   */
  async approveDraft(
    companyId: string,
    draftId: string,
    userId: string
  ): Promise<void> {
    await db
      .update(mdnaDraft)
      .set({
        status: 'APPROVED',
        updatedBy: userId,
      })
      .where(
        and(eq(mdnaDraft.id, draftId), eq(mdnaDraft.companyId, companyId))
      );

    logLine({
      msg: `Approved MD&A draft ${draftId} for ${companyId}`,
      draftId,
      companyId,
    });
  }

  /**
   * Publish MD&A report
   */
  async publishMdna(
    companyId: string,
    userId: string,
    data: MdnaPublishReqType
  ): Promise<MdnaPublishResponseType> {
    let draftId: string;

    if (data.draft_id) {
      draftId = data.draft_id;
    } else if (data.template_id) {
      // Create a new draft from template
      const draft = await this.createDraft(companyId, userId, {
        template_id: data.template_id,
        run_id: data.run_id,
        content: {},
        variables: {},
      });
      draftId = draft.id;
    } else {
      throw new Error('Either draft_id or template_id must be provided');
    }

    // Get the draft
    const [draft] = await db
      .select()
      .from(mdnaDraft)
      .where(and(eq(mdnaDraft.id, draftId), eq(mdnaDraft.companyId, companyId)))
      .limit(1);

    if (!draft) {
      throw new Error(`MD&A draft ${draftId} not found`);
    }

    if (draft.status !== 'APPROVED') {
      throw new Error(
        `MD&A draft ${draftId} must be approved before publishing`
      );
    }

    // Render the MD&A content
    const renderedContent = await this.renderMdnaContent(companyId, draft);

    // Generate HTML and checksum
    const htmlContent = this.generateHtml(renderedContent);
    const checksum = this.generateChecksum(htmlContent);
    const htmlUri = await this.storeHtml(htmlContent, companyId, draftId);

    // Create published version
    const publishedResult = await db
      .insert(mdnaPublish)
      .values({
        id: ulid(),
        companyId,
        runId: data.run_id,
        draftId,
        htmlUri,
        checksum,
        publishedBy: userId,
      })
      .returning();

    const published = publishedResult[0];
    if (!published) {
      throw new Error('Failed to publish MD&A');
    }

    logLine({
      msg: `Published MD&A ${published.id} for ${companyId}`,
      publishId: published.id,
      companyId,
    });

    return {
      id: published.id,
      company_id: published.companyId,
      run_id: published.runId || undefined,
      draft_id: published.draftId,
      html_uri: published.htmlUri,
      checksum: published.checksum,
      published_at: published.publishedAt.toISOString(),
      published_by: published.publishedBy,
    };
  }

  /**
   * Query published MD&A reports
   */
  async queryPublished(
    companyId: string,
    query: MdnaPublishQueryType
  ): Promise<MdnaPublishResponseType[]> {
    let whereConditions = [eq(mdnaPublish.companyId, companyId)];

    if (query.run_id !== undefined) {
      whereConditions.push(eq(mdnaPublish.runId, query.run_id));
    }
    if (query.draft_id !== undefined) {
      whereConditions.push(eq(mdnaPublish.draftId, query.draft_id));
    }

    const published = await db
      .select()
      .from(mdnaPublish)
      .where(and(...whereConditions))
      .orderBy(desc(mdnaPublish.publishedAt))
      .limit(query.limit)
      .offset(query.offset);

    return published.map(pub => ({
      id: pub.id,
      company_id: pub.companyId,
      run_id: pub.runId || undefined,
      draft_id: pub.draftId,
      html_uri: pub.htmlUri,
      checksum: pub.checksum,
      published_at: pub.publishedAt.toISOString(),
      published_by: pub.publishedBy,
    }));
  }

  /**
   * Render MD&A content with variable substitution
   */
  private async renderMdnaContent(companyId: string, draft: any): Promise<any> {
    // This would integrate with your KPI, flux, and other data sources
    // For now, return the draft content as-is
    return draft.content;
  }

  /**
   * Generate HTML from rendered content
   */
  private generateHtml(content: any): string {
    // This would convert the structured content to HTML
    // For now, return a simple HTML structure
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Management Discussion & Analysis</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .section { margin-bottom: 30px; }
    </style>
</head>
<body>
    <h1>Management Discussion & Analysis</h1>
    <div class="content">
        ${JSON.stringify(content, null, 2)}
    </div>
</body>
</html>`;
  }

  /**
   * Generate SHA256 checksum for content
   */
  private generateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Store HTML content and return URI
   */
  private async storeHtml(
    content: string,
    companyId: string,
    draftId: string
  ): Promise<string> {
    // This would integrate with your blob storage service
    // For now, return a mock URI
    return `https://storage.example.com/mdna/${companyId}/${draftId}.html`;
  }
}
