const bridgeUrl = 'http://localhost:39922';

const curricula = [
    {
        name: 'Curriculum_Customer_Service_Extreme',
        content: `Extreme Customer Service Mastery:
1. The Zappos WOW: Deliver happiness through every interaction.
2. The Disney Smile: Magical, seamless touchpoints.
3. Radical Accountability: Solution + 1 extra value add for any failure.
4. Audience Calibration: Adapt tone for plumbers vs CEOs (Partnership mindset).`
    },
    {
        name: 'Curriculum_SEO_AEO_Expertise',
        content: `SEO & Answer Engine Optimization (AEO):
1. Semantic Context: Structure content to answer specific high-intent questions.
2. Schema Sovereignty: Use JSON-LD to define exact meanings for AI crawlers.
3. Voice Search Optimization: Shift from keywords to conversational natural language queries.
4. Authority Building: Focus on E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).`
    },
    {
        name: 'Curriculum_Business_Law_Compliance',
        content: `Sovereign Business Law & Compliance:
1. Contractual Integrity: Understanding core terms in SaaS and service agreements.
2. Intellectual Property Protection: Shielding the "Nova-Elite" code and training data.
3. Digital Compliance: Adhering to GDPR, CCPA, and emerging AI regulations in 2026.`
    },
    {
        name: 'Curriculum_Marketing_Trends_2026',
        content: `Advanced Marketing Trends:
1. Community-Led Growth: Focus on deep engagement in niche circles.
2. AI-Native Personalization: Hyper-customizing user journeys in real-time.
3. Vertical Video Dominance: Mastering short-form persuasion for high-dwell platforms.`
    }
];

async function ingest() {
    for (const c of curricula) {
        console.log(`Ingesting ${c.name}...`);
        try {
            const res = await fetch(`${bridgeUrl}/api/schooling/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(c)
            });
            const data = await res.json();
            console.log(`Result: ${JSON.stringify(data)}`);
        } catch (e) {
            console.error(`Failed ${c.name}:`, e.message);
        }
    }
}

ingest();
