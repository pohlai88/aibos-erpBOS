// M15.2 Email Service Integration for M24.2 Customer Portal
// Provides email sending capabilities for magic links and receipts

import { env } from '@/lib/env';

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

export interface EmailRequest {
    to: string;
    from?: string;
    subject: string;
    html: string;
    text: string;
    templateId?: string;
    context?: Record<string, any>;
}

export interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

export class EmailService {
    private fromEmail: string;

    constructor() {
        this.fromEmail = env.RECEIPTS_FROM_EMAIL;
    }

    /**
     * Send magic link email for portal access
     */
    async sendMagicLink(
        to: string,
        magicLink: string,
        customerName?: string,
        companyName?: string
    ): Promise<EmailResponse> {
        const template = this.getMagicLinkTemplate(magicLink, customerName, companyName);
        
        return this.sendEmail({
            to,
            from: this.fromEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
            templateId: 'portal-magic-link',
            context: { magicLink, customerName, companyName }
        });
    }

    /**
     * Send receipt email after successful payment
     */
    async sendReceipt(
        to: string,
        transactionId: string,
        amount: number,
        currency: string,
        receiptUrl: string,
        customerName?: string,
        companyName?: string
    ): Promise<EmailResponse> {
        const template = this.getReceiptTemplate(
            transactionId, 
            amount, 
            currency, 
            receiptUrl, 
            customerName, 
            companyName
        );
        
        return this.sendEmail({
            to,
            from: this.fromEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
            templateId: 'payment-receipt',
            context: { transactionId, amount, currency, receiptUrl, customerName, companyName }
        });
    }

    /**
     * Send email using M15.2 dispatcher
     */
    private async sendEmail(request: EmailRequest): Promise<EmailResponse> {
        try {
            // TODO: Integrate with actual M15.2 email dispatcher
            // For now, simulate email sending
            console.log('📧 Email Service:', {
                to: request.to,
                subject: request.subject,
                templateId: request.templateId,
                context: request.context
            });

            // Simulate API call to M15.2 email service
            const response = await this.callM15EmailService(request);
            
            return {
                success: true,
                messageId: response.messageId || `msg_${Date.now()}`,
            };
        } catch (error) {
            console.error('Email sending failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Call M15.2 email dispatcher service
     */
    private async callM15EmailService(request: EmailRequest): Promise<{ messageId: string }> {
        // TODO: Replace with actual M15.2 email service call
        // This would typically be an HTTP call to the M15.2 email microservice
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Simulate successful response
        return {
            messageId: `m15_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    /**
     * Get magic link email template
     */
    private getMagicLinkTemplate(
        magicLink: string, 
        customerName?: string, 
        companyName?: string
    ): EmailTemplate {
        const displayName = customerName || 'Valued Customer';
        const company = companyName || 'AI-BOS';
        
        const subject = `Your ${company} Customer Portal Access Link`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Hello ${displayName}!</h2>
                    
                    <p>You have been granted access to the ${company} Customer Portal. Click the link below to view your invoices and make payments:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${magicLink}" 
                           style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Access Customer Portal
                        </a>
                    </div>
                    
                    <p><strong>Important:</strong> This link will expire in 60 minutes for security reasons.</p>
                    
                    <p>If you didn't request this access, please contact our support team.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        This email was sent by ${company} Customer Portal System.
                    </p>
                </div>
            </body>
            </html>
        `;
        
        const text = `
            Hello ${displayName}!
            
            You have been granted access to the ${company} Customer Portal.
            
            Access your portal here: ${magicLink}
            
            Important: This link will expire in 60 minutes for security reasons.
            
            If you didn't request this access, please contact our support team.
            
            ---
            This email was sent by ${company} Customer Portal System.
        `;
        
        return { subject, html, text };
    }

    /**
     * Get receipt email template
     */
    private getReceiptTemplate(
        transactionId: string,
        amount: number,
        currency: string,
        receiptUrl: string,
        customerName?: string,
        companyName?: string
    ): EmailTemplate {
        const displayName = customerName || 'Valued Customer';
        const company = companyName || 'AI-BOS';
        
        const subject = `Payment Receipt - ${currency} ${amount.toFixed(2)}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #27ae60;">Payment Confirmation</h2>
                    
                    <p>Hello ${displayName},</p>
                    
                    <p>Thank you for your payment! Your transaction has been processed successfully.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #2c3e50;">Payment Details</h3>
                        <p><strong>Transaction ID:</strong> ${transactionId}</p>
                        <p><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Status:</strong> <span style="color: #27ae60;">Completed</span></p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${receiptUrl}" 
                           style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Download Receipt
                        </a>
                    </div>
                    
                    <p>Please keep this email as a record of your payment.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        This receipt was generated by ${company} Customer Portal System.
                    </p>
                </div>
            </body>
            </html>
        `;
        
        const text = `
            Payment Confirmation
            
            Hello ${displayName},
            
            Thank you for your payment! Your transaction has been processed successfully.
            
            Payment Details:
            - Transaction ID: ${transactionId}
            - Amount: ${currency} ${amount.toFixed(2)}
            - Date: ${new Date().toLocaleDateString()}
            - Status: Completed
            
            Download your receipt: ${receiptUrl}
            
            Please keep this email as a record of your payment.
            
            ---
            This receipt was generated by ${company} Customer Portal System.
        `;
        
        return { subject, html, text };
    }
}

// Singleton instance
export const emailService = new EmailService();
