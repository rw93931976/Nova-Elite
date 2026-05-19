export function buildNovaReview(label: string, value: number, context?: string): string {
  const ctx = context ? ` (${context})` : '';
  if (value < 20) {
    return `Nova review${ctx}: "${label}" is foundational—keep guardrails tight; no production promotion yet.`;
  }
  if (value < 45) {
    return `Nova review${ctx}: "${label}" is in active build. Log evidence before you widen autonomy.`;
  }
  if (value < 70) {
    return `Nova review${ctx}: "${label}" is maturing. I recommend staged rollout with kill-switch drills—you approve each step.`;
  }
  if (value < 90) {
    return `Nova review${ctx}: "${label}" looks operationally close. Cross-check live telemetry; your sign-off still required.`;
  }
  return `Nova review${ctx}: "${label}" reads ready on paper—I support promotion only after your final architect approval.`;
}
