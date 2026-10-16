import type { ImageValue } from "@/lib/content";
import { Rich } from "@/components/site/Rich";
import GalleryImage from "./GalleryImage";
import PhotoButton from "./PhotoButton";
import type { GalleryPhoto } from "./photos";

type Props = {
  eyebrow: string;
  title: string;
  intro: string;
  background: ImageValue & { srcSet?: string };
  front: GalleryPhoto;
  back: GalleryPhoto;
};

/** Figma: Hero (desktop 141:8449, mobile 165:6816). */
export default function Hero({ eyebrow, title, intro, background, front, back }: Props) {
  return (
    <section aria-labelledby="gallery-title" className="relative overflow-hidden bg-navy-ink">
      <div aria-hidden className="absolute inset-0">
        <GalleryImage
          src={background.src}
          srcSet={background.srcSet}
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,30,63,0.1)_0%,rgba(8,30,63,0.15)_4.808%,rgba(8,30,63,0.92)_100%)]" />
      </div>

      <div className="frame gutter relative">
        <div className="relative mx-auto flex w-full max-w-[1498px] flex-col items-center py-[64px] lg:block lg:h-[clamp(620px,48.96vw,940px)] lg:py-0">
          {/* Overlapping framed photos: stacked on mobile, top-right collage on desktop (B sits on top of A).
              Desktop: 300x400 and 260x330 photos with the 10px white frame outside them (Figma outside stroke). */}
          <PhotoButton
            photo={front}
            preload
            sizes="(min-width: 1024px) 320px, 100vw"
            className="h-[445px] w-full border-10 border-white lg:absolute lg:right-0 lg:top-[min(4.167vw,80px)] lg:h-[min(21.875vw,420px)] lg:w-[min(16.667vw,320px)]"
          />
          <PhotoButton
            photo={back}
            preload
            sizes="(min-width: 1024px) 280px, 100vw"
            className="mt-[16px] h-[434px] w-full border-10 border-white lg:absolute lg:right-[min(10.417vw,200px)] lg:top-[min(14.0625vw,270px)] lg:mt-0 lg:h-[min(18.229vw,350px)] lg:w-[min(14.583vw,280px)]"
          />

          <div className="mt-[20px] w-full text-center text-white lg:absolute lg:inset-x-0 lg:bottom-[min(5.104vw,98px)] lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_min(430px,30vw)] lg:items-end lg:gap-x-[40px] lg:text-left">
            <div className="lg:pb-[min(1.9vw,36.5px)]">
              <p className="py-[9px] text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] text-[#fd0] lg:py-0 lg:text-[17.13px] lg:leading-[21px] lg:tracking-[1.9px]">
                {eyebrow}
              </p>
              <h1
                id="gallery-title"
                className="mt-[32px] text-[42px] font-bold leading-[47px] tracking-[-1.2353px] lg:-ml-[0.035em] lg:mt-[19px] lg:max-w-[1100px] lg:text-[min(8.854vw,170px)] lg:leading-[0.941] lg:tracking-[-0.0294em]"
              >
                <Rich text={title} />
              </h1>
            </div>
            <p className="mt-[16px] text-[20px] leading-[31px] tracking-[0.4545px] lg:mt-0 lg:text-[22px] lg:leading-[34px] lg:tracking-[0.5px]">
              <Rich text={intro} />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
