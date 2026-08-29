import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LocalizedText } from "./LocalizedText";
import {
  formatCurrency,
  formatDate,
  LOCALE_FORMAT_SETTINGS,
  SupportedLocale,
} from "../constants/i18n";
import { TERMINOLOGY } from "../constants/terminology";
import { RevenueReportUpload } from "./RevenueReportUpload";
import type { UploadableFile } from "./RevenueReportUpload";

const currencyOptions = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];

const localeOptions: Array<{ value: SupportedLocale; label: string }> = (
  Object.keys(LOCALE_FORMAT_SETTINGS) as SupportedLocale[]
).map((locale) => ({
  value: locale,
  label: LOCALE_FORMAT_SETTINGS[locale].label,
}));

const reportPeriods = [
  { value: "2026-05", label: "May 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
];

export function RevenueReportForm() {
  const [reportPeriod, setReportPeriod] = useState(reportPeriods[0].value);
  const [grossRevenue, setGrossRevenue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [locale, setLocale] = useState<SupportedLocale>(localeOptions[0].value);
  const [notes, setNotes] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<UploadableFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const revenueValue = Number(grossRevenue.replace(/[^0-9.]/g, ""));
  const revenueError = grossRevenue.trim() === "" || revenueValue <= 0;
  const payoutEstimate = useMemo(() => {
    if (revenueError) {
      return 0;
    }
    // Example payout rate: 8%
    return Math.round(revenueValue * 0.08);
  }, [revenueError, revenueValue]);

  const hasUploadingFiles = attachedFiles.some((f) => f.status === "uploading");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionState("idle");
    setErrorMessage("");

    if (revenueError) {
      setErrorMessage("Please enter a valid gross revenue amount greater than zero.");
      setSubmissionState("error");
      return;
    }

    if (hasUploadingFiles) {
      setErrorMessage("Please wait for all file uploads to complete before submitting.");
      setSubmissionState("error");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setIsSubmitting(false);
    setSubmissionState("success");
  };

  const hasSubmitted = submissionState === "success";
  const showError = submissionState === "error" && errorMessage;

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-main">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card p-8 md:p-10 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <LocalizedText locale={locale} as="p" className="text-primary font-semibold uppercase tracking-[0.24em] text-xs">
                Startup report
              </LocalizedText>
              <LocalizedText locale={locale} as="h1" className="text-3xl md:text-4xl font-bold leading-tight">
                Report monthly revenue for {TERMINOLOGY.revenueSharePayouts}
              </LocalizedText>
              <LocalizedText locale={locale} as="p" className="text-muted max-w-2xl mt-3 text-sm md:text-base">
                Submit your gross monthly revenue and preview the estimated payout that will drive RevenueShare distributions.
              </LocalizedText>
            </div>
            <Link to="/" className="btn-secondary sm:w-auto">
              Back to Home
            </Link>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
            <section className="glass-card p-6 border-[rgba(148,163,184,0.12)]">
              <h2 className="text-xl font-semibold mb-5">Revenue report details</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className="input-group">
                  <label htmlFor="reportPeriod" className="input-label">
                    Reporting period
                  </label>
                  <select
                    id="reportPeriod"
                    className="input-field"
                    value={reportPeriod}
                    onChange={(event) => setReportPeriod(event.target.value)}
                  >
                    {reportPeriods.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="grossRevenue" className="input-label">
                    Gross revenue
                  </label>
                  <div className="relative">
                    <input
                      id="grossRevenue"
                      name="grossRevenue"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      className={`input-field ${revenueError && submissionState === "error" ? "input-error animate-shake" : ""}`}
                      value={grossRevenue}
                      aria-invalid={revenueError}
                      aria-describedby="grossRevenueHelp"
                      onChange={(event) => setGrossRevenue(event.target.value)}
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">
                      {currency}
                    </span>
                  </div>
                  <p id="grossRevenueHelp" className="text-xs text-muted mt-2">
                    Enter your entire reported revenue for the month in {currency}.
                  </p>
                </div>

                <div className="input-group">
                  <label htmlFor="currency" className="input-label">
                    Currency
                  </label>
                  <select
                    id="currency"
                    className="input-field"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="locale" className="input-label">
                    Locale
                  </label>
                  <select
                    id="locale"
                    className="input-field"
                    value={locale}
                    onChange={(event) => setLocale(event.target.value as SupportedLocale)}
                  >
                    {localeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <RevenueReportUpload
                    notes={notes}
                    onNotesChange={setNotes}
                    onFilesChange={setAttachedFiles}
                    disabled={isSubmitting}
                  />
                </div>

                {showError && (
                  <div className="rounded-2xl border border-[#ef4444] bg-[#4c1d1d] p-4 text-sm text-error" role="alert">
                    {errorMessage}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6">
                  <p className="text-sm text-muted">
                    You can update this report within 24 hours if details change.
                  </p>
                  <button
                    type="submit"
                    className="btn-primary sm:w-auto px-8"
                    disabled={isSubmitting || hasUploadingFiles}
                  >
                    {isSubmitting ? "Submitting…" : hasUploadingFiles ? "Uploading files…" : "Submit report"}
                  </button>
                </div>
              </form>
            </section>

            <aside className="glass-card p-6 border-[rgba(148,163,184,0.12)]">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm text-muted uppercase tracking-[0.2em]">Preview</p>
                  <h2 className="text-xl font-semibold">Payout estimate</h2>
                </div>
                <span className="rounded-full border border-[rgba(148,163,184,0.2)] px-3 py-1 text-xs text-muted">
                  {TERMINOLOGY.revenueSharePayouts}
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-950/60 p-4">
                  <p className="text-sm text-muted">Selected period</p>
                  <p className="mt-1 text-lg font-semibold">{reportPeriods.find((item) => item.value === reportPeriod)?.label}</p>
                  <p className="text-xs text-muted">{formatDate(new Date(reportPeriod + "-01"), locale)}</p>
                </div>

                <div className="rounded-2xl bg-slate-950/60 p-4">
                  <p className="text-sm text-muted">Gross revenue</p>
                  <p className="mt-1 text-lg font-semibold">
                    {revenueError ? "—" : formatCurrency(revenueValue, currency, locale)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/60 p-4">
                  <p className="text-sm text-muted">Estimated payout</p>
                  <p className="mt-1 text-xl font-semibold text-success">
                    {revenueError ? "Enter revenue to preview" : formatCurrency(payoutEstimate, currency, locale)}
                  </p>
                </div>
              </div>

              <div className="border-t border-[rgba(148,163,184,0.1)] mt-6 pt-5">
                <p className="text-sm text-muted">How it works</p>
                <ul className="mt-3 space-y-3 text-sm">
                  <li>• RevenueShare payouts are estimated at 8% of reported gross revenue.</li>
                  <li>• Your report is reviewed before payout execution.</li>
                  <li>• You can upload supporting notes or attach documentation if needed.</li>
                </ul>
              </div>
            </aside>
          </div>

          {hasSubmitted && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-100">
              <h2 className="text-lg font-semibold mb-2">Report submitted</h2>
              <p className="text-sm text-muted mb-4">
                Your revenue report has been successfully received. We will notify you when the {TERMINOLOGY.revenueSharePayouts} calculation is finalized.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-950/80 p-4">
                  <p className="text-xs text-muted uppercase tracking-[0.18em]">Period</p>
                  <p className="mt-2 font-semibold">{reportPeriods.find((item) => item.value === reportPeriod)?.label}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-4">
                  <p className="text-xs text-muted uppercase tracking-[0.18em]">Reported</p>
                  <p className="mt-2 font-semibold">{formatCurrency(revenueValue, currency)}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-4">
                  <p className="text-xs text-muted uppercase tracking-[0.18em]">Payout estimate</p>
                  <p className="mt-2 font-semibold text-success">{formatCurrency(payoutEstimate, currency)}</p>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="rounded-2xl bg-slate-950/80 p-4">
                    <p className="text-xs text-muted uppercase tracking-[0.18em]">Attachments</p>
                    <p className="mt-2 font-semibold">{attachedFiles.filter(f => f.status === "completed").length} file{attachedFiles.filter(f => f.status === "completed").length !== 1 ? "s" : ""} uploaded</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
