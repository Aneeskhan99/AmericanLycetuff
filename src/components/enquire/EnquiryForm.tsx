"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { CONTACT_TIMES, GRADES, PATHWAYS } from "@/lib/enquiry-options";
import { btnCrimson } from "@/components/contact/ui";
import {
  FieldError,
  FormErrorAlert,
  Honeypot,
  Spinner,
  SuccessPanel,
  rules,
  useEnquiryForm,
  type Errors,
  type Values,
} from "@/components/contact/form-kit";

const contactTimes = [...CONTACT_TIMES];
const grades = [...GRADES];
const pathways = [...PATHWAYS];

/**
 * "/enquire?type=visit" pre-ticks the campus-visit box. The page stays static:
 * the query string is read in the browser after hydration (server snapshot = false).
 */
const noSubscribe = () => () => {};
function useVisitRequested() {
  return useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get("type") === "visit",
    () => false,
  );
}

const initial: Values = {
  name: "",
  phone: "",
  email: "",
  preferredContactTime: "",
  childName: "",
  grade: "",
  pathway: "",
  campusVisit: "", // "" = not touched yet: follows ?type=visit
  message: "",
};

function validate(v: Values): Errors {
  return {
    name: rules.name(v.name, "the parent or guardian's name"),
    phone: rules.phone(v.phone),
    email: rules.optionalEmail(v.email),
  };
}

const control =
  "block h-[60px] w-full border bg-white px-[21px] text-[17px] text-navy outline-none transition-colors focus:border-navy focus-visible:ring-2 focus-visible:ring-navy/20";

