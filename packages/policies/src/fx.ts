export type FxQuote = { date: string; from: string; to: string; rate: number };

export type FxPolicy = {
    // Choose an effective date: doc_date, or nearest prior.
    pickDate: (docDateISO: string) => string;
    // Choose a rate from available quotes (prefer same-day, else nearest prior within N days).
    selectRate: (quotes: FxQuote[], from: string, to: string, on: string) => number | null;
};

export const DefaultFxPolicy: FxPolicy = {
    pickDate: (d) => d.slice(0, 10),
    selectRate: (quotes, from, to, on) => {
        const q = quotes
            .filter(q => q.from === from && q.to === to && q.date <= on)
            .sort((a, b) => (a.date < b.date ? 1 : -1)); // latest first
        return q[0]?.rate ?? null;
    }
};
