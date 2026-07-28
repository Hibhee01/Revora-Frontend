import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { OfferingRegistrationSuccess } from '../components/OfferingRegistrationSuccess';
import { CheckCircle } from 'lucide-react';

export const OfferingWizardSummary: React.FC = () => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <OfferingRegistrationSuccess
        issuerName="TechFlow AI"
        offeringName="Revenue Share Agreement"
        submissionDate={new Date().toISOString()}
        estimatedReviewDays={5}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review & Submit Offering</h1>
        <p className="text-muted text-sm mt-1">
          Please review the details of your offering before submitting.
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: Company Details */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700 pb-2">
            <h2 className="text-xl font-semibold">Company Details</h2>
            <Link to="/startup/wizard/company" className="text-sm text-accent hover:underline flex items-center gap-1 focus:ring-2 focus:ring-accent rounded-sm outline-none">
              Edit step
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Company Name</span>
              <div className="text-base font-medium">TechFlow AI</div>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Industry</span>
              <div className="text-base font-medium">Enterprise SaaS</div>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Registration Number</span>
              <div className="text-base font-medium">123456789</div>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Website</span>
              <div className="text-base font-medium">https://techflow.ai</div>
            </div>
            <div className="md:col-span-2">
              <span className="text-xs text-muted uppercase tracking-wide">Description</span>
              <div className="text-base font-medium mt-1">TechFlow AI is an enterprise SaaS platform providing AI-driven workflow automation.</div>
            </div>
          </div>
        </section>

        {/* Section 2: Offering Terms */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700 pb-2">
            <h2 className="text-xl font-semibold">Offering Terms</h2>
            <Link to="/startup/wizard/terms" className="text-sm text-accent hover:underline flex items-center gap-1 focus:ring-2 focus:ring-accent rounded-sm outline-none">
              Edit step
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Target Amount</span>
              <div className="text-base font-medium">$250,000</div>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Revenue Share</span>
              <div className="text-base font-medium">15%</div>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Term Length</span>
              <div className="text-base font-medium">36 months</div>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Minimum Investment</span>
              <div className="text-base font-medium">$1,000</div>
            </div>
          </div>
        </section>

        {/* Section 3: Legal & Compliance */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700 pb-2">
            <h2 className="text-xl font-semibold">Legal & Compliance</h2>
            <Link to="/startup/wizard/legal" className="text-sm text-accent hover:underline flex items-center gap-1 focus:ring-2 focus:ring-accent rounded-sm outline-none">
              Edit step
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Risk Level</span>
              <div className="text-base font-medium">Medium</div>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wide">Jurisdiction</span>
              <div className="text-base font-medium">United States (Delaware)</div>
            </div>
            <div className="md:col-span-2">
              <span className="text-xs text-muted uppercase tracking-wide">Uploaded Documents</span>
              <ul className="mt-1 space-y-2">
                <li className="text-base font-medium flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" aria-hidden="true" /> prospectus_v1.pdf
                </li>
                <li className="text-base font-medium flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" aria-hidden="true" /> articles_of_incorporation.pdf
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Acknowledgement and Submit */}
      <form onSubmit={handleSubmit} className="glass-card p-6 bg-slate-900/50 border-slate-700 space-y-6">
        <h3 className="text-lg font-semibold border-b border-slate-700 pb-2">Final Acknowledgement</h3>
        
        <label className="flex items-start gap-3 cursor-pointer group" htmlFor="legal-acknowledgement">
          <div className="relative flex items-start mt-1">
            <input
              type="checkbox"
              id="legal-acknowledgement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer sr-only"
              aria-required="true"
            />
            <div className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-800 peer-checked:bg-primary peer-checked:border-primary peer-focus:ring-2 peer-focus:ring-primary/50 transition-all flex items-center justify-center group-hover:border-slate-500" aria-hidden="true">
               {agreed && <CheckCircle size={14} className="text-white" />}
            </div>
          </div>
          <div className="text-sm text-slate-300">
            I acknowledge that by submitting this offering, I am entering into a legally binding agreement to distribute revenue via Revora's smart contracts. All provided information is accurate and compliant with relevant regulations.
          </div>
        </label>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/startup/wizard/legal" tabIndex={-1}>
            <Button variant="secondary" type="button">Back</Button>
          </Link>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={!agreed || isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Offering'}
          </Button>
        </div>
      </form>
    </div>
  );
};
