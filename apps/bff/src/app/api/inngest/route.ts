import { serve } from "inngest/next";
import { cashDailyAlerts, inngest } from "../../../inngest/cashDailyAlerts";

export const { GET, POST, PUT } = serve({ client: inngest, functions: [cashDailyAlerts] });
