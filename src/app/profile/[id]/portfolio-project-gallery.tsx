"use client";

import { useEffect, useMemo, useState } from "react";

type PortfolioProjectGalleryProps = {
  title: string;
  description: string;
  imageUrl: string | null;
  imageUrl2: string | null;
};

export default function PortfolioProjectGallery({
  title,
  description,
  imageUrl,
  imageUrl2,
}: PortfolioProjectGalleryProps) {
  const images = useMemo(
    () =>
      [imageUrl, imageUrl2].filter(
        (url): url is string => Boolean(url),
      ),
    [imageUrl, imageUrl2],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const hasMultipleImages = images.length > 1;

  

  useEffect(() => {
    if (!viewerOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setViewerOpen(false);
        return;
      }

      if (images.length < 2) {
        return;
      }

      if (event.key === "ArrowRight") {
        setViewerIndex((current) =>
          current === images.length - 1 ? 0 : current + 1,
        );
      }

      if (event.key === "ArrowLeft") {
        setViewerIndex((current) =>
          current === 0 ? images.length - 1 : current - 1,
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewerOpen, images.length]);

  function nextImage() {
    setCurrentIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  function previousImage() {
    setCurrentIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function openViewer(index: number) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  function nextViewerImage() {
    setViewerIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  function previousViewerImage() {
    setViewerIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-[#e9e1d2] text-sm text-[#173d32]/45">
        Walang larawan
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden">
        <button
          type="button"
          onClick={() => openViewer(currentIndex)}
          className="block w-full cursor-zoom-in"
          aria-label={`View ${title} picture`}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-[#e9e1d2]">
            <img
              src={images[currentIndex]}
              alt={`${title} picture ${currentIndex + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        </button>

     {hasMultipleImages && (
  <>
    <button
      type="button"
      onClick={previousImage}
      aria-label="Previous picture"
      className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/55 text-[#173d32]/60 shadow-sm backdrop-blur-[2px] transition hover:bg-white/75 hover:text-[#173d32]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <button
      type="button"
      onClick={nextImage}
      aria-label="Next picture"
      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/55 text-[#173d32]/60 shadow-sm backdrop-blur-[2px] transition hover:bg-white/75 hover:text-[#173d32]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  </>
)}
    
      </div>

      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewerOpen(false);
            }
          }}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-[#fbf8f1] shadow-2xl lg:flex-row">
            <div className="relative flex min-h-[280px] items-center justify-center bg-black lg:min-h-[680px] lg:flex-1">
              <img
                src={images[viewerIndex]}
                alt={`${title} picture ${viewerIndex + 1}`}
                className="max-h-[72vh] max-w-full object-contain lg:max-h-[92vh]"
              />

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    onClick={previousViewerImage}
                    aria-label="Previous picture"
                 className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white/80 transition hover:bg-white/45 hover:text-white"
                 
                 >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={nextViewerImage}
                    aria-label="Next picture"
                 className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white/80 transition hover:bg-white/45 hover:text-white"
                 
                 
                 >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            <div className="w-full border-t border-[#173d32]/10 bg-[#fbf8f1] p-6 lg:w-[360px] lg:border-l lg:border-t-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-serif text-2xl font-semibold text-[#173d32]">
                    {title}
                  </h2>

                  {hasMultipleImages && (
                    <p className="mt-2 text-sm text-[#173d32]/45">
                      {viewerIndex + 1} / {images.length}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewerOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-[#173d32]/60 transition hover:bg-[#173d32]/8 hover:text-[#173d32]"
                >
                  ×
                </button>
              </div>

              {description && (
                <p className="mt-5 whitespace-pre-line leading-7 text-[#173d32]/70">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}