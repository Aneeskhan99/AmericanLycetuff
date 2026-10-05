"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { isInternal, type ImageValue, type LinkValue } from "@/lib/content";
import { Rich } from "@/components/site/Rich";
import GalleryImage from "./GalleryImage";

type Props = {
  eyebrow: string;
  heading: string;
  text: string;
  button: LinkValue;
  poster: ImageValue & { srcSet?: string };
  /** MP4 URL (editable in Admin → Pages → Gallery). */
  video: string;
  note: string;
};

/** Figma: Take the Campus Tour (desktop 141:8534, mobile 165:6946). */
export default function CampusTour({ eyebrow, heading, text, button, poster, video, note }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <section aria-labelledby="campus-tour-title" className="frame gutter bg-white">
      <div className="mx-auto w-full max-w-[1498px] py-[56px] lg:pb-[110px] lg:pt-[130px]">
        <div className="text-center lg:grid lg:grid-cols-[889fr_609fr] lg:text-left">
          <div>
            <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-black lg:text-[13.1px] lg:leading-[16px] lg:tracking-[2px]">
              {eyebrow}
            </p>
            <h2
              id="campus-tour-title"
              className="mt-[14px] text-[34px] leading-[38px] tracking-[-0.4722px] text-black lg:mt-[20px] lg:text-[clamp(52px,3.75vw,72px)] lg:leading-[1.111] lg:tracking-[-1px]"
            >
              <Rich text={heading} />
            </h2>
          </div>
          <div className="lg:pt-[46px]">
            <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:mt-0 lg:max-w-[360px] lg:leading-[30px]">
              {text}
            </p>
            {button.label && button.href && (
            <Link
              href={button.href}
              {...(isInternal(button.href) ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className="mt-[24px] flex w-full justify-center bg-crimson px-[30px] py-[17px] text-[17.13px] font-medium uppercase leading-[21px] tracking-[1.9px] text-white transition-colors hover:bg-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson lg:mt-[20px] lg:inline-flex lg:w-auto"
            >
              {button.label}
            </Link>
            )}
          </div>
        </div>

        <div className="relative mt-[28px] h-[448px] overflow-hidden bg-navy-ink lg:mt-[59px] lg:aspect-[1498/640] lg:h-auto">
          {playing ? (
            <video
              src={video}
              poster={poster.src}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 size-full bg-black object-cover"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label="Play the campus tour video"
              className="group absolute inset-0 flex size-full cursor-pointer flex-col items-center px-[24px] py-[64px] focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-[#fd0] lg:block lg:p-0"
            >
              <GalleryImage
                src={poster.src}
                srcSet={poster.srcSet}
                alt=""
                fill
                sizes="(min-width: 1024px) min(1498px, 90vw), 100vw"
                className="object-cover"
              />
              <span aria-hidden className="absolute inset-0 bg-[rgba(8,30,63,0.45)]" />

              {/* Play button: 120px crimson circle with a white triangle (desktop only, as in Figma). */}
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 hidden size-[min(6.25vw,120px)] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:scale-110 lg:block"
              >
                <Image
                  src="/images/gallery/play-button-circle.svg"
                  alt=""
                  width={120}
                  height={120}
                  unoptimized
                  className="block size-full"
                />
                <span className="absolute left-1/2 top-[calc(50%+0.48px)] flex h-[36px] w-[32px] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                  <span className="flex-none rotate-90">
                    <span className="relative block h-[32px] w-[36px]">
                      <span className="absolute bottom-1/4 left-[6.7%] right-[6.7%] top-0">
                        <Image
                          src="/images/gallery/play-triangle.svg"
                          alt=""
                          width={31}
                          height={24}
                          unoptimized
                          className="block size-full max-w-none"
                        />
                      </span>
                    </span>
                  </span>
                </span>
              </span>

              {note && (
                <span className="relative text-center text-[13px] font-semibold uppercase leading-[20px] tracking-[2.9545px] text-[#fd0] lg:absolute lg:bottom-[7.3%] lg:left-[40px] lg:text-left lg:text-[11px] lg:leading-[13px] lg:tracking-[2.5px]">
                  {note}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
