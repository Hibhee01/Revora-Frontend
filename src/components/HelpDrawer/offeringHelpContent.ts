/**
 * Per-step contextual help content for the Offering Registration wizard.
 *
 * Steps: application → kyc-check → compliance-review → listed → funding-open
 */

import type { HelpDrawerContent } from './HelpDrawer';

export type OfferingStep =
  | 'application'
  | 'kyc-check'
  | 'compliance-review'
  | 'listed'
  | 'funding-open';

export const OFFERING_HELP_CONTENT: Record<OfferingStep, HelpDrawerContent> = {
  application: {
    title: 'Application',
    stepLabel: 'Step 1 of 5',
    overview:
      'The Application step collects the core details about your offering — ' +
      'company name, offering type, total raise amount, and revenue-share terms. ' +
      'This information is used to generate your offering memorandum and displayed ' +
      'to prospective investors on the discovery portal.',
    definitions: [
      {
        term: 'Offering Type',
        description:
          'Whether you are raising via equity, revenue-share, or a hybrid instrument. ' +
          'Revenue-share offerings entitle investors to a percentage of future gross revenue ' +
          'rather than equity ownership.',
      },
      {
        term: 'Total Raise Amount',
        description:
          'The maximum capital you intend to raise in this offering round. ' +
          'You may close the round early once the target is met.',
      },
      {
        term: 'Cap Table',
        description:
          'A capitalisation table listing all shareholders, their ownership percentages, ' +
          'and the value of their equity. For revenue-share offerings this is replaced by ' +
          'a payout-allocation schedule.',
      },
      {
        term: 'Revenue Share %',
        description:
          'The percentage of gross revenue distributed to investors each reporting period. ' +
          'Common ranges are 2–8 %; the exact rate is locked at offering creation.',
      },
    ],
    example:
      '"Acme Corp is raising $500,000 via a 4 % revenue-share offering. ' +
      'Investors receive quarterly payouts proportional to their investment ' +
      'until a 1.5× return cap is reached."',
    links: [
      {
        label: 'Revenue-share instruments explained',
        href: 'https://docs.revora.io/offerings/revenue-share',
      },
      {
        label: 'Offering memorandum template',
        href: 'https://docs.revora.io/offerings/memorandum',
      },
    ],
    footerNote: 'Your draft is auto-saved every 30 seconds.',
  },

  'kyc-check': {
    title: 'KYC Check',
    stepLabel: 'Step 2 of 5',
    overview:
      'Know Your Customer (KYC) verification confirms the legal identity of your ' +
      'business and its beneficial owners. Regulators require this before any ' +
      'securities offering can proceed. The review typically completes within 2 business days.',
    definitions: [
      {
        term: 'KYC (Know Your Customer)',
        description:
          'A mandatory identity-verification process that checks government-issued IDs, ' +
          'proof of address, and corporate registration documents.',
      },
      {
        term: 'Beneficial Owner',
        description:
          'Any individual who directly or indirectly owns 25 % or more of the company. ' +
          'All beneficial owners must complete KYC.',
      },
      {
        term: 'AML (Anti-Money Laundering)',
        description:
          'Regulations that prevent the use of financial systems for illegal fund transfers. ' +
          'KYC is the primary tool for AML compliance.',
      },
    ],
    example:
      '"Upload a clear scan of your passport and a utility bill dated within ' +
      'the last 3 months. Files must be PDF, PNG, or JPG and under 10 MB each."',
    links: [
      {
        label: 'What documents are required?',
        href: 'https://docs.revora.io/kyc/required-documents',
      },
      {
        label: 'KYC review timeline',
        href: 'https://docs.revora.io/kyc/timeline',
      },
    ],
    footerNote: 'Documents are encrypted in transit and at rest.',
  },

  'compliance-review': {
    title: 'Compliance Review',
    stepLabel: 'Step 3 of 5',
    overview:
      'The Revora compliance team reviews your offering against applicable ' +
      'securities regulations (e.g. Reg CF, Reg D, Reg A+). This step ensures ' +
      'your offering memorandum, financial disclosures, and risk factors are ' +
      'complete and accurate before going live.',
    definitions: [
      {
        term: 'Regulation CF',
        description:
          'US crowdfunding exemption allowing companies to raise up to $5 M per year ' +
          'from non-accredited investors via a registered funding portal.',
      },
      {
        term: 'Regulation D',
        description:
          'SEC safe-harbour allowing offerings to accredited investors without ' +
          'full SEC registration. Most common for early-stage raises.',
      },
      {
        term: 'Risk Factors',
        description:
          'Disclosures of material risks that could affect an investor\'s decision. ' +
          'Examples: key-person risk, market competition, regulatory changes.',
      },
      {
        term: 'FINRA',
        description:
          'Financial Industry Regulatory Authority — the US self-regulatory body ' +
          'that oversees broker-dealers and certain crowdfunding portals.',
      },
    ],
    example:
      '"If your offering targets retail investors under Reg CF, your financials ' +
      'must be reviewed (raises up to $1.07 M) or audited (above $1.07 M) by ' +
      'a licensed CPA."',
    links: [
      {
        label: 'Offering exemptions comparison',
        href: 'https://docs.revora.io/compliance/exemptions',
      },
      {
        label: 'Financial disclosure requirements',
        href: 'https://docs.revora.io/compliance/financials',
      },
    ],
    footerNote: 'Avg. compliance review time: 3–5 business days.',
  },

  listed: {
    title: 'Listed',
    stepLabel: 'Step 4 of 5',
    overview:
      'Your offering is now published on the Revora investor portal. ' +
      'Investors can view your offering page, ask questions via the Q&A board, ' +
      'and commit capital. You can update the offering description and FAQs ' +
      'at any time during the funding window.',
    definitions: [
      {
        term: 'Offering Page',
        description:
          'The public-facing page investors see on the discovery portal. ' +
          'It includes your pitch deck, financials, team bios, and the Q&A board.',
      },
      {
        term: 'Funding Window',
        description:
          'The period during which investors can commit capital. ' +
          'You set the duration (30–180 days) when creating the offering.',
      },
      {
        term: 'Soft Commit',
        description:
          'A non-binding expression of interest. Capital is only moved ' +
          'when the investor confirms and the funding window closes.',
      },
    ],
    example:
      '"Your offering is live. Share the portal link on LinkedIn and in your ' +
      'investor update newsletter to maximise visibility during the first 72 hours."',
    links: [
      {
        label: 'Promoting your offering',
        href: 'https://docs.revora.io/listings/promotion',
      },
      {
        label: 'Managing your Q&A board',
        href: 'https://docs.revora.io/listings/qanda',
      },
    ],
  },

  'funding-open': {
    title: 'Funding Open',
    stepLabel: 'Step 5 of 5',
    overview:
      'Capital commitments are being processed. Once the funding window closes ' +
      '(or the raise target is met), funds are transferred to your designated ' +
      'bank account minus Revora platform fees. Revenue-share distributions ' +
      'begin on the first scheduled payout date.',
    definitions: [
      {
        term: 'Platform Fee',
        description:
          'Revora charges a success fee (typically 5–7 %) on funds raised, ' +
          'deducted at the time of transfer.',
      },
      {
        term: 'Payout Schedule',
        description:
          'The agreed frequency (monthly, quarterly) at which you distribute ' +
          'the revenue-share percentage to investors.',
      },
      {
        term: 'Escrow',
        description:
          'Funds committed by investors are held in a regulated escrow account ' +
          'until the offering closes successfully or is cancelled.',
      },
    ],
    example:
      '"Your raise closes on 31 Aug. Funds clear escrow by 7 Sep. ' +
      'First quarterly revenue-share payout is due 31 Oct based on ' +
      'Q3 gross revenue submitted via the Revenue Reporting Calendar."',
    links: [
      {
        label: 'Payout schedule & reporting',
        href: 'https://docs.revora.io/payouts/schedule',
      },
      {
        label: 'Closing and fund transfer FAQ',
        href: 'https://docs.revora.io/offerings/closing',
      },
    ],
    footerNote: 'Funds typically clear within 5 business days of close.',
  },
};
