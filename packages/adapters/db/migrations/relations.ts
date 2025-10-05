import { relations } from "drizzle-orm/relations";
import { company, journal, accountingPeriod, dimCostCenter, journalLine, dimProject, glDimensionRoutes, account, stockLedger, item, budget, budgetLine, budgetImport, payment, paymentAllocation, taxCode, taxRule, apiKey, appUser, journalEntries, journalLines, allocRun, allocLine, fxRevalRun, fxRevalLine, taxReturnRun, taxReturnLine, taxReturnDetail, taxReturnExport, icMatchProposal, icMatchProposalLine, icWorkbenchDecision, cfRun, cfLine, apPayRun, apPayLine, apPayExport, apRemittance, apPaymentPost, apRunApproval, sanctionScreenRun, sanctionHit, bankAck, bankAckMap, icElimRun, icElimLine, icLink, icMatchLine, icMatch, consolRun, consolSummary, budgetApproval, budgetVersion, budgetAlertRule, cashAlertRule, cashForecastVersion, wcProfile, cashLine, driverProfile, forecastLine, forecastVersion, cashAlertIdempotency, apDiscountRun, apDiscountLine, arCashApp, arCashAppLink, membership, allocRule, allocRuleTarget, taxAccountMap, itemCosts } from "./schema";

export const journalRelations = relations(journal, ({one, many}) => ({
	company: one(company, {
		fields: [journal.companyId],
		references: [company.id]
	}),
	journalLines: many(journalLine),
}));

export const companyRelations = relations(company, ({one, many}) => ({
	journals: many(journal),
	accountingPeriods: many(accountingPeriod),
	accounts: many(account),
	stockLedgers: many(stockLedger),
	dimCostCenter: one(dimCostCenter, {
		fields: [company.defaultOperatingCc],
		references: [dimCostCenter.id]
	}),
	budgetLines: many(budgetLine),
	payments_companyId: many(payment, {
		relationName: "payment_companyId_company_id"
	}),
	payments_companyId: many(payment, {
		relationName: "payment_companyId_company_id"
	}),
	apiKeys: many(apiKey),
	budgets: many(budget),
	journalEntries_companyId: many(journalEntries, {
		relationName: "journalEntries_companyId_company_id"
	}),
	journalEntries_companyId: many(journalEntries, {
		relationName: "journalEntries_companyId_company_id"
	}),
	budgetApprovals: many(budgetApproval),
	budgetAlertRules: many(budgetAlertRule),
	cashAlertRules: many(cashAlertRule),
	cashForecastVersions: many(cashForecastVersion),
	cashLines: many(cashLine),
	driverProfiles: many(driverProfile),
	forecastLines: many(forecastLine),
	forecastVersions: many(forecastVersion),
	budgetVersions: many(budgetVersion),
	wcProfiles: many(wcProfile),
	cashAlertIdempotencies: many(cashAlertIdempotency),
	memberships: many(membership),
	itemCosts: many(itemCosts),
}));

export const accountingPeriodRelations = relations(accountingPeriod, ({one}) => ({
	company: one(company, {
		fields: [accountingPeriod.companyId],
		references: [company.id]
	}),
}));

export const journalLineRelations = relations(journalLine, ({one}) => ({
	dimCostCenter_costCenterId: one(dimCostCenter, {
		fields: [journalLine.costCenterId],
		references: [dimCostCenter.id],
		relationName: "journalLine_costCenterId_dimCostCenter_id"
	}),
	dimCostCenter_costCenterId: one(dimCostCenter, {
		fields: [journalLine.costCenterId],
		references: [dimCostCenter.id],
		relationName: "journalLine_costCenterId_dimCostCenter_id"
	}),
	journal: one(journal, {
		fields: [journalLine.journalId],
		references: [journal.id]
	}),
	dimProject_projectId: one(dimProject, {
		fields: [journalLine.projectId],
		references: [dimProject.id],
		relationName: "journalLine_projectId_dimProject_id"
	}),
	dimProject_projectId: one(dimProject, {
		fields: [journalLine.projectId],
		references: [dimProject.id],
		relationName: "journalLine_projectId_dimProject_id"
	}),
}));

export const dimCostCenterRelations = relations(dimCostCenter, ({one, many}) => ({
	journalLines_costCenterId: many(journalLine, {
		relationName: "journalLine_costCenterId_dimCostCenter_id"
	}),
	journalLines_costCenterId: many(journalLine, {
		relationName: "journalLine_costCenterId_dimCostCenter_id"
	}),
	glDimensionRoutes: many(glDimensionRoutes),
	companies: many(company),
	dimCostCenter: one(dimCostCenter, {
		fields: [dimCostCenter.parentId],
		references: [dimCostCenter.id],
		relationName: "dimCostCenter_parentId_dimCostCenter_id"
	}),
	dimCostCenters: many(dimCostCenter, {
		relationName: "dimCostCenter_parentId_dimCostCenter_id"
	}),
	budgetLines: many(budgetLine),
}));