function SectionHeading({ num, title, id }: { num: string; title: string; id: string }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center">
      <span aria-hidden className="text-[15px] font-semibold leading-[23px] tracking-[2.1429px] text-crimson lg:w-[44px] lg:shrink-0 lg:text-[14px] lg:leading-normal lg:tracking-[2px]">
        {num}
      </span>
      <h2 id={id} className="mt-[32px] text-[24px] font-medium leading-[29px] text-navy lg:mt-0 lg:text-[30px] lg:leading-[36px]">
        {title}
      </h2>
      <div aria-hidden className="ml-[24px] hidden h-px flex-1 bg-[#d6d6d6] lg:block" />
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  className = "",
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // On desktop each field spans 3 subgrid rows (label / control / error) so side-by-side
    // controls stay aligned even when one label wraps onto two lines.
    <div className={`min-w-0 lg:row-span-3 lg:grid lg:grid-cols-[minmax(0,1fr)] lg:grid-rows-subgrid lg:gap-y-0 ${className}`}>
      <div className="flex flex-col gap-[12px] lg:flex-row lg:items-baseline lg:justify-between lg:gap-[16px] lg:self-end">
        <label
          htmlFor={id}
          className="text-[13px] font-semibold uppercase leading-[20px] tracking-[2.3833px] text-crimson lg:text-[12px] lg:leading-[15px] lg:tracking-[2.2px]"
        >
          {label}
        </label>
        <span
          className={`text-[13px] font-medium uppercase leading-[20px] tracking-[1.0833px] lg:shrink-0 lg:text-[12px] lg:leading-[15px] lg:tracking-[1px] ${
            required ? "text-navy" : "text-[#5c5c5c]"
          }`}
        >
          {required ? "Required" : "Optional"}
        </span>
      </div>
      <div className="mt-[12px] lg:mt-[19px]">{children}</div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export default function EnquiryForm() {
  const visitRequested = useVisitRequested();
  const visitDefault = visitRequested ? "Yes" : "No";
  const { values, setField, blurField, visibleError, submit, status, serverError, reset } = useEnquiryForm(
    initial,
    validate,
    "enquire",
    (v) => ({ ...v, campusVisit: v.campusVisit || visitDefault }),
  );
  const campusVisit = values.campusVisit || visitDefault;
  const submitting = status === "submitting";

  if (status === "success") {
    return (
      <SuccessPanel
        title="Thank you, your enquiry has been received."
        body="Our admissions team will call you back with everything you need to know: programmes, fees, and a campus visit."
        againLabel="Send another enquiry"
        onAgain={reset}
      />
    );
  }

  const text = (
    name: string,
    type: string,
    placeholder: string,
    autoComplete: string,
    required = false,
  ) => {
    const err = visibleError(name);
    return (
      <input
        id={`enq-${name}`}
        name={name}
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={values[name]}
        onChange={(e) => setField(name, e.target.value)}
        onBlur={() => blurField(name)}
        aria-required={required || undefined}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `enq-${name}-error` : undefined}
        className={`${control} ${err ? "border-crimson" : "border-[#d6d6d6]"} placeholder:text-[#5c5c5c]`}
      />
    );
  };

  /**
   * Native <select> (keeps the platform picker) laid transparently over a styled box,
   * so long values like the pathway list can wrap on mobile as in the design.
   */
  const select = (name: string, placeholder: string, options: string[]) => (
    <div className="relative border border-[#d6d6d6] bg-white transition-colors has-[:focus-visible]:border-navy has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy/20">
      <div
        aria-hidden
        className="flex min-h-[58px] items-center py-[16px] pl-[21px] pr-[56px] text-[16px] font-medium leading-[25px] text-navy lg:pr-[46px] lg:text-[clamp(15px,0.89vw,17px)]"
      >
        <span className="min-w-0 lg:truncate">{values[name] || placeholder}</span>
      </div>
      <select
        id={`enq-${name}`}
        name={name}
        value={values[name]}
        onChange={(e) => setField(name, e.target.value)}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Image
        src="/images/enquire/select-caret.svg"
        alt=""
        aria-hidden
        width={12}
        height={8}
        className="pointer-events-none absolute right-[24px] top-1/2 h-[8.25px] w-[12.12px] -translate-y-1/2 rotate-180 lg:right-[24px] min-[1600px]:right-[37px]"
      />
    </div>
  );

  return (
    <form noValidate onSubmit={submit} className="relative" aria-label="Enquiry form">
      <Honeypot />

      {/* 01 About you */}
      <section aria-labelledby="enq-about-you">
        <SectionHeading num="01" title="About you" id="enq-about-you" />
        <div className="mt-[24px] grid grid-cols-1 gap-[18px] lg:mt-[30px] xl:grid-cols-2 lg:gap-x-[20px] lg:gap-y-0 lg:[&>*]:pb-[20px]">
          <Field id="enq-name" label="Parent / guardian name" required error={visibleError("name")} className="xl:col-span-2">
            {text("name", "text", "Your full name", "name", true)}
          </Field>
          <Field id="enq-phone" label="Phone number" required error={visibleError("phone")}>
            {text("phone", "tel", "e.g. 03XX XXXXXXX", "tel", true)}
          </Field>
          <Field id="enq-email" label="Email" error={visibleError("email")}>
            {text("email", "email", "name@example.com", "email")}
          </Field>
          <Field id="enq-preferredContactTime" label="Preferred contact time">
            {select("preferredContactTime", "Morning / Afternoon / Anytime", contactTimes)}
          </Field>
        </div>
      </section>

      {/* 02 About your child */}
      <section aria-labelledby="enq-about-child" className="mt-[26px] lg:mt-[30px]">
        <SectionHeading num="02" title="About your child" id="enq-about-child" />
        <div className="mt-[24px] grid grid-cols-1 gap-[18px] lg:mt-[30px] xl:grid-cols-2 lg:gap-x-[20px] lg:gap-y-0 lg:[&>*]:pb-[20px]">
          <Field id="enq-childName" label="Child's name">
            {text("childName", "text", "Your child's name", "off")}
          </Field>
          <Field id="enq-grade" label="Grade your child is applying for">
            {select("grade", "Play Group … Grade 10", grades)}
          </Field>
          <Field id="enq-pathway" label="Pathway of interest" className="xl:col-span-2">
            {select("pathway", "Not sure yet / FBISE SSC / Cambridge IGCSE / O Level", pathways)}
          </Field>
        </div>
      </section>

      {/* 03 Anything else? */}
      <section aria-labelledby="enq-anything-else" className="mt-[26px] lg:mt-[30px]">
        <SectionHeading num="03" title="Anything else?" id="enq-anything-else" />

        <label className="mt-[24px] flex cursor-pointer flex-col items-start gap-[26px] border border-[#d6d6d6] bg-[#f8f8f8] p-[24px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy lg:mt-[30px] lg:min-h-[76px] lg:flex-row lg:items-center lg:gap-[18px] lg:px-[23px] lg:py-[23px]">
          <input
            type="checkbox"
            name="campusVisit"
            checked={campusVisit === "Yes"}
            onChange={(e) => setField("campusVisit", e.target.checked ? "Yes" : "No")}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="flex size-[28px] shrink-0 items-center justify-center border-2 border-crimson bg-white text-[16px] font-bold leading-none text-transparent transition-colors peer-checked:bg-crimson peer-checked:text-white"
          >
            ✓
          </span>
          <span className="text-[18px] font-medium leading-[28px] text-navy lg:leading-normal">
            I&apos;d also like to book a campus visit
          </span>
        </label>

        <Field id="enq-message" label="Anything else we should know?" className="mt-[18px] lg:mt-[22px]">
          <textarea
            id="enq-message"
            name="message"
            rows={4}
            placeholder="Write your message here…"
            value={values.message}
            onChange={(e) => setField("message", e.target.value)}
            className={`${control} h-[120px] resize-y border-[#d6d6d6] py-[19px] leading-[24px] placeholder:text-[#5c5c5c] lg:h-[130px]`}
          />
        </Field>
      </section>

      {status === "error" && (
        <div className="mt-[24px]">
          <FormErrorAlert message={serverError} />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting || undefined}
        className={`${btnCrimson} mt-[26px] w-full disabled:cursor-wait disabled:opacity-80 lg:mt-[28px] lg:w-auto`}
      >
        {submitting && <Spinner />}
        {submitting ? "Sending…" : "Submit Enquiry"}
      </button>
      <p className="mt-[28px] text-[15px] leading-[23px] tracking-[0.3103px] text-[#5c5c5c] lg:mt-[25px] lg:text-[14.5px] lg:leading-[22px] lg:tracking-[0.3px]">
        We use your details only to respond to your enquiry. We never share them publicly.
      </p>
    </form>
  );
}
