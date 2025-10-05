import { serve } from "inngest/next";
import { cashDailyAlerts, inngest } from "../../../inngest/cashDailyAlerts";
import { arDunningDaily } from "../../../inngest/arDunningDaily";
import { arCashAppHourly } from "../../../inngest/arCashAppHourly";
import { arCreditEvaluationDaily } from "../../../inngest/arCreditEvaluationDaily";
import { arCollectionsKpiDaily } from "../../../inngest/arCollectionsKpiDaily";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        cashDailyAlerts,
        arDunningDaily,
        arCashAppHourly,
        arCreditEvaluationDaily,
        arCollectionsKpiDaily
    ]
});