export const dimProjectRelations = relations(dimProject, ({many}) => ({
	journalLines_projectId: many(journalLine, {
		relationName: "journalLine_projectId_dimProject_id"
	}),
	journalLines_projectId: many(journalLine, {
		relationName: "journalLine_projectId_dimProject_id"
	}),
	glDimensionRoutes: many(glDimensionRoutes),
	budgetLines: many(budgetLine),
}));

export const glDimensionRoutesRelations = relations(glDimensionRoutes, ({one}) => ({
	dimCostCenter: one(dimCostCenter, {
		fields: [glDimensionRoutes.costCenterId],
		references: [dimCostCenter.id]
	}),
	dimProject: one(dimProject, {
		fields: [glDimensionRoutes.projectId],
		references: [dimProject.id]
	}),
}));

export const accountRelations = relations(account, ({one, many}) => ({
	company: one(company, {
		fields: [account.companyId],
		references: [company.id]
	}),
	journalLines_accountId: many(journalLines, {
		relationName: "journalLines_accountId_account_id"
	}),
	journalLines_accountId: many(journalLines, {
		relationName: "journalLines_accountId_account_id"
	}),
}));

export const stockLedgerRelations = relations(stockLedger, ({one}) => ({
	company: one(company, {
		fields: [stockLedger.companyId],
		references: [company.id]
	}),
	item: one(item, {
		fields: [stockLedger.itemId],
		references: [item.id]
	}),
}));

export const itemRelations = relations(item, ({many}) => ({
	stockLedgers: many(stockLedger),
	itemCosts: many(itemCosts),
}));

export const budgetLineRelations = relations(budgetLine, ({one}) => ({
	budget_budgetId: one(budget, {
		fields: [budgetLine.budgetId],
		references: [budget.id],
		relationName: "budgetLine_budgetId_budget_id"
	}),
	budget_budgetId: one(budget, {
		fields: [budgetLine.budgetId],
		references: [budget.id],
		relationName: "budgetLine_budgetId_budget_id"
	}),
	company: one(company, {
		fields: [budgetLine.companyId],
		references: [company.id]
	}),
	dimCostCenter: one(dimCostCenter, {
		fields: [budgetLine.costCenterId],
		references: [dimCostCenter.id]
	}),
	dimProject: one(dimProject, {
		fields: [budgetLine.projectId],
		references: [dimProject.id]
	}),
	budgetImport: one(budgetImport, {
		fields: [budgetLine.importId],
		references: [budgetImport.id]
	}),
}));

export const budgetRelations = relations(budget, ({one, many}) => ({
	budgetLines_budgetId: many(budgetLine, {
		relationName: "budgetLine_budgetId_budget_id"
	}),
	budgetLines_budgetId: many(budgetLine, {
		relationName: "budgetLine_budgetId_budget_id"
	}),
	company: one(company, {
		fields: [budget.companyId],
		references: [company.id]
	}),
}));

export const budgetImportRelations = relations(budgetImport, ({many}) => ({
	budgetLines: many(budgetLine),
}));

export const paymentRelations = relations(payment, ({one, many}) => ({
	company_companyId: one(company, {
		fields: [payment.companyId],
		references: [company.id],
		relationName: "payment_companyId_company_id"
	}),
	company_companyId: one(company, {
		fields: [payment.companyId],
		references: [company.id],
		relationName: "payment_companyId_company_id"
	}),
	paymentAllocations_paymentId: many(paymentAllocation, {
		relationName: "paymentAllocation_paymentId_payment_id"
	}),
	paymentAllocations_paymentId: many(paymentAllocation, {
		relationName: "paymentAllocation_paymentId_payment_id"
	}),
}));

export const paymentAllocationRelations = relations(paymentAllocation, ({one}) => ({
	payment_paymentId: one(payment, {
		fields: [paymentAllocation.paymentId],
		references: [payment.id],
		relationName: "paymentAllocation_paymentId_payment_id"
	}),
	payment_paymentId: one(payment, {
		fields: [paymentAllocation.paymentId],
		references: [payment.id],
		relationName: "paymentAllocation_paymentId_payment_id"
	}),
}));

export const taxRuleRelations = relations(taxRule, ({one}) => ({
	taxCode: one(taxCode, {
		fields: [taxRule.taxCodeId],
		references: [taxCode.id]
	}),
}));

