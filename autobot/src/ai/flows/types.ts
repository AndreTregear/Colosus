export type BusinessType = 'retail' | 'service' | 'delivery' | 'lead_capture';

export interface BusinessFlowConfig {
  type: BusinessType;
  /** What the agent should optimize for — included in system prompt as goals. */
  goals: string[];
  /** Soft guidance for conversation flow — not hard rules, just hints. */
  guidelines: string[];
  /** What customer info must be collected before completing a transaction. */
  requiredCustomerInfo: string[];
}
