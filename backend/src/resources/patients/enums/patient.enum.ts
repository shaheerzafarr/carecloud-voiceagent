/**
 * Patient Sex Enum
 * Represents the biological sex options for patient registration.
 * Matches the assessment requirement: Male, Female, Other, Decline to Answer
 */
export enum SEX {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  DECLINE_TO_ANSWER = 'Decline to Answer',
}

/**
 * Valid U.S. State Abbreviations
 * Used for address validation in patient registration.
 */
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
] as const;

export type USState = (typeof US_STATES)[number];