export const taxCodeRelations = relations(taxCode, ({many}) => ({
	taxRules: many(taxRule),
	taxAccountMaps: many(taxAccountMap),
}));

export const apiKeyRelations = relations(apiKey, ({one}) => ({
	company: one(company, {
		fields: [apiKey.companyId],
		references: [company.id]
	}),
	appUser: one(appUser, {
		fields: [apiKey.userId],
		references: [appUser.id]
	}),
}));

export const appUserRelations = relations(appUser, ({many}) => ({
	apiKeys: many(apiKey),
	memberships: many(membership),
}));

export const journalEntriesRelations = relations(journalEntries, ({one, many}) => ({
	company_companyId: one(company, {
		fields: [journalEntries.companyId],
		references: [company.id],
		relationName: "journalEntries_companyId_company_id"
	}),
	company_companyId: one(company, {
		fields: [journalEntries.companyId],
		references: [company.id],
		relationName: "journalEntries_companyId_company_id"
	}),
	journalLines_journalId: many(journalLines, {
		relationName: "journalLines_journalId_journalEntries_id"
	}),
	journalLines_journalId: many(journalLines, {
		relationName: "journalLines_journalId_journalEntries_id"
	}),
}));

export const journalLinesRelations = relations(journalLines, ({one}) => ({
	account_accountId: one(account, {
		fields: [journalLines.accountId],
		references: [account.id],
		relationName: "journalLines_accountId_account_id"
	}),
	account_accountId: one(account, {
		fields: [journalLines.accountId],
		references: [account.id],
		relationName: "journalLines_accountId_account_id"
	}),
	journalEntry_journalId: one(journalEntries, {
		fields: [journalLines.journalId],
		references: [journalEntries.id],
		relationName: "journalLines_journalId_journalEntries_id"
	}),
	journalEntry_journalId: one(journalEntries, {
		fields: [journalLines.journalId],
		references: [journalEntries.id],
		relationName: "journalLines_journalId_journalEntries_id"
	}),
}));

export const allocLineRelations = relations(allocLine, ({one}) => ({
	allocRun: one(allocRun, {
		fields: [allocLine.runId],
		references: [allocRun.id]
	}),
}));

export const allocRunRelations = relations(allocRun, ({many}) => ({
	allocLines: many(allocLine),
}));

export const fxRevalLineRelations = relations(fxRevalLine, ({one}) => ({
	fxRevalRun_runId: one(fxRevalRun, {
		fields: [fxRevalLine.runId],
		references: [fxRevalRun.id],
		relationName: "fxRevalLine_runId_fxRevalRun_id"
	}),
	fxRevalRun_runId: one(fxRevalRun, {
		fields: [fxRevalLine.runId],
		references: [fxRevalRun.id],
		relationName: "fxRevalLine_runId_fxRevalRun_id"
	}),
}));

export const fxRevalRunRelations = relations(fxRevalRun, ({many}) => ({
	fxRevalLines_runId: many(fxRevalLine, {
		relationName: "fxRevalLine_runId_fxRevalRun_id"
	}),
	fxRevalLines_runId: many(fxRevalLine, {
		relationName: "fxRevalLine_runId_fxRevalRun_id"
	}),
}));

export const taxReturnLineRelations = relations(taxReturnLine, ({one}) => ({
	taxReturnRun: one(taxReturnRun, {
		fields: [taxReturnLine.runId],
		references: [taxReturnRun.id]
	}),
}));

export const taxReturnRunRelations = relations(taxReturnRun, ({many}) => ({
	taxReturnLines: many(taxReturnLine),
	taxReturnDetails: many(taxReturnDetail),
	taxReturnExports: many(taxReturnExport),
}));

export const taxReturnDetailRelations = relations(taxReturnDetail, ({one}) => ({
	taxReturnRun: one(taxReturnRun, {
		fields: [taxReturnDetail.runId],
		references: [taxReturnRun.id]
	}),
}));

export const taxReturnExportRelations = relations(taxReturnExport, ({one}) => ({
	taxReturnRun: one(taxReturnRun, {
		fields: [taxReturnExport.runId],
		references: [taxReturnRun.id]
	}),
}));

export const icMatchProposalLineRelations = relations(icMatchProposalLine, ({one}) => ({
	icMatchProposal: one(icMatchProposal, {
		fields: [icMatchProposalLine.proposalId],
		references: [icMatchProposal.id]
	}),
}));

export const icMatchProposalRelations = relations(icMatchProposal, ({many}) => ({
	icMatchProposalLines: many(icMatchProposalLine),
	icWorkbenchDecisions: many(icWorkbenchDecision),
}));

