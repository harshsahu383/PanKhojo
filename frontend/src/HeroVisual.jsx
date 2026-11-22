import { ArrowRight, CheckCircle2, ClipboardCheck, Fingerprint, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";

export default function HeroVisual({ onStartRequest }) {
  return (
    <div className="mx-auto w-full max-w-[540px]">
      <section className="overflow-hidden rounded-[24px] border border-[#DCE5EB] bg-white shadow-[0_22px_65px_rgba(23,54,93,.10)]">
        <header className="flex items-center justify-between gap-4 border-b border-[#E8EDF1] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4F1] text-[#173F68] sm:h-14 sm:w-14">
              <Fingerprint size={29} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold tracking-tight text-[#172B43] sm:text-lg">Find your existing PAN</h3>
              <p className="mt-1 text-xs font-medium text-[#8190A2] sm:text-sm">For existing PAN holders only</p>
            </div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#159B83]" aria-label="Privacy focused">
            <ShieldCheck size={24} strokeWidth={2} />
          </span>
        </header>

        <div className="px-5 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-8">
          <p className="text-[13px] leading-7 text-[#64778C] sm:text-sm sm:leading-7">
            Get guided assistance to locate your existing PAN using your Aadhaar number, subject to an authorised verification process.
          </p>

          <div className="mt-6 rounded-2xl border border-[#D6E9E2] bg-[#F0F8F5] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#159B83]" strokeWidth={2.2} />
              <div>
                <h4 className="text-sm font-extrabold text-[#174A43]">PAN finding for existing PAN holders</h4>
                <p className="mt-2 text-xs leading-6 text-[#607B75] sm:text-[13px]">
                  For individuals who have forgotten or misplaced their PAN number. New PAN applications are not included.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartRequest}
            className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#244C79] hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#BDE6DB]"
          >
            Start your request <ArrowRight size={17} />
          </button>

          <div className="mt-6 grid grid-cols-3 divide-x divide-[#E6EBEF] border-t border-[#E6EBEF] pt-5">
            <div className="flex flex-col items-center gap-2 px-1 text-center">
              <ClipboardCheck size={19} className="text-[#159B83]" />
              <span className="text-[10px] font-semibold text-[#61758A] sm:text-[11px]">Clear process</span>
            </div>
            <div className="flex flex-col items-center gap-2 px-1 text-center">
              <WalletCards size={19} className="text-[#159B83]" />
              <span className="text-[10px] font-semibold text-[#61758A] sm:text-[11px]">Transparent pricing</span>
            </div>
            <div className="flex flex-col items-center gap-2 px-1 text-center">
              <LockKeyhole size={19} className="text-[#159B83]" />
              <span className="text-[10px] font-semibold text-[#61758A] sm:text-[11px]">Privacy focused</span>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-[#8190A2]">
        <CheckCircle2 size={14} className="text-[#159B83]" />
        Independent private service · Not a government website
      </div>
    </div>
  );
}
