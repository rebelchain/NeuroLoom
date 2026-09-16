import {
  useState,
  type ImgHTMLAttributes,
  type VideoHTMLAttributes,
} from "react";

type SectionBackgroundProps = {
  kind: "video" | "image";
  src: string;
  opacity?: number;
  overlay?: string;
  className?: string;
  poster?: string;
  grain?: boolean;
};

export function SectionBackground({
  kind,
  src,
  opacity = 100,
  overlay,
  className = "",
  poster,
  grain = false,
}: SectionBackgroundProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden
        className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      >
        <div className="absolute inset-0 mesh-gradient opacity-70" />
        {overlay && (
          <div className="absolute inset-0" style={{ background: overlay }} />
        )}
      </div>
    );
  }

  const mediaProps = {
    className: "h-full w-full object-cover",
    style: { opacity: opacity / 100 },
    onError: () => setFailed(true),
  };

  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {kind === "video" ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={poster}
          {...(mediaProps as VideoHTMLAttributes<HTMLVideoElement>)}
        >
          <source src={src} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      ) : (
        <img
          src={src}
          alt=""
          {...(mediaProps as ImgHTMLAttributes<HTMLImageElement>)}
        />
      )}
      {overlay && (
        <div className="absolute inset-0" style={{ background: overlay }} />
      )}
      {grain && (
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
      )}
    </div>
  );
}