export const icWorkbenchDecisionRelations = relations(icWorkbenchDecision, ({one}) => ({
	icMatchProposal: one(icMatchProposal, {
		fields: [icWorkbenchDecision.proposalId],
		references: [icMatchProposal.id]
	}),
}));

export const cfLineRelations = relations(cfLine, ({one}) => ({
	cfRun: one(cfRun, {
		fields: [cfLine.runId],
		references: [cfRun.id]
	}),
}));

export const cfRunRelations = relations(cfRun, ({many}) => ({
	cfLines: many(cfLine),
}));

export const apPayLineRelations = relations(apPayLine, ({one}) => ({
	apPayRun: one(apPayRun, {
		fields: [apPayLine.runId],
		references: [apPayRun.id]
	}),
}));

export const apPayRunRelations = relations(apPayRun, ({many}) => ({
	apPayLines: many(apPayLine),
	apPayExports: many(apPayExport),
	apRemittances: many(apRemittance),
	apPaymentPosts: many(apPaymentPost),
	apRunApprovals: many(apRunApproval),
}));

export const apPayExportRelations = relations(apPayExport, ({one}) => ({
	apPayRun: one(apPayRun, {
		fields: [apPayExport.runId],
		references: [apPayRun.id]
	}),
}));

export const apRemittanceRelations = relations(apRemittance, ({one}) => ({
	apPayRun: one(apPayRun, {
		fields: [apRemittance.runId],
		references: [apPayRun.id]
	}),
}));

export const apPaymentPostRelations = relations(apPaymentPost, ({one}) => ({
	apPayRun: one(apPayRun, {
		fields: [apPaymentPost.runId],
		references: [apPayRun.id]
	}),
}));

export const apRunApprovalRelations = relations(apRunApproval, ({one}) => ({
	apPayRun: one(apPayRun, {
		fields: [apRunApproval.runId],
		references: [apPayRun.id]
	}),
}));

export const sanctionHitRelations = relations(sanctionHit, ({one}) => ({
	sanctionScreenRun: one(sanctionScreenRun, {
		fields: [sanctionHit.screenId],
		references: [sanctionScreenRun.id]
	}),
}));

export const sanctionScreenRunRelations = relations(sanctionScreenRun, ({many}) => ({
	sanctionHits: many(sanctionHit),
}));

export const bankAckMapRelations = relations(bankAckMap, ({one}) => ({
	bankAck: one(bankAck, {
		fields: [bankAckMap.ackId],
		references: [bankAck.id]
	}),
}));

export const bankAckRelations = relations(bankAck, ({many}) => ({
	bankAckMaps: many(bankAckMap),
}));

export const icElimLineRelations = relations(icElimLine, ({one}) => ({
	icElimRun: one(icElimRun, {
		fields: [icElimLine.runId],
		references: [icElimRun.id]
	}),
}));

export const icElimRunRelations = relations(icElimRun, ({many}) => ({
	icElimLines: many(icElimLine),
}));

export const icMatchLineRelations = relations(icMatchLine, ({one}) => ({
	icLink: one(icLink, {
		fields: [icMatchLine.icLinkId],
		references: [icLink.id]
	}),
	icMatch: one(icMatch, {
		fields: [icMatchLine.matchId],
		references: [icMatch.id]
	}),
}));

export const icLinkRelations = relations(icLink, ({many}) => ({
	icMatchLines: many(icMatchLine),
}));

export const icMatchRelations = relations(icMatch, ({many}) => ({
	icMatchLines: many(icMatchLine),
}));

export const consolSummaryRelations = relations(consolSummary, ({one}) => ({
	consolRun: one(consolRun, {
		fields: [consolSummary.runId],
		references: [consolRun.id]
	}),
}));

export const consolRunRelations = relations(consolRun, ({many}) => ({
	consolSummaries: many(consolSummary),
}));

export const budgetApprovalRelations = relations(budgetApproval, ({one}) => ({
	company: one(company, {
		fields: [budgetApproval.companyId],
		references: [company.id]
	}),
	budgetVersion_versionId: one(budgetVersion, {
		fields: [budgetApproval.versionId],
		references: [budgetVersion.id],
		relationName: "budgetApproval_versionId_budgetVersion_id"
	}),
	budgetVersion_versionId: one(budgetVersion, {
		fields: [budgetApproval.versionId],
		references: [budgetVersion.id],
		relationName: "budgetApproval_versionId_budgetVersion_id"
	}),
}));

