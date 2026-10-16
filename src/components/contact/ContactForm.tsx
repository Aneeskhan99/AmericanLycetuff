"use client";

import { CONTACT_TOPICS } from "@/lib/enquiry-options";
import { btnCrimson } from "./ui";
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
} from "./form-kit";

const topics = CONTACT_TOPICS;

const initial: Values = { name: "", phone: "", email: "", topic: "Admissions", message: "" };

function validate(v: Values): Errors {
  return {
    name: rules.name(v.name),
    phone: rules.phone(v.phone),
    email: rules.optionalEmail(v.email),
    message: rules.required(v.message, "Please tell us how we can help."),
  };
}

const label =
  "block text-[13px] font-semibold uppercase leading-[20px] tracking-[2.7083px] text-crimson lg:text-[12px] lg:leading-[15px] lg:tracking-[2.5px]";
const input =
  "block h-[60px] w-full border bg-white px-[19px] text-[16px] text-navy outline-none transition-colors placeholder:text-[#abadb0] focus:border-navy focus-visible:ring-2 focus-visible:ring-navy/20";

function borderFor(err?: string) {
  return err ? "border-crimson" : "border-[#d6d6d6]";
}

export default function ContactForm() {
  const { values, setField, blurField, visibleError, submit, status, serverError, reset } = useEnquiryForm(
    initial,
    validate,
    "contact",
  );
  const submitting = status === "submitting";

  if (status === "success") {
    return (
      <SuccessPanel
        title="Thank you, your message has been sent."
        body="Our team will get back to you promptly. If it is urgent, call us on 0317-1173886 between 7:45 AM and 2:00 PM, Monday to Friday."
        againLabel="Send another message"
        onAgain={reset}
      />
    );
  }

  const field = (name: "name" | "phone" | "email", text: string, type: string, placeholder: string, autoComplete: string) => {
    const err = visibleError(name);
    return (
      <div>
        <label htmlFor={`contact-${name}`} className={label}>
          {text}
        </label>
        <input
          id={`contact-${name}`}
          name={name}
          type={type}
          inputMode={name === "phone" ? "tel" : undefined}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={values[name]}
          onChange={(e) => setField(name, e.target.value)}
          onBlur={() => blurField(name)}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `contact-${name}-error` : undefined}
          aria-required={name !== "email" ? true : undefined}
          className={`${input} ${borderFor(err)} mt-[12px] lg:mt-[11px]`}
        />
        <FieldError id={`contact-${name}-error`} message={err} />
      </div>
    );
  };

  const messageErr = visibleError("message");

  return (
    <form noValidate onSubmit={submit} className="relative" aria-label="Contact form">
      <Honeypot />

      <div className="grid grid-cols-1 gap-x-[21px] gap-y-[26px] md:grid-cols-2">
        {field("name", "Full name", "text", "Your full name", "name")}
        {field("phone", "Phone number", "tel", "Your phone number", "tel")}
        <div className="md:col-span-2">{field("email", "Email (optional)", "email", "name@email.com", "email")}</div>
      </div>

      <fieldset className="mt-[28px] lg:mt-[26px]">
        <legend className={label}>I am enquiring about</legend>
        <div className="mt-[12px] flex flex-col gap-[8px] md:flex-row md:flex-wrap md:gap-[10px] lg:mt-[13px]">
          {topics.map((t) => {
            const selected = values.topic === t;
            return (
              <label
                key={t}
                className={`relative flex cursor-pointer items-center justify-center border px-[16px] py-[13px] text-center text-[14px] font-medium leading-[17px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy md:px-[18px] md:py-[12px] ${
                  selected
                    ? "border-crimson bg-crimson text-white"
                    : "border-[#d6d6d6] bg-white text-navy hover:border-navy"
                }`}
              >
                <input
                  type="radio"
                  name="topic"
                  value={t}
                  checked={selected}
                  onChange={() => setField("topic", t)}
                  className="sr-only"
                />
                {t}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-[26px] lg:mt-[59px]">
        <label htmlFor="contact-message" className={label}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="How can we help?"
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
          onBlur={() => blurField("message")}
          aria-invalid={messageErr ? true : undefined}
          aria-describedby={messageErr ? "contact-message-error" : undefined}
          aria-required
          className={`${input} ${borderFor(messageErr)} mt-[12px] h-[120px] resize-y px-[19px] py-[17px] leading-[24px] lg:mt-[11px] lg:h-[160px]`}
        />
        <FieldError id="contact-message-error" message={messageErr} />
      </div>

      {status === "error" && (
        <div className="mt-[24px]">
          <FormErrorAlert message={serverError} />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting || undefined}
        className={`${btnCrimson} mt-[12px] w-full disabled:cursor-wait disabled:opacity-80 md:w-auto lg:mt-[60px]`}
      >
        {submitting && <Spinner />}
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