export const budgetVersionRelations = relations(budgetVersion, ({one, many}) => ({
	budgetApprovals_versionId: many(budgetApproval, {
		relationName: "budgetApproval_versionId_budgetVersion_id"
	}),
	budgetApprovals_versionId: many(budgetApproval, {
		relationName: "budgetApproval_versionId_budgetVersion_id"
	}),
	company: one(company, {
		fields: [budgetVersion.companyId],
		references: [company.id]
	}),
}));

export const budgetAlertRuleRelations = relations(budgetAlertRule, ({one}) => ({
	company: one(company, {
		fields: [budgetAlertRule.companyId],
		references: [company.id]
	}),
}));

export const cashAlertRuleRelations = relations(cashAlertRule, ({one}) => ({
	company: one(company, {
		fields: [cashAlertRule.companyId],
		references: [company.id]
	}),
}));

export const cashForecastVersionRelations = relations(cashForecastVersion, ({one, many}) => ({
	company: one(company, {
		fields: [cashForecastVersion.companyId],
		references: [company.id]
	}),
	wcProfile: one(wcProfile, {
		fields: [cashForecastVersion.profileId],
		references: [wcProfile.id]
	}),
	cashLines: many(cashLine),
}));

export const wcProfileRelations = relations(wcProfile, ({one, many}) => ({
	cashForecastVersions: many(cashForecastVersion),
	company: one(company, {
		fields: [wcProfile.companyId],
		references: [company.id]
	}),
}));

export const cashLineRelations = relations(cashLine, ({one}) => ({
	company: one(company, {
		fields: [cashLine.companyId],
		references: [company.id]
	}),
	cashForecastVersion: one(cashForecastVersion, {
		fields: [cashLine.versionId],
		references: [cashForecastVersion.id]
	}),
}));

export const driverProfileRelations = relations(driverProfile, ({one, many}) => ({
	company: one(company, {
		fields: [driverProfile.companyId],
		references: [company.id]
	}),
	forecastVersions: many(forecastVersion),
}));

export const forecastLineRelations = relations(forecastLine, ({one}) => ({
	company: one(company, {
		fields: [forecastLine.companyId],
		references: [company.id]
	}),
	forecastVersion: one(forecastVersion, {
		fields: [forecastLine.versionId],
		references: [forecastVersion.id]
	}),
}));

export const forecastVersionRelations = relations(forecastVersion, ({one, many}) => ({
	forecastLines: many(forecastLine),
	company: one(company, {
		fields: [forecastVersion.companyId],
		references: [company.id]
	}),
	driverProfile: one(driverProfile, {
		fields: [forecastVersion.driverProfileId],
		references: [driverProfile.id]
	}),
}));

export const cashAlertIdempotencyRelations = relations(cashAlertIdempotency, ({one}) => ({
	company: one(company, {
		fields: [cashAlertIdempotency.companyId],
		references: [company.id]
	}),
}));

export const apDiscountLineRelations = relations(apDiscountLine, ({one}) => ({
	apDiscountRun: one(apDiscountRun, {
		fields: [apDiscountLine.runId],
		references: [apDiscountRun.id]
	}),
}));

export const apDiscountRunRelations = relations(apDiscountRun, ({many}) => ({
	apDiscountLines: many(apDiscountLine),
}));

export const arCashAppLinkRelations = relations(arCashAppLink, ({one}) => ({
	arCashApp: one(arCashApp, {
		fields: [arCashAppLink.cashAppId],
		references: [arCashApp.id]
	}),
}));

export const arCashAppRelations = relations(arCashApp, ({many}) => ({
	arCashAppLinks: many(arCashAppLink),
}));

export const membershipRelations = relations(membership, ({one}) => ({
	company: one(company, {
		fields: [membership.companyId],
		references: [company.id]
	}),
	appUser: one(appUser, {
		fields: [membership.userId],
		references: [appUser.id]
	}),
}));

export const allocRuleTargetRelations = relations(allocRuleTarget, ({one}) => ({
	allocRule: one(allocRule, {
		fields: [allocRuleTarget.ruleId],
		references: [allocRule.id]
	}),
}));

export const allocRuleRelations = relations(allocRule, ({many}) => ({
	allocRuleTargets: many(allocRuleTarget),
}));

export const taxAccountMapRelations = relations(taxAccountMap, ({one}) => ({
	taxCode: one(taxCode, {
		fields: [taxAccountMap.taxCodeId],
		references: [taxCode.id]
	}),
}));

export const itemCostsRelations = relations(itemCosts, ({one}) => ({
	company: one(company, {
		fields: [itemCosts.companyId],
		references: [company.id]
	}),
	item: one(item, {
		fields: [itemCosts.itemId],
		references: [item.id]
	}),
}));